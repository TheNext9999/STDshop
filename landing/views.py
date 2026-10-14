# ============================================================
#  landing/views.py
#  Toàn bộ chức năng của trang Landing được tách riêng vào app
#  này (không nằm trong shop/views.py) để sau này mở rộng thêm
#  các trang/tính năng Landing khác mà không đụng vào code shop.
# ============================================================

import json

from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.db.models import F
from django.http import Http404
from django.urls import reverse

# Dùng lại _base_context() của shop để navbar (giỏ hàng, danh mục,
# trạng thái đăng nhập) hiển thị đồng bộ với toàn bộ site.
from shop.views import _base_context

from .models import MarketProduct, MarketReview, MarketWishlist


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

        elif action == 'toggle_sold':
            if can_manage:
                product.is_sold = not product.is_sold
                product.save(update_fields=['is_sold'])
                messages.success(
                    request,
                    'Đã đánh dấu sản phẩm là ĐÃ BÁN.' if product.is_sold else 'Đã mở bán lại sản phẩm.'
                )
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

    ctx = _base_context(request)
    ctx.update({
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
        return redirect('landing:landing_seller')

    ctx = _base_context(request)

    my_products = []
    if request.user.is_authenticated:
        my_products = MarketProduct.objects.filter(seller=request.user)

    ctx.update({
        'category_choices': MarketProduct.CATEGORY_CHOICES,
        'my_products': my_products,
    })
    return render(request, 'shop/landing/landing-seller.html', ctx)