from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [

    # ── Trang chính ──────────────────────────────────────────────────────
    path('',               views.home,           name='home'),
    path('cart/',          views.cart,            name='cart'),
    path('checkout/',      views.checkout,        name='checkout'),
    path('register/',      views.register,        name='register'),
    path('login/',         views.loginPage,        name='login'),
    path('logout/',        views.logoutPage,       name='logout'),
    path('search/',        views.search,           name='search'),
    path('category/',      views.category,         name='category'),
    path('detail/',        views.detail,           name='detail'),

    # ── Giỏ hàng & Thanh toán ────────────────────────────────────────────
    path('update_item/',          views.updateItem,       name='update_item'),
    path('payment/result/',       views.payment_result,   name='payment_result'),

    # ── Tài khoản người dùng ─────────────────────────────────────────────
    path('profile/',              views.profile,           name='profile'),

    # ── Đơn hàng ─────────────────────────────────────────────────────────
    path('orders/',               views.order_history,     name='order_history'),
    path('orders/<int:pk>/',      views.order_detail,      name='order_detail'),
    path('tracking/',             views.order_tracking,    name='order_tracking'),

    # ── Tính năng mua sắm ────────────────────────────────────────────────
    path('wishlist/',             views.wishlist,           name='wishlist'),
    path('post-product/',         views.post_product,       name='post_product'),
    path('my-products/',          views.my_products,        name='my_products'),
    path('compare/',              views.compare,            name='compare'),
    path('flash-sale/',           views.flash_sale,         name='flash_sale'),
    path('voucher/',              views.voucher,            name='voucher'),

    # ── Thông báo ────────────────────────────────────────────────────────
    path('notifications/',        views.notifications,      name='notifications'),

    # ── Nội dung & Thương hiệu ───────────────────────────────────────────
    path('about/',                views.about,              name='about'),
    path('contact/',              views.contact,            name='contact'),
    path('blog/',                 views.blog,               name='blog'),
    path('faq/',                  views.faq,                name='faq'),
    path('policy/',               views.policy,             name='policy'),

    # ── AI Chat API ──────────────────────────────────────────────────────
    path('api/chat/',             views.chat_ai,            name='chat_ai'),

    # ── Quản trị Admin (custom panel) ────────────────────────────────────
    path('admin-panel/',                  views.admin_dashboard,      name='admin_dashboard'),
    path('admin-panel/products/',         views.admin_products,       name='admin_products'),
    path('admin-panel/orders/',           views.admin_orders,         name='admin_orders'),
    path('admin-panel/users/',            views.admin_users,          name='admin_users'),
    path('admin-panel/categories/',       views.admin_categories,     name='admin_categories'),
    path('admin-panel/vouchers/',         views.admin_vouchers,       name='admin_vouchers'),
    path('admin-panel/flash-sale/',       views.admin_flash_sale,     name='admin_flash_sale'),
    path('admin-panel/notifications/',    views.admin_notifications,  name='admin_notifications'),
    path('admin-panel/reviews/',          views.admin_reviews,        name='admin_reviews'),
    path('admin-panel/badges/',           views.admin_badges,         name='admin_badges'),

    # ── Đăng nhập mạng xã hội (Google + Facebook qua django-allauth) ──────
    path('accounts/', include('allauth.urls')),

    # ── Đăng nhập Zalo (viết thủ công vì allauth chưa hỗ trợ sẵn) ─────────
    path('zalo/login/',    views.zalo_login,    name='zalo_login'),
    path('zalo/callback/', views.zalo_callback, name='zalo_callback'),

    # ── Quên mật khẩu — dùng view có sẵn của Django, chỉ định template riêng ──
    path('password-reset/',
         auth_views.PasswordResetView.as_view(template_name='app/password_reset_form.html'),
         name='password_reset'),
    path('password-reset/done/',
         auth_views.PasswordResetDoneView.as_view(template_name='app/password_reset_done.html'),
         name='password_reset_done'),
    path('password-reset-confirm/<uidb64>/<token>/',
         auth_views.PasswordResetConfirmView.as_view(template_name='app/password_reset_confirm.html'),
         name='password_reset_confirm'),
    path('password-reset-complete/',
         auth_views.PasswordResetCompleteView.as_view(template_name='app/password_reset_complete.html'),
         name='password_reset_complete'),
]