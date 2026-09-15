# ============================================================
#  landing/views.py
#  Toàn bộ chức năng của trang Landing được tách riêng vào app
#  này (không nằm trong shop/views.py) để sau này mở rộng thêm
#  các trang/tính năng Landing khác mà không đụng vào code shop.
# ============================================================

import json

from django.shortcuts import render

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
            'img': p.image_url,
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
    """Sàn thanh lý đồ cũ sinh viên (STD Market) - phía người bán (đăng sản
    phẩm, quản lý đơn hàng, ví). HIỆN TẠI: toàn bộ dữ liệu là DEMO tĩnh phía
    client (chưa nối model/database thật) - sẽ nối dần khi mở rộng.
    """
    ctx = _base_context(request)
    return render(request, 'shop/landing/landing-seller.html', ctx)