"""
Context processor — tự động cấp dữ liệu cho MỌI template mà không cần
mỗi view phải tự truyền vào context (giống cách order/cart hoạt động
qua từng view, nhưng cái này áp dụng tự động cho toàn bộ site).

Đăng ký trong settings.py -> TEMPLATES -> OPTIONS -> context_processors.
"""

from .models import Notification


def notifications_processor(request):
    """
    Trả về số lượng thông báo CHƯA ĐỌC của người dùng hiện tại.
    Dùng trong base.html để hiện badge đỏ trên icon chuông thông báo —
    hoạt động trên MỌI trang mà không cần sửa từng view function.
    """
    if request.user.is_authenticated:
        count = Notification.objects.filter(user=request.user, is_read=False).count()
    else:
        count = 0
    return {'unread_notif_count': count}
