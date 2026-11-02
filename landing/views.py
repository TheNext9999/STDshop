# ============================================================
#  landing/views.py
#  Toàn bộ chức năng của trang Landing được tách riêng vào app
#  này (không nằm trong shop/views.py) để sau này mở rộng thêm
#  các trang/tính năng Landing khác mà không đụng vào code shop.
# ============================================================

import json

from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.db.models import F, Count, Q, Avg
from django.http import Http404, JsonResponse
from django.urls import reverse

# Dùng lại _base_context() của shop để navbar (giỏ hàng, danh mục,
# trạng thái đăng nhập) hiển thị đồng bộ với toàn bộ site.
from shop.views import _base_context

from .models import (
    MarketProduct, MarketReview, MarketWishlist, MarketOrder, MarketNotification,
)
from .notifications import notify
from . import services


def landing_home(request):
    """Trang Landing chính. Nội dung thật sẽ được thay khi có thiết kế cụ thể."""
    ctx = _base_context(request)
    return render(request, 'shop/landing/index.html', ctx)


def landing_user(request):
    """Sàn thanh lý đồ cũ sinh viên (STD Market) - phía người mua.

    Card sản phẩm giờ được DJANGO RENDER SẴN ra HTML (qua partial
    market_card.html / market_flash_card.html) thay vì JS tự dựng HTML bằng
    chuỗi template (kiểu Node.js cũ) - JS chỉ còn lo lọc/sắp xếp bằng cách
    ẩn/hiện các thẻ đã có sẵn trong DOM.

    `products_json` vẫn được giữ lại (dùng để mở modal chi tiết sản phẩm khi
    click vào card - tra theo id, không cần gọi thêm request nào).

    Chat, đặt mua/quản lý đơn hàng, đánh giá, khiếu nại VẪN LÀ DEMO tĩnh phía
    client - sẽ nối tiếp khi mở rộng, theo đúng yêu cầu ưu tiên của bạn.
    """
    ctx = _base_context(request)

    products_qs = MarketProduct.objects.filter(is_approved=True, is_sold=False).select_related('seller')
    flash_qs = products_qs.filter(is_flash_sale=True)

    products_data = []
    for p in products_qs:
        seller_name = p.seller.get_full_name() or p.seller.username
        products_data.append({
            'id': p.id,
            'name': p.name,
            'price': p.price,
            'oldPrice': p.old_price or 0,
            'discount': p.discount_percent,
            'condition': p.condition,
            'condLabel': p.condition_label,
            'img': p.ImageURL,
            'seller': seller_name,
            # sellerRating/sellerSales sẽ có giá trị thật khi hệ thống đánh giá/đơn hàng được nối sau.
            'sellerRating': 0,
            'sellerSales': 0,
            'verified': p.is_verified,
            'location': p.location,
            'cat': p.category,
            'flash': p.is_flash_sale,
            'views': p.views,
        })

    ctx.update({
        'products': products_qs,
        'flash_products': flash_qs,
        'products_json': json.dumps(products_data, ensure_ascii=False).replace('</', '<\\/'),
    })
    return render(request, 'shop/landing/landing-user.html', ctx)


def landing_product(request, pk):
    """Trang chi tiết 1 sản phẩm thanh lý trên STD Market.

    Chức năng thật (lưu database):
      - Hiển thị thông tin sản phẩm + người bán, đếm lượt xem (mỗi phiên 1 lần)
      - Lưu / bỏ lưu tin (MarketWishlist)
      - Đánh giá + bình luận (MarketReview): thêm/cập nhật/xóa
      - Chủ tin đánh dấu "đã bán" / mở bán lại
      - Gợi ý sản phẩm cùng danh mục

    Chat với người bán và đặt mua chưa làm (cần model riêng cho tin nhắn/đơn
    hàng) - sẽ bổ sung ở bước sau.
    """
    product = get_object_or_404(MarketProduct.objects.select_related('seller'), pk=pk)

    user = request.user
    is_owner = user.is_authenticated and user == product.seller
    can_manage = is_owner or (user.is_authenticated and user.is_staff)

    # Tin chưa được duyệt: chỉ chủ tin / admin mới xem được
    if not product.is_approved and not can_manage:
        raise Http404("Sản phẩm không tồn tại hoặc đang chờ duyệt.")

    detail_url = reverse('landing:landing_product', args=[product.pk])

    # ==================== XỬ LÝ THAO TÁC (POST) ====================
    if request.method == 'POST':
        if not user.is_authenticated:
            messages.error(request, 'Vui lòng đăng nhập để thực hiện thao tác này.')
            return redirect('login')

        action = request.POST.get('action')
        anchor_suffix = ''

        if action == 'toggle_wish':
            if is_owner:
                messages.error(request, 'Bạn không thể lưu tin của chính mình.')
            else:
                wish, created = MarketWishlist.objects.get_or_create(user=user, product=product)
                if created:
                    messages.success(request, 'Đã lưu tin vào danh sách yêu thích.')
                    notify(product.seller, 'product', 'Có người lưu tin của bạn',
                           f'{user.username} vừa lưu sản phẩm "{product.name}" vào danh sách yêu thích.', detail_url)
                else:
                    wish.delete()
                    messages.success(request, 'Đã bỏ lưu tin này.')

        elif action == 'add_review':
            anchor_suffix = '#reviews'
            if is_owner:
                messages.error(request, 'Bạn không thể đánh giá sản phẩm của chính mình.')
            else:
                try:
                    rating = int(request.POST.get('rating', 0))
                except (TypeError, ValueError):
                    rating = 0
                comment = (request.POST.get('comment') or '').strip()

                if rating not in range(1, 6) or not comment:
                    messages.error(request, 'Vui lòng chọn số sao và nhập nội dung đánh giá.')
                else:
                    _, created = MarketReview.objects.update_or_create(
                        product=product, user=user,
                        defaults={'rating': rating, 'comment': comment},
                    )
                    messages.success(
                        request,
                        'Cảm ơn bạn đã đánh giá!' if created else 'Đã cập nhật đánh giá của bạn.'
                    )
                    if created:
                        notify(product.seller, 'review', f'Đánh giá {rating}★ mới cho sản phẩm của bạn',
                               f'{user.username} đã đánh giá "{product.name}": {comment[:120]}',
                               detail_url + '#reviews')

        elif action == 'delete_review':
            anchor_suffix = '#reviews'
            review_id = request.POST.get('review_id') or ''
            if review_id.isdigit():
                qs = MarketReview.objects.filter(pk=int(review_id), product=product)
                if not user.is_staff:
                    qs = qs.filter(user=user)   # người thường chỉ xóa được đánh giá của chính mình
                deleted, _ = qs.delete()
                if deleted:
                    messages.success(request, 'Đã xóa đánh giá.')
                else:
                    messages.error(request, 'Không tìm thấy đánh giá hoặc bạn không có quyền xóa.')

        elif action == 'place_order':
            anchor_suffix = '#order-box'
            order, msg = services.place_order(
                product, user,
                request.POST.get('receiver_name'), request.POST.get('phone'),
                request.POST.get('address'), request.POST.get('note'),
            )
            (messages.success if order else messages.error)(request, msg)

        elif action == 'cancel_my_order':
            anchor_suffix = '#order-box'
            order_id = request.POST.get('order_id') or ''
            if order_id.isdigit():
                ok, msg = services.cancel_order_by_buyer(int(order_id), user)
            else:
                ok, msg = False, 'Không tìm thấy đơn hàng.'
            (messages.success if ok else messages.error)(request, msg)

        elif action == 'toggle_sold':
            if can_manage:
                ok, msg = services.set_product_sold(product, not product.is_sold)
                (messages.success if ok else messages.error)(request, msg)
            else:
                messages.error(request, 'Bạn không có quyền thực hiện thao tác này.')

        return redirect(detail_url + anchor_suffix)

    # ==================== HIỂN THỊ (GET) ====================
    # Đếm lượt xem: mỗi phiên chỉ tính 1 lần cho mỗi sản phẩm, không tính chủ tin
    if not is_owner:
        viewed = request.session.get('market_viewed', [])
        if product.pk not in viewed:
            MarketProduct.objects.filter(pk=product.pk).update(views=F('views') + 1)
            product.views += 1
            viewed.append(product.pk)
            request.session['market_viewed'] = viewed

    reviews = list(product.reviews.select_related('user'))
    total_reviews = len(reviews)
    average = round(sum(r.rating for r in reviews) / total_reviews, 1) if total_reviews else 0

    star_counts = {s: 0 for s in range(1, 6)}
    for r in reviews:
        star_counts[r.rating] += 1
    rating_bars = [
        {
            'star': s,
            'count': star_counts[s],
            'percent': round(star_counts[s] * 100 / total_reviews) if total_reviews else 0,
        }
        for s in (5, 4, 3, 2, 1)
    ]

    user_review = None
    in_wishlist = False
    if user.is_authenticated:
        user_review = next((r for r in reviews if r.user_id == user.id), None)
        in_wishlist = MarketWishlist.objects.filter(user=user, product=product).exists()

    related = (
        MarketProduct.objects
        .filter(category=product.category, is_approved=True, is_sold=False)
        .exclude(pk=product.pk)
        .select_related('seller')[:4]
    )

    seller_products = MarketProduct.objects.filter(seller=product.seller, is_approved=True)

    # ---- Đặt mua: trạng thái đơn của người xem + sản phẩm có đang được giữ cho người khác không ----
    my_order = None
    if user.is_authenticated and not is_owner:
        my_order = MarketOrder.objects.filter(product=product, buyer=user).order_by('-created_at').first()
    my_order_active = bool(my_order and my_order.is_active)

    holding_qs = MarketOrder.objects.filter(product=product, status__in=MarketOrder.HOLDING_STATUSES)
    holding_other = (holding_qs.exclude(buyer=user) if user.is_authenticated else holding_qs).exists()

    can_order = bool(
        user.is_authenticated and not is_owner and product.is_approved and not product.is_sold
        and not my_order_active and not holding_other
    )

    ctx = _base_context(request)
    ctx.update({
        'my_order': my_order,
        'my_order_active': my_order_active,
        'holding_other': holding_other,
        'can_order': can_order,
        'product': product,
        'seller_name': product.seller.get_full_name() or product.seller.username,
        'is_owner': is_owner,
        'can_manage': can_manage,
        'reviews': reviews,
        'total_reviews': total_reviews,
        'average': average,
        'rating_bars': rating_bars,
        'user_review': user_review,
        'in_wishlist': in_wishlist,
        'wish_count': product.wishlisted_by.count(),
        'related': related,
        'seller_active_count': seller_products.filter(is_sold=False).count(),
        'seller_sold_count': seller_products.filter(is_sold=True).count(),
    })
    return render(request, 'shop/landing/landing-detail.html', ctx)


# Nhãn / class hiển thị trạng thái thẻ sản phẩm ở tab "Sản phẩm" của người bán
LISTING_STATUS = {
    'approved': ('status-approved', '✅ Đang rao', 'approved'),
    'buyer':    ('status-sold',     '💰 Có người mua', 'trading'),
    'shipping': ('status-shipping', '🚚 Đang giao', 'trading'),
    'pending':  ('status-pending',  '⏳ Chờ duyệt', 'pending'),
    'sold':     ('status-draft',    '🏷️ Đã bán', 'sold'),
}


def _flash(request, ok, message):
    (messages.success if ok else messages.error)(request, message)


def _handle_seller_action(request, action):
    """Xử lý mọi thao tác POST ở kênh người bán, rồi quay lại đúng tab đang làm việc."""
    user = request.user
    tab = 'listings'
    ajax = request.headers.get('x-requested-with') == 'XMLHttpRequest'

    if action in ('product_toggle_sold', 'product_delete'):
        tab = 'listings'
        pid = request.POST.get('product_id') or ''
        product = MarketProduct.objects.filter(pk=int(pid), seller=user).first() if pid.isdigit() else None
        if product is None:
            messages.error(request, 'Không tìm thấy sản phẩm hoặc bạn không phải người đăng.')
        elif action == 'product_toggle_sold':
            _flash(request, *services.set_product_sold(product, not product.is_sold))
        else:
            _flash(request, *services.delete_product(product))

    elif action.startswith('order_'):
        tab = 'orders'
        oid = request.POST.get('order_id') or ''
        if oid.isdigit():
            _flash(request, *services.seller_update_order(int(oid), user, action[len('order_'):]))
        else:
            messages.error(request, 'Không tìm thấy đơn hàng.')

    elif action in ('notif_read', 'notif_read_all'):
        tab = 'notifs'
        qs = MarketNotification.objects.filter(user=user, is_read=False)
        if action == 'notif_read':
            nid = request.POST.get('notif_id') or ''
            qs = qs.filter(pk=int(nid)) if nid.isdigit() else qs.none()
        qs.update(is_read=True)
        if ajax:
            return JsonResponse({
                'ok': True,
                'unread': MarketNotification.objects.filter(user=user, is_read=False).count(),
            })
        if action == 'notif_read_all':
            messages.success(request, 'Đã đánh dấu tất cả thông báo là đã đọc.')

    else:
        messages.error(request, 'Thao tác không hợp lệ.')

    if ajax:
        return JsonResponse({'ok': False}, status=400)
    return redirect(reverse('landing:landing_seller') + f'?tab={tab}')


def _seller_dashboard_context(user):
    """Số liệu thật cho kênh người bán: sản phẩm, đơn hàng, thông báo và các con số thống kê."""
    ctx = {
        'my_products': [], 'seller_orders': [], 'notifications': [],
        'listing_counts': {'all': 0, 'approved': 0, 'trading': 0, 'pending': 0, 'sold': 0},
        'order_counts': {'all': 0, 'pending': 0, 'confirmed': 0, 'shipping': 0, 'completed': 0, 'cancelled': 0},
        'notif_unread': 0, 'seller_total_views': 0, 'seller_completion_rate': None,
        'seller_rating': 0, 'seller_review_count': 0,
        'seller_star_classes': ['far fa-star'] * 5,
    }
    if not user.is_authenticated:
        return ctx

    # ---- Sản phẩm ----
    products = list(
        MarketProduct.objects.filter(seller=user)
        .annotate(
            wish_total=Count('wishlisted_by', distinct=True),
            pending_orders=Count('orders', filter=Q(orders__status='pending'), distinct=True),
            holding_orders=Count('orders', filter=Q(orders__status__in=MarketOrder.HOLDING_STATUSES), distinct=True),
            shipping_orders=Count('orders', filter=Q(orders__status='shipping'), distinct=True),
        )
        .order_by('-created_at')
    )
    listing_counts = {'all': len(products), 'approved': 0, 'trading': 0, 'pending': 0, 'sold': 0}
    for p in products:
        if p.is_sold:
            key = 'sold'
        elif not p.is_approved:
            key = 'pending'
        elif p.shipping_orders:
            key = 'shipping'
        elif p.holding_orders or p.pending_orders:
            key = 'buyer'
        else:
            key = 'approved'
        p.status_class, p.status_text, p.filter_key = LISTING_STATUS[key]
        listing_counts[p.filter_key] += 1

    # ---- Đơn hàng ----
    orders = list(MarketOrder.objects.filter(seller=user).select_related('product', 'buyer'))
    order_counts = {'all': len(orders), 'pending': 0, 'confirmed': 0, 'shipping': 0, 'completed': 0, 'cancelled': 0}
    for o in orders:
        order_counts[o.status] += 1
    finished = order_counts['completed'] + order_counts['cancelled']
    completion_rate = round(order_counts['completed'] * 100 / finished) if finished else None

    # ---- Đánh giá của người bán (trung bình các đánh giá trên mọi sản phẩm của họ) ----
    agg = MarketReview.objects.filter(product__seller=user).aggregate(avg=Avg('rating'), n=Count('id'))
    rating = round(agg['avg'], 1) if agg['avg'] else 0
    star_classes = [
        'fas fa-star' if rating >= i else ('fas fa-star-half-alt' if rating >= i - 0.5 else 'far fa-star')
        for i in range(1, 6)
    ]

    ctx.update({
        'my_products': products,
        'seller_orders': orders,
        'notifications': list(MarketNotification.objects.filter(user=user)[:50]),
        'listing_counts': listing_counts,
        'order_counts': order_counts,
        'notif_unread': MarketNotification.objects.filter(user=user, is_read=False).count(),
        'seller_total_views': sum(p.views for p in products),
        'seller_completion_rate': completion_rate,
        'seller_rating': rating,
        'seller_review_count': agg['n'],
        'seller_star_classes': star_classes,
    })
    return ctx


def landing_seller(request):
    """Sàn thanh lý đồ cũ sinh viên (STD Market) - phía người bán.

    ĐÃ NỐI THẬT: form "Đăng sản phẩm mới" lưu vào MarketProduct trong database.
    Các phần còn lại (quản lý đơn hàng, ví, thông báo) VẪN LÀ DEMO tĩnh phía
    client - sẽ nối tiếp khi mở rộng.
    """
    if request.method == 'POST':
        if not request.user.is_authenticated:
            messages.error(request, 'Vui lòng đăng nhập để đăng bán sản phẩm.')
            return redirect('login')

        # Các thao tác ở tab Sản phẩm / Đơn hàng / Thông báo đều gửi kèm `action`
        action = (request.POST.get('action') or '').strip()
        if action:
            return _handle_seller_action(request, action)

        name = (request.POST.get('name') or '').strip()
        price = request.POST.get('price')
        category = request.POST.get('category')
        condition_raw = request.POST.get('condition')
        location = (request.POST.get('location') or '').strip()

        if not name or not price or not category:
            messages.error(request, 'Vui lòng điền đủ Tên sản phẩm, Giá bán và Danh mục.')
            return redirect('landing:landing_seller')

        # Form có 4 nút tình trạng, model chỉ có 3 giá trị -> map lại cho khớp
        # đúng bộ lọc đang dùng ở trang /landing/user/.
        condition_map = {
            'new': 'new',
            '90': 'like-new',
            '70': 'used',
            'minor': 'used',
        }
        condition = condition_map.get(condition_raw, 'used')

        # Gộp lý do thanh lý vào mô tả (model không có field riêng cho lý do).
        description = (request.POST.get('description') or '').strip()
        reason = (request.POST.get('reason') or '').strip()
        custom_reason = (request.POST.get('custom_reason') or '').strip()
        reason_text = custom_reason or reason
        if reason_text:
            description = f"{description}\n\nLý do thanh lý: {reason_text}".strip()

        try:
            price_val = int(price)
        except (TypeError, ValueError):
            messages.error(request, 'Giá bán không hợp lệ.')
            return redirect('landing:landing_seller')

        old_price_raw = request.POST.get('old_price')
        try:
            old_price_val = int(old_price_raw) if old_price_raw else None
        except (TypeError, ValueError):
            old_price_val = None

        product = MarketProduct(
            seller=request.user,
            name=name,
            description=description,
            price=price_val,
            old_price=old_price_val,
            condition=condition,
            category=category,
            location=location,
            brand=(request.POST.get('brand') or '').strip(),
            ship_methods=(request.POST.get('ship_methods') or '').strip(),
            # Sản phẩm mới đăng chờ admin duyệt trước khi hiện ở /landing/user/
            is_approved=False,
        )

        # Người bán có thể chọn nhiều ảnh; model hiện lưu 1 ảnh chính nên lấy
        # ảnh đầu tiên. Muốn lưu đủ nhiều ảnh cần thêm model MarketProductImage.
        images = request.FILES.getlist('images')
        if images:
            product.image = images[0]

        product.save()
        messages.success(request, 'Đã đăng sản phẩm! Sản phẩm đang chờ kiểm duyệt.')
        notify(request.user, 'product', 'Tin đăng đang chờ duyệt',
               f'Sản phẩm "{product.name}" đã được gửi và đang chờ kiểm duyệt. '
               'Bạn sẽ nhận thông báo khi tin được duyệt.',
               reverse('landing:landing_seller') + '?tab=listings')
        return redirect(reverse('landing:landing_seller') + '?tab=listings')

    ctx = _base_context(request)
    ctx['category_choices'] = MarketProduct.CATEGORY_CHOICES
    ctx.update(_seller_dashboard_context(request.user))
    return render(request, 'shop/landing/landing-seller.html', ctx)