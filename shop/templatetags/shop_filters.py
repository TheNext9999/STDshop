from django import template
from django.utils.safestring import mark_safe

register = template.Library()


@register.filter
def vnd(value):
    """Định dạng số thành tiền VNĐ kiểu 8.990.000đ"""
    try:
        value = int(value)
    except (TypeError, ValueError):
        return value
    return f"{value:,}".replace(",", ".") + "đ"


@register.filter
def flash_sale_only(products):
    """Lọc ra các sản phẩm đang Flash Sale (product.is_flash_sale = True)."""
    return [p for p in products if p.is_flash_sale]


@register.filter
def top_sold(products, count=5):
    """Trả về N sản phẩm bán chạy nhất (theo product.sold) - dùng cho 'Gợi ý hôm nay'."""
    try:
        count = int(count)
    except (TypeError, ValueError):
        count = 5
    return sorted(products, key=lambda p: p.sold or 0, reverse=True)[:count]
    """Trả về HTML chuỗi sao (★) khớp với thiết kế .product-card__stars / .star-half"""
    try:
        rating = float(rating)
    except (TypeError, ValueError):
        rating = 0

    full = int(rating)
    half = 1 if (rating - full) >= 0.5 else 0
    empty = max(0, 5 - full - half)

    html = "★" * full
    if half:
        html += '<span class="star-half">★</span>'
    if empty:
        html += f'<span style="color:#e2e5ea">{"★" * empty}</span>'

    return mark_safe(html)