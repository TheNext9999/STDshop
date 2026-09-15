from django.contrib import admin
from .models import MarketProduct


@admin.register(MarketProduct)
class MarketProductAdmin(admin.ModelAdmin):
    list_display = ("name", "seller", "price", "condition", "category", "is_verified", "is_flash_sale", "is_sold", "is_approved", "created_at")
    list_filter = ("condition", "category", "is_verified", "is_flash_sale", "is_sold", "is_approved")
    search_fields = ("name", "seller__username", "location")