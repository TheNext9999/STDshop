from django.db import models
from django.contrib.auth.models import User


class MarketProduct(models.Model):
    """Sản phẩm thanh lý đăng bán trên STD Market (khác hẳn Product của shop
    - đây là đồ CŨ do sinh viên tự đăng bán, không phải hàng mới của shop)."""

    CONDITION_CHOICES = [
        ('new', 'Mới 100%'),
        ('like-new', 'Như mới (95%+)'),
        ('used', 'Đã dùng'),
    ]

    # Khớp đúng 24 danh mục thật đang dùng trong giao diện landing-user.html
    CATEGORY_CHOICES = [
        ('laptop', 'Laptop'), ('phone', 'Điện thoại'), ('tablet', 'Tablet'),
        ('audio', 'Tai nghe / Âm thanh'), ('camera', 'Máy ảnh'),
        ('keyboard', 'Bàn phím / Phụ kiện PC'), ('gaming', 'Gaming'),
        ('clothes', 'Thời trang'), ('shoes', 'Giày dép'), ('bag', 'Balo & Túi'),
        ('accessory', 'Phụ kiện'), ('beauty', 'Mỹ phẩm'),
        ('books', 'Sách vở'), ('course', 'Tài liệu học'), ('study', 'Đồ học tập'),
        ('exam', 'Tài liệu ôn thi'), ('parttime', 'Tài liệu thực tập'),
        ('furniture', 'Nội thất'), ('kitchen', 'Đồ nhà bếp'), ('dorm', 'Đồ ký túc'),
        ('hostel', 'Đồ phòng trọ'), ('electric', 'Đồ điện tử'),
        ('sport', 'Thể thao'), ('bike', 'Xe đạp'), ('food', 'Đồ ăn & Thức uống'),
    ]

    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='market_products')
    name = models.CharField("Tên sản phẩm", max_length=255)
    description = models.TextField("Mô tả", blank=True)

    price = models.PositiveIntegerField("Giá bán (đ)")
    old_price = models.PositiveIntegerField("Giá gốc (đ)", null=True, blank=True)

    condition = models.CharField("Tình trạng", max_length=20, choices=CONDITION_CHOICES, default='used')
    category = models.CharField("Danh mục", max_length=20, choices=CATEGORY_CHOICES)
    location = models.CharField("Khu vực", max_length=100, blank=True)

    image_url = models.URLField("Ảnh chính", max_length=500, blank=True)

    is_verified = models.BooleanField("Người bán đã xác minh", default=False)
    is_flash_sale = models.BooleanField("Đang Flash Sale", default=False)
    is_sold = models.BooleanField("Đã bán", default=False)
    is_approved = models.BooleanField("Đã duyệt hiển thị", default=True)

    views = models.PositiveIntegerField("Lượt xem", default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Sản phẩm thanh lý"
        verbose_name_plural = "Sản phẩm thanh lý"

    def __str__(self):
        return self.name

    @property
    def discount_percent(self):
        if self.old_price and self.old_price > self.price:
            return round((1 - self.price / self.old_price) * 100)
        return 0

    @property
    def condition_label(self):
        return dict(self.CONDITION_CHOICES).get(self.condition, self.condition)