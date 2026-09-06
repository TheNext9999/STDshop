# ============================================================
#  landing/views.py
#  Toàn bộ chức năng của trang Landing được tách riêng vào app
#  này (không nằm trong shop/views.py) để sau này mở rộng thêm
#  các trang/tính năng Landing khác mà không đụng vào code shop.
# ============================================================

from django.shortcuts import render

# Dùng lại _base_context() của shop để navbar (giỏ hàng, danh mục,
# trạng thái đăng nhập) hiển thị đồng bộ với toàn bộ site.
from shop.views import _base_context


def landing_home(request):
    """Trang Landing chính. Nội dung thật sẽ được thay khi có thiết kế cụ thể."""
    ctx = _base_context(request)
    return render(request, 'shop/landing/index.html', ctx)


def landing_user(request):
    """Sàn thanh lý đồ cũ sinh viên (STD Market) - phía người mua.
    HIỆN TẠI: toàn bộ dữ liệu sản phẩm/đơn hàng/chat trong trang này là DEMO
    tĩnh phía client (chưa nối model/database thật) - sẽ nối dần khi mở rộng.
    """
    ctx = _base_context(request)
    return render(request, 'shop/landing/landing-user.html', ctx)