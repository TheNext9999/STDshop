from django.db import models
from django.db.models import Avg
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

    brand = models.CharField("Thương hiệu / Xuất xứ", max_length=100, blank=True)
    ship_methods = models.CharField("Phương thức giao hàng", max_length=255, blank=True)

    # Người bán upload ảnh thật qua form -> lưu file; image_url dùng cho ảnh
    # nhập sẵn bằng link (ví dụ khi thêm nhanh qua Django Admin).
    image = models.ImageField("Ảnh sản phẩm (upload)", upload_to='market/', null=True, blank=True)
    image_url = models.URLField("Ảnh chính (dán link)", max_length=500, blank=True)

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
    def ImageURL(self):
        """Ưu tiên ảnh người bán upload, nếu không có thì dùng link đã dán."""
        try:
            if self.image and self.image.url:
                return self.image.url
        except Exception:
            pass
        return self.image_url or ''

    @property
    def average_rating(self):
        """Điểm đánh giá trung bình (0 nếu chưa có đánh giá)."""
        avg = self.reviews.aggregate(avg=Avg('rating'))['avg']
        return round(avg, 1) if avg else 0

    @property
    def review_count(self):
        return self.reviews.count()

    @property
    def discount_percent(self):
        if self.old_price and self.old_price > self.price:
            return round((1 - self.price / self.old_price) * 100)
        return 0

    @property
    def condition_label(self):
        return dict(self.CONDITION_CHOICES).get(self.condition, self.condition)


class MarketWishlist(models.Model):
    """Tin thanh lý mà người dùng đã bấm "Lưu tin" (yêu thích)."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='market_wishlist')
    product = models.ForeignKey(MarketProduct, on_delete=models.CASCADE, related_name='wishlisted_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')
        ordering = ['-created_at']
        verbose_name = "Tin đã lưu"
        verbose_name_plural = "Tin đã lưu"

    def __str__(self):
        return f"{self.user.username} ♥ {self.product.name}"


class MarketReview(models.Model):
    """Đánh giá + bình luận của người mua cho 1 sản phẩm thanh lý.
    Mỗi người chỉ có 1 đánh giá cho mỗi sản phẩm (gửi lại sẽ là cập nhật)."""
    RATING_CHOICES = [(i, str(i)) for i in range(1, 6)]

    product = models.ForeignKey(MarketProduct, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='market_reviews')
    rating = models.PositiveSmallIntegerField("Số sao", choices=RATING_CHOICES, default=5)
    comment = models.TextField("Nội dung")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('product', 'user')
        ordering = ['-created_at']
        verbose_name = "Đánh giá sản phẩm thanh lý"
        verbose_name_plural = "Đánh giá sản phẩm thanh lý"

    def __str__(self):
        return f"{self.product.name} - {self.rating}★ bởi {self.user.username}"


class MarketOrder(models.Model):
    """Đơn đặt mua 1 sản phẩm thanh lý.
    Luồng: pending (chờ xác nhận) -> confirmed -> shipping -> completed, hoặc cancelled."""

    STATUS_CHOICES = [
        ('pending', 'Chờ xác nhận'),
        ('confirmed', 'Đã xác nhận'),
        ('shipping', 'Đang giao'),
        ('completed', 'Hoàn thành'),
        ('cancelled', 'Đã hủy'),
    ]
    ACTIVE_STATUSES = ('pending', 'confirmed', 'shipping')   # đơn còn đang xử lý
    HOLDING_STATUSES = ('confirmed', 'shipping')             # đang giữ hàng cho đúng 1 người mua

    PLATFORM_FEE_PERCENT = 2

    # PROTECT: không cho xóa sản phẩm đã có đơn (tránh mất lịch sử giao dịch)
    product = models.ForeignKey(MarketProduct, on_delete=models.PROTECT, related_name='orders')
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='market_orders_bought')
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='market_orders_sold')

    price = models.PositiveIntegerField("Giá chốt (đ)")
    receiver_name = models.CharField("Người nhận", max_length=100)
    phone = models.CharField("Số điện thoại", max_length=20)
    address = models.CharField("Địa chỉ nhận hàng", max_length=255)
    note = models.TextField("Ghi chú", blank=True)

    status = models.CharField("Trạng thái", max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Đơn hàng thanh lý"
        verbose_name_plural = "Đơn hàng thanh lý"

    def __str__(self):
        return f"{self.order_code} - {self.product.name}"

    @property
    def order_code(self):
        return f"#STD{self.pk:04d}"

    @property
    def status_label(self):
        return dict(self.STATUS_CHOICES).get(self.status, self.status)

    @property
    def status_class(self):
        return {
            'pending': 'os-pending', 'confirmed': 'os-buyer', 'shipping': 'os-shipping',
            'completed': 'os-done', 'cancelled': 'os-cancel',
        }.get(self.status, 'os-pending')

    @property
    def status_icon(self):
        return {
            'pending': 'fa-clock', 'confirmed': 'fa-check', 'shipping': 'fa-truck',
            'completed': 'fa-check-double', 'cancelled': 'fa-times',
        }.get(self.status, 'fa-clock')

    @property
    def is_active(self):
        return self.status in self.ACTIVE_STATUSES

    @property
    def platform_fee(self):
        return self.price * self.PLATFORM_FEE_PERCENT // 100

    @property
    def seller_receive(self):
        return self.price - self.platform_fee


class MarketNotification(models.Model):
    """Thông báo của STD Market gửi tới người dùng (đơn hàng, sản phẩm, đánh giá...).
    Tách riêng với Notification của STDShop để 2 hệ thống độc lập."""

    KIND_CHOICES = [
        ('order', 'Đơn hàng'),
        ('product', 'Sản phẩm'),
        ('review', 'Đánh giá'),
        ('system', 'Hệ thống'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='market_notifications')
    kind = models.CharField("Loại", max_length=20, choices=KIND_CHOICES, default='system')
    title = models.CharField("Tiêu đề", max_length=200)
    message = models.TextField("Nội dung", blank=True)
    link = models.CharField("Liên kết", max_length=300, blank=True)
    is_read = models.BooleanField("Đã đọc", default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Thông báo STD Market"
        verbose_name_plural = "Thông báo STD Market"

    def __str__(self):
        return f"{self.user.username}: {self.title}"

    @property
    def icon_class(self):
        return {'order': 'fa-shopping-bag', 'product': 'fa-check-circle',
                'review': 'fa-star', 'system': 'fa-bell'}.get(self.kind, 'fa-bell')

    @property
    def color_class(self):
        return {'order': 'cyan', 'product': 'green', 'review': 'orange', 'system': 'blue'}.get(self.kind, 'blue')