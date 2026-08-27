from django.db import models
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm

# Create your models here.
class Catergory(models.Model):
    sub_category = models.ForeignKey('self', on_delete=models.CASCADE, related_name = 'sub_categories', null = True, blank = True)
    is_sub = models.BooleanField(default=False)
    name = models.CharField(max_length=200, null=True)
    slug = models.SlugField(max_length=200, unique=True)

    def __str__(self):
        return self.name

class CreateUserForm(UserCreationForm):
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password1', 'password2']

    
class Product(models.Model):
    catergory = models.ManyToManyField(Catergory, related_name='product')
    name = models.CharField(max_length=200, null=True)
    price = models.FloatField()
    digital = models.BooleanField(default=False, null=True, blank=False)
    image = models.ImageField(null=True, blank=True)
    detail = models.TextField(null=True, blank=True)

    # ── Bổ sung cho Flash Sale & quản lý kho ──
    stock = models.IntegerField(default=100, null=True, blank=True)
    sold = models.IntegerField(default=0, null=True, blank=True)
    discount_percent = models.IntegerField(default=0, null=True, blank=True)  # 0-100, >0 nghĩa là đang giảm giá
    is_flash_sale = models.BooleanField(default=False)

    # ── Bổ sung cho tính năng khách hàng tự đăng bán sản phẩm ──
    # seller = None nghĩa là sản phẩm của SHOP (do admin đăng qua /admin-panel/products/).
    # seller = User nghĩa là sản phẩm do CHÍNH KHÁCH HÀNG đó đăng bán.
    seller = models.ForeignKey(
        User, on_delete=models.CASCADE,
        null=True, blank=True, related_name='posted_products'
    )
    date_posted = models.DateTimeField(auto_now_add=True)
    is_approved = models.BooleanField(default=True)  # admin có thể ẩn sản phẩm khách đăng nếu không phù hợp

    def __str__(self):
        return self.name
    @property
    def ImageURL(self):
        try:
            url = self.image.url
        except:
            url = ''
        return url

    @property
    def sale_price(self):
        """Giá sau khi áp dụng giảm giá (dùng cho Flash Sale)."""
        if self.discount_percent and self.discount_percent > 0:
            return round(self.price * (100 - self.discount_percent) / 100, 2)
        return self.price

    @property
    def sold_percent(self):
        """Phần trăm đã bán so với (đã bán + còn lại), dùng cho thanh tiến độ Flash Sale."""
        total = (self.sold or 0) + (self.stock or 0)
        if total <= 0:
            return 0
        return min(100, round((self.sold or 0) / total * 100))

    @property
    def average_rating(self):
        """Điểm đánh giá trung bình (1-5) — chỉ tính bình luận gốc đã được duyệt (không tính reply). 0 nếu chưa có đánh giá."""
        reviews = self.review_set.filter(is_approved=True, parent__isnull=True)
        if not reviews.exists():
            return 0
        total = sum([r.rating for r in reviews])
        return round(total / reviews.count(), 1)

    @property
    def review_count(self):
        """Tổng số lượt đánh giá gốc đã được duyệt của sản phẩm (không tính reply)."""
        return self.review_set.filter(is_approved=True, parent__isnull=True).count()

    
class Order(models.Model):
    customer = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True)
    date_order = models.DateTimeField(auto_now_add=True)
    name = models.CharField(max_length=200, null=True)
    complete = models.BooleanField(default=False, null=True, blank=False)
    trasaction_id = models.CharField(max_length=200, null=True)

    # ── Bổ sung trạng thái đơn hàng chi tiết ──
    STATUS_CHOICES = [
        ('pending', 'Chờ xác nhận'),
        ('processing', 'Đang xử lý'),
        ('shipping', 'Đang giao'),
        ('delivered', 'Đã giao'),
        ('cancelled', 'Đã hủy'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    def __str__(self):
        return str(self.id)
    @property
    def get_cart_items(self):
        orderitems = self.orderitem_set.all()
        total = sum([item.quantity for item in orderitems])
        return total
    
    @property
    def get_cart_total(self):
        orderitems = self.orderitem_set.all()
        total = sum([item.get_total for item in orderitems])
        return total
    
class OrderItem(models.Model):
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, blank=True, null=True)
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, blank=True, null=True)
    quantity = models.IntegerField(default=0, null=True, blank=True)
    date_added = models.DateTimeField(auto_now_add=True)

    @property
    def get_total(self):
        total = self.product.price * self.quantity
        return total

class ShippingAddress(models.Model):
    customer = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True)
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, blank=True, null=True)
    address = models.CharField(max_length=200, null=True)
    city = models.CharField(max_length=200, null=True)
    state = models.CharField(max_length=200, null=True)
    mobile = models.CharField(max_length=10, null=True)
    date_added = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.address


# ============================================================
#  MODEL MỚI — bổ sung để các trang Wishlist, Voucher,
#  Notification, Contact hoạt động thật (không còn try/except)
# ============================================================

class Wishlist(models.Model):
    """Danh sách yêu thích — mỗi dòng là 1 sản phẩm 1 user đã lưu."""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    date_added = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')   # tránh lưu trùng 1 sản phẩm 2 lần

    def __str__(self):
        return f'{self.user.username} ♥ {self.product.name}'


class Voucher(models.Model):
    """Mã giảm giá của từng người dùng."""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=30)
    name = models.CharField(max_length=200, null=True, blank=True)
    discount = models.IntegerField(default=10)          # % giảm giá
    min_order = models.FloatField(default=0)            # đơn tối thiểu để áp dụng
    expiry = models.DateField(null=True, blank=True)
    is_used = models.BooleanField(default=False)
    date_added = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.code} ({self.user.username})'


class Notification(models.Model):
    """Thông báo gửi tới người dùng (đơn hàng, khuyến mãi, hệ thống)."""
    TYPE_CHOICES = [
        ('order', 'Đơn hàng'),
        ('promo', 'Khuyến mãi'),
        ('system', 'Hệ thống'),
        ('warning', 'Cảnh báo'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='system')
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    @property
    def icon(self):
        """Class icon FontAwesome tương ứng loại thông báo — dùng trực tiếp trong template."""
        return {
            'order': 'fas fa-truck',
            'promo': 'fas fa-percentage',
            'system': 'fas fa-info-circle',
            'warning': 'fas fa-exclamation-triangle',
        }.get(self.type, 'fas fa-bell')


class ContactMessage(models.Model):
    """Tin nhắn khách hàng gửi từ trang Liên hệ."""
    name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=20, null=True, blank=True)
    subject = models.CharField(max_length=200, null=True, blank=True)
    message = models.TextField()
    is_resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} — {self.subject or "Liên hệ"}'


class Review(models.Model):
    """Đánh giá sao + bình luận của khách hàng cho sản phẩm. Hỗ trợ trả lời lồng nhau (1 cấp)."""
    RATING_CHOICES = [(i, str(i)) for i in range(1, 6)]

    product    = models.ForeignKey(Product, on_delete=models.CASCADE)
    user       = models.ForeignKey(User, on_delete=models.CASCADE)
    rating     = models.IntegerField(choices=RATING_CHOICES, default=5)
    comment    = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    edited_at  = models.DateTimeField(null=True, blank=True)   # khác None nếu đã từng sửa

    # ── Trả lời bình luận — parent=None nghĩa là bình luận gốc ──
    parent = models.ForeignKey(
        'self', on_delete=models.CASCADE,
        null=True, blank=True, related_name='replies'
    )

    # ── Ghim bình luận nổi bật lên đầu ──
    is_pinned = models.BooleanField(default=False)

    # ── Kiểm duyệt nội dung — admin có thể ẩn bình luận không phù hợp ──
    is_approved   = models.BooleanField(default=True)   # False = đã bị admin ẩn
    is_flagged    = models.BooleanField(default=False)  # True = bị đánh dấu cần xem xét
    admin_note    = models.CharField(max_length=255, null=True, blank=True)  # ghi chú lý do ẩn

    class Meta:
        ordering = ['-is_pinned', '-created_at']
        # Lưu ý: không dùng unique_together ở đây vì reply cũng thuộc (product,user).
        # Việc chặn đánh giá gốc trùng lặp được kiểm tra thủ công trong views.py
        # (chỉ áp dụng cho bình luận gốc, parent=None).

    def __str__(self):
        return f'{self.product.name} — {self.rating}★ bởi {self.user.username}'

    @property
    def like_count(self):
        return self.reactions.filter(reaction='like').count()

    @property
    def dislike_count(self):
        return self.reactions.filter(reaction='dislike').count()


class ReviewReaction(models.Model):
    """Like / Dislike của người dùng cho 1 bình luận."""
    REACTION_CHOICES = [('like', 'Thích'), ('dislike', 'Không thích')]

    review     = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='reactions')
    user       = models.ForeignKey(User, on_delete=models.CASCADE)
    reaction   = models.CharField(max_length=10, choices=REACTION_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('review', 'user')   # mỗi user chỉ được 1 phản ứng / bình luận

    def __str__(self):
        return f'{self.user.username} — {self.reaction} — review #{self.review_id}'


class Badge(models.Model):
    """
    Huy hiệu do admin tạo và gán cho người dùng (Mod, VIP, Kim Cương,
    Thành viên mới, ...). Admin tự đặt tên và màu sắc tùy ý.
    """
    name       = models.CharField(max_length=50)
    color      = models.CharField(max_length=20, default='#3B82F6')   # màu nền huy hiệu (hex)
    text_color = models.CharField(max_length=20, default='#FFFFFF')   # màu chữ
    icon       = models.CharField(max_length=10, null=True, blank=True)  # emoji hoặc icon ngắn
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class UserBadge(models.Model):
    """Gán huy hiệu cho 1 người dùng cụ thể — 1 user có thể có nhiều huy hiệu."""
    user        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_badges')
    badge       = models.ForeignKey(Badge, on_delete=models.CASCADE)
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'badge')
        ordering = ['-assigned_at']

    def __str__(self):
        return f'{self.user.username} — {self.badge.name}'