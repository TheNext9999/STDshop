# ============================================================
#  landing/notifications.py
#  Hàm tạo thông báo STD Market dùng chung cho mọi view/admin của app landing.
# ============================================================

from .models import MarketNotification


def notify(user, kind, title, message='', link=''):
    """Tạo 1 thông báo cho `user`. Bỏ qua nếu không có người nhận."""
    if user is None:
        return None
    return MarketNotification.objects.create(
        user=user, kind=kind, title=title[:200], message=message, link=link[:300],
    )
