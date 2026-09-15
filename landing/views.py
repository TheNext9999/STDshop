# ============================================================
#  landing/views.py
#  Toàn bộ chức năng của trang Landing được tách riêng vào app
#  này (không nằm trong shop/views.py) để sau này mở rộng thêm
#  các trang/tính năng Landing khác mà không đụng vào code shop.
# ============================================================

import json

from django.shortcuts import render, redirect
from django.contrib import messages

# Dùng lại _base_context() của shop để navbar (giỏ hàng, danh mục,
# trạng thái đăng nhập) hiển thị đồng bộ với toàn bộ site.
from shop.views import _base_context

from .models import MarketProduct


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