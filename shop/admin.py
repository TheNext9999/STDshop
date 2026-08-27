from django.contrib import admin
from .models import *

# Register your models here.
admin.site.register(Product)
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(ShippingAddress)
admin.site.register(Catergory)

# ── Model mới — đăng ký để quản lý qua /admin/ ──
admin.site.register(Wishlist)
admin.site.register(Voucher)
admin.site.register(Notification)
admin.site.register(ContactMessage)
admin.site.register(Review)
admin.site.register(Badge)
admin.site.register(UserBadge)
admin.site.register(ReviewReaction)