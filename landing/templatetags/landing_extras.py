from django import template
from django.utils import timezone

register = template.Library()


@register.filter
def time_ago(value):
    """Hiển thị thời gian kiểu tiếng Việt: 'vừa xong', '5 phút trước', '2 giờ trước'...
    (filter timesince mặc định của Django ra tiếng Anh vì LANGUAGE_CODE của dự án là en-us)."""
    if not value:
        return ''
    seconds = int((timezone.now() - value).total_seconds())
    if seconds < 60:
        return 'vừa xong'
    minutes = seconds // 60
    if minutes < 60:
        return f'{minutes} phút trước'
    hours = minutes // 60
    if hours < 24:
        return f'{hours} giờ trước'
    days = hours // 24
    if days < 7:
        return f'{days} ngày trước'
    return timezone.localtime(value).strftime('%d/%m/%Y')
