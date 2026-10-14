from django.contrib import admin
from .models import MarketProduct, MarketReview, MarketWishlist


@admin.register(MarketProduct)
class MarketProductAdmin(admin.ModelAdmin):
    list_display = ("name", "seller", "price", "condition", "category", "is_verified", "is_flash_sale", "is_sold", "is_approved", "created_at")
    list_filter = ("condition", "category", "is_verified", "is_flash_sale", "is_sold", "is_approved")
    search_fields = ("name", "seller__username", "location")


@admin.register(MarketReview)
class MarketReviewAdmin(admin.ModelAdmin):
    list_display = ("product", "user", "rating", "created_at")
    list_filter = ("rating",)
    search_fields = ("product__name", "user__username", "comment")


@admin.register(MarketWishlist)
class MarketWishlistAdmin(admin.ModelAdmin):
    list_display = ("user", "product", "created_at")
    search_fields = ("user__username", "product__name")