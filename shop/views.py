# ============================================================
#  views.py — Lotus Shop
#  Mọi chức năng đã được kết nối ĐẦY ĐỦ với model thật,
#  không còn try/except né tránh model thiếu.
# ============================================================

from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponse, JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib import messages
from django.conf import settings
import requests
from django.db.models import Sum, Q
from django.utils import timezone
from django.conf import settings

from .models import *

import json
import os

# AI imports (giữ nguyên)
from django.contrib.auth.forms import UserCreationForm
from openai import OpenAI


# ============================================================
#  HELPER — tái sử dụng cho mọi view cần order/cart
# ============================================================
def _get_cart_context(request):
    """Trả về dict chứa order, items, cartItems cho user đã/chưa login."""
    if request.user.is_authenticated:
        order, _ = Order.objects.get_or_create(
            customer=request.user, complete=False
        )
        items     = order.orderitem_set.all()
        cartItems = order.get_cart_items
    else:
        order     = {'get_cart_items': 0, 'get_cart_total': 0}
        items     = []
        cartItems = 0
    return {'order': order, 'items': items, 'cartItems': cartItems}


def _get_wishlisted_ids(request):
    """
    Trả về set các product.id mà user hiện tại đã yêu thích —
    dùng trong template để hiện nút tim đặc/rỗng đúng trạng thái
    trên card sản phẩm (home, category, search...).
    """
    if request.user.is_authenticated:
        return set(Wishlist.objects.filter(user=request.user).values_list('product_id', flat=True))
    return set()


def _base_context(request):
    """Context tối thiểu cho mọi trang mới (navbar cần categories + order)."""
    categories = Catergory.objects.filter(is_sub=False)
    ctx = _get_cart_context(request)
    return {**ctx, 'categories': categories}


# ============================================================
#  TRANG GỐC (giữ nguyên hoàn toàn logic gốc của bạn)
# ============================================================

def home(request):
    if request.user.is_authenticated:
        customer = request.user
        order, created = Order.objects.get_or_create(customer=customer, complete=False)
        items = order.orderitem_set.all()
        cartItems = order.get_cart_items
        user_login = 'visible'
        user_notlogin = 'hidden'
    else:
        items = []
        order = {'get_cart_items': 0, 'get_cart_total': 0}
        cartItems = order['get_cart_items']
        user_login = 'hidden'
        user_notlogin = 'visible'

    categories = Catergory.objects.filter(is_sub=False)
    products = Product.objects.filter(is_approved=True)
    context = {
        'products': products, 'cartItems': cartItems,
        'user_login': user_login, 'user_notlogin': user_notlogin,
        'categories': categories, 'order': order,
        'wishlisted_ids': _get_wishlisted_ids(request),
    }
    return render(request, 'shop/index.html', context)


def cart(request):
    if request.user.is_authenticated:
        customer = request.user
        order, created = Order.objects.get_or_create(customer=customer, complete=False)
        items = order.orderitem_set.all()
        cartItems = order.get_cart_items
        user_login = 'visible'
        user_notlogin = 'hidden'
    else:
        items = []
        order = {'get_cart_items': 0, 'get_cart_total': 0}
        cartItems = order['get_cart_items']
        user_login = 'hidden'
        user_notlogin = 'visible'

    categories = Catergory.objects.filter(is_sub=False)
    context = {
        'items': items, 'order': order, 'cartItems': cartItems,
        'user_login': user_login, 'user_notlogin': user_notlogin,
        'categories': categories,
    }
    return render(request, 'shop/cart.html', context)


def checkout(request):
    """
    Trang thanh toán.
    Đã thêm xử lý POST: tạo ShippingAddress, đánh dấu order hoàn tất,
    gán trasaction_id, chuyển sang trang kết quả thanh toán.
    """
    if request.user.is_authenticated:
        customer = request.user
        order, created = Order.objects.get_or_create(customer=customer, complete=False)
        items = order.orderitem_set.all()
        cartItems = order.get_cart_items
        user_login = 'visible'
        user_notlogin = 'hidden'
    else:
        items = []
        order = {'get_cart_items': 0, 'get_cart_total': 0}
        cartItems = order['get_cart_items']
        user_login = 'hidden'
        user_notlogin = 'visible'

    # ── Xử lý đặt hàng khi submit form checkout ──
    if request.method == 'POST' and request.user.is_authenticated:
        name    = request.POST.get('name', '').strip()
        email   = request.POST.get('email', '').strip()
        address = request.POST.get('address', '').strip()
        city    = request.POST.get('city', '').strip()
        state   = request.POST.get('state', '').strip()
        mobile  = request.POST.get('mobile', '').strip()

        if order.get_cart_items > 0:
            # Lưu thông tin giao hàng
            ShippingAddress.objects.create(
                customer=customer, order=order,
                address=address, city=city, state=state, mobile=mobile,
            )
            # Hoàn tất đơn hàng
            order.name = name
            order.complete = True
            order.status = 'pending'
            order.trasaction_id = f'TXN{order.id}{int(order.date_order.timestamp()) if order.date_order else ""}'
            order.save()

            request.session['payment_success'] = True
            request.session['last_order_id'] = order.id
            return redirect('payment_result')
        else:
            messages.error(request, 'Giỏ hàng của bạn đang trống!')

    categories = Catergory.objects.filter(is_sub=False)
    context = {
        'items': items, 'order': order, 'cartItems': cartItems,
        'user_login': user_login, 'user_notlogin': user_notlogin,
        'categories': categories,
    }
    return render(request, 'shop/checkout.html', context)


def register(request):
    form = CreateUserForm()
    if request.method == 'POST':
        form = CreateUserForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('login')
    context = {'form': form, 'active_tab': 'register'}
    return render(request, 'shop/account/auth.html', context)


def loginPage(request):
    if request.user.is_authenticated:
        return redirect('home')
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('home')
        else:
            messages.info(request, 'Tên đăng nhập hoặc mật khẩu không đúng')
    return render(request, 'shop/account/auth.html', {'active_tab': 'login'})


def logoutPage(request):
    logout(request)
    return redirect('login')


def search(request):
    searched = ''
    keys = Product.objects.none()

    if request.method == 'POST':
        searched = request.POST['searched']
        keys = Product.objects.filter(name__contains=searched, is_approved=True)

    if request.user.is_authenticated:
        customer = request.user
        order, created = Order.objects.get_or_create(customer=customer, complete=False)
        items = order.orderitem_set.all()
        cartItems = order.get_cart_items
    else:
        items = []
        order = {'get_cart_items': 0, 'get_cart_total': 0}
        cartItems = order['get_cart_items']

    categories = Catergory.objects.filter(is_sub=False)
    products = Product.objects.filter(is_approved=True)
    context = {
        'keys': keys, 'searched': searched,
        'products': products, 'cartItems': cartItems,
        'categories': categories, 'order': order,
        'wishlisted_ids': _get_wishlisted_ids(request),
    }
    return render(request, 'shop/search.html', context)


def search_suggest(request):
    """API gợi ý tìm kiếm trực tiếp khi gõ (live search) - TÍNH NĂNG MỚI,
    không có trong dự án gốc. Trả JSON, không render template.
    """
    q = request.GET.get('q', '').strip()
    if not q:
        return JsonResponse({'results': [], 'total': 0})

    qs = Product.objects.filter(name__icontains=q, is_approved=True)
    total = qs.count()

    results = []
    for p in qs[:6]:
        results.append({
            'id': p.id,
            'name': p.name,
            'image': p.ImageURL,
            'price': p.sale_price,
        })

    return JsonResponse({'results': results, 'total': total})


def category(request):
    categories = Catergory.objects.filter(is_sub=False)
    active_category = request.GET.get('category', '')
    products = Product.objects.none()
    if active_category:
        products = Product.objects.filter(catergory__slug=active_category, is_approved=True)

    ctx = _get_cart_context(request)
    context = {
        'categories': categories, 'products': products,
        'active_category': active_category, **ctx,
        'wishlisted_ids': _get_wishlisted_ids(request),
    }
    return render(request, 'shop/category.html', context)


def detail(request):
    if request.user.is_authenticated:
        customer = request.user
        order, created = Order.objects.get_or_create(customer=customer, complete=False)
        items = order.orderitem_set.all()
        cartItems = order.get_cart_items
        user_login = 'visible'
        user_notlogin = 'hidden'
    else:
        items = []
        order = {'get_cart_items': 0, 'get_cart_total': 0}
        cartItems = order['get_cart_items']
        user_login = 'hidden'
        user_notlogin = 'visible'

    id = request.GET.get('id', '')
    products = Product.objects.filter(id=id)
    categories = Catergory.objects.filter(is_sub=False)
    product = products.first()

    # ── Sản phẩm chưa được duyệt (is_approved=False): chỉ chủ sở hữu hoặc
    #    admin mới xem được (để tự xem trước bài đăng của mình) — khách
    #    thường và các user khác sẽ không thấy, tránh lộ ra công khai. ──
    if product and not product.is_approved:
        is_owner_or_staff = request.user.is_authenticated and (
            request.user.id == product.seller_id or request.user.is_staff
        )
        if not is_owner_or_staff:
            products = Product.objects.none()
            product = None

    # ── Kiểm tra sản phẩm đã có trong wishlist của user chưa (để hiện nút Thêm/Đã thêm) ──
    in_wishlist = False
    if request.user.is_authenticated and product:
        in_wishlist = Wishlist.objects.filter(user=request.user, product=product).exists()

    user_has_reviewed = False

    if product:
        # ══════════════════════════════════════════════════════
        #  XỬ LÝ CÁC HÀNH ĐỘNG POST LIÊN QUAN ĐẾN BÌNH LUẬN
        #  action: submit_review / reply / edit_comment / delete_comment / like / dislike
        # ══════════════════════════════════════════════════════
        if request.method == 'POST' and request.user.is_authenticated:
            action = request.POST.get('action', 'submit_review')

            # ── Gửi đánh giá gốc mới (kèm sao) ──
            if action == 'submit_review':
                rating  = request.POST.get('rating', 5)
                comment = request.POST.get('comment', '').strip()
                already_reviewed = Review.objects.filter(
                    product=product, user=request.user, parent__isnull=True
                ).exists()
                if already_reviewed:
                    messages.error(request, 'Bạn đã đánh giá sản phẩm này rồi.')
                elif comment:
                    Review.objects.create(
                        product=product, user=request.user,
                        rating=int(rating), comment=comment, parent=None
                    )
                    messages.success(request, 'Cảm ơn bạn đã đánh giá sản phẩm!')
                else:
                    messages.error(request, 'Vui lòng nhập nội dung đánh giá.')
                return redirect(f"{request.path}?id={product.id}#reviews-section")

            # ── Trả lời 1 bình luận (không cần chọn sao) ──
            elif action == 'reply':
                parent_id = request.POST.get('parent_id')
                comment   = request.POST.get('comment', '').strip()
                parent_review = get_object_or_404(Review, id=parent_id, product=product)
                if comment:
                    Review.objects.create(
                        product=product, user=request.user,
                        comment=comment, parent=parent_review
                    )
                    # Thông báo cho chủ bình luận gốc (nếu không phải tự trả lời chính mình)
                    if parent_review.user_id != request.user.id:
                        Notification.objects.create(
                            user=parent_review.user, type='system',
                            title='Có người trả lời bình luận của bạn',
                            message=f'{request.user.username} đã trả lời bình luận của bạn về sản phẩm "{product.name}".'
                        )
                    messages.success(request, 'Đã gửi trả lời!')
                else:
                    messages.error(request, 'Vui lòng nhập nội dung trả lời.')
                return redirect(f"{request.path}?id={product.id}#review-{parent_id}")

            # ── Sửa bình luận của chính mình ──
            elif action == 'edit_comment':
                review_id   = request.POST.get('review_id')
                new_comment = request.POST.get('comment', '').strip()
                review_obj  = get_object_or_404(Review, id=review_id, user=request.user)
                if new_comment:
                    review_obj.comment = new_comment
                    if review_obj.parent_id is None and 'rating' in request.POST:
                        review_obj.rating = int(request.POST.get('rating', review_obj.rating))
                    review_obj.edited_at = timezone.now()
                    review_obj.save()
                    messages.success(request, 'Đã cập nhật bình luận.')
                else:
                    messages.error(request, 'Nội dung bình luận không được để trống.')
                anchor = review_obj.parent_id or review_obj.id
                return redirect(f"{request.path}?id={product.id}#review-{anchor}")

            # ── Xóa bình luận của chính mình ──
            elif action == 'delete_comment':
                review_id  = request.POST.get('review_id')
                review_obj = get_object_or_404(Review, id=review_id, user=request.user)
                review_obj.delete()
                messages.success(request, 'Đã xóa bình luận.')
                return redirect(f"{request.path}?id={product.id}")

            # ── Thích / Không thích — bấm lại lần 2 để bỏ phản ứng ──
            elif action in ('like', 'dislike'):
                review_id  = request.POST.get('review_id')
                review_obj = get_object_or_404(Review, id=review_id)
                existing = ReviewReaction.objects.filter(review=review_obj, user=request.user).first()
                if existing and existing.reaction == action:
                    existing.delete()
                elif existing:
                    existing.reaction = action
                    existing.save()
                else:
                    ReviewReaction.objects.create(review=review_obj, user=request.user, reaction=action)
                anchor = review_obj.parent_id or review_obj.id
                return redirect(f"{request.path}?id={product.id}#review-{anchor}")

        user_has_reviewed = request.user.is_authenticated and Review.objects.filter(
            product=product, user=request.user, parent__isnull=True
        ).exists()

    # ══════════════════════════════════════════════════════
    #  DANH SÁCH BÌNH LUẬN — có phân trang "xem thêm",
    #  ghim lên đầu, kèm reply lồng nhau và huy hiệu người dùng
    # ══════════════════════════════════════════════════════
    reviews = []
    has_more_reviews = False
    reviews_limit = int(request.GET.get('reviews_limit', 5) or 5)

    if product:
        all_top_reviews = Review.objects.filter(
            product=product, is_approved=True, parent__isnull=True
        ).select_related('user').prefetch_related(
            'user__user_badges__badge', 'reactions',
            'replies__user__user_badges__badge', 'replies__reactions'
        )
        total_top = all_top_reviews.count()
        reviews = list(all_top_reviews[:reviews_limit])
        has_more_reviews = total_top > reviews_limit

        # Gắn phản ứng của user hiện tại + danh sách reply đã duyệt cho từng bình luận gốc
        for r in reviews:
            r.user_reaction = None
            if request.user.is_authenticated:
                ur = next((x for x in r.reactions.all() if x.user_id == request.user.id), None)
                r.user_reaction = ur.reaction if ur else None
            r.reply_list = [rep for rep in r.replies.all() if rep.is_approved]
            for rep in r.reply_list:
                rep.user_reaction = None
                if request.user.is_authenticated:
                    ur2 = next((x for x in rep.reactions.all() if x.user_id == request.user.id), None)
                    rep.user_reaction = ur2.reaction if ur2 else None

    # ── Sản phẩm liên quan: cùng danh mục, loại trừ chính nó, tối đa 4 sản phẩm ──
    related_products = Product.objects.none()
    if product:
        related_products = Product.objects.filter(
            catergory__in=product.catergory.all(), is_approved=True
        ).exclude(id=product.id).distinct()[:4]

        if related_products.count() < 4:
            existing_ids = list(related_products.values_list('id', flat=True)) + [product.id]
            extra_needed = 4 - related_products.count()
            extra = Product.objects.filter(is_approved=True).exclude(id__in=existing_ids)[:extra_needed]
            related_products = list(related_products) + list(extra)

    seller_product_count = 0
    if product and product.seller:
        seller_product_count = Product.objects.filter(seller=product.seller, is_approved=True).count()

    context = {
        'items': items, 'order': order, 'cartItems': cartItems,
        'user_login': user_login, 'user_notlogin': user_notlogin,
        'categories': categories, 'products': products,
        'in_wishlist': in_wishlist,
        'reviews': reviews,
        'has_more_reviews': has_more_reviews,
        'reviews_limit': reviews_limit,
        'user_has_reviewed': user_has_reviewed,
        'related_products': related_products,
        'wishlisted_ids': _get_wishlisted_ids(request),
        'seller_product_count': seller_product_count,
    }
    return render(request, 'shop/detail.html', context)


def updateItem(request):
    data = json.loads(request.body)
    productID = data['productID']
    action = data['action']
    customer = request.user
    product = Product.objects.get(id=productID)
    order, created = Order.objects.get_or_create(customer=customer, complete=False)
    orderItem, created = OrderItem.objects.get_or_create(order=order, product=product)

    if action == 'add':
        orderItem.quantity += 1
    elif action == 'remove':
        orderItem.quantity -= 1

    orderItem.save()
    if orderItem.quantity <= 0:
        orderItem.delete()

    return JsonResponse('added', safe=False)


# ============================================================
#  AI CHAT (giữ nguyên hoàn toàn)
# ============================================================

def chat_ai(request):
    if request.method == "POST":
        data = json.loads(request.body)
        user_message = data.get("message", "").strip()
        history = data.get("history", [])

        keywords = [kw for kw in user_message.split() if len(kw) > 1]
        matched_products = Product.objects.none()
        for kw in keywords:
            matched_products = matched_products | Product.objects.filter(name__icontains=kw, is_approved=True)

        show_products = len(keywords) >= 1 and matched_products.exists()
        if not matched_products.exists():
            matched_products = Product.objects.filter(is_approved=True)[:6]

        product_info = "\n".join([
            f"- {p.name} | Giá: {p.price:,} VNĐ" for p in matched_products
        ])

        system_prompt = f"""
Bạn là nhân viên bán hàng vui vẻ, nhiệt tình của **Lotus Shop**.

[QUY TẮC GIAO TIẾP]
1. Chỉ chào ở tin nhắn đầu tiên. Từ tin thứ 2, vào thẳng vấn đề.
2. Thân thiện, xưng hô [Em - Anh/Chị]. Câu ngắn dưới 15 từ.
3. Tối đa 1-2 emoji mỗi tin nhắn.
4. Nhớ toàn bộ lịch sử trò chuyện.

[CHÍNH SÁCH BÁN HÀNG]
- Ship COD toàn quốc, kiểm tra hàng trước khi thanh toán.
- Đổi trả miễn phí trong 30 ngày.
- Miễn phí ship đơn từ 200.000đ.

Sản phẩm hiện có:
{product_info}
        """

        try:
            client = OpenAI(
                api_key=os.environ.get("GROQ_API_KEY"),
                base_url="https://api.groq.com/openai/v1",
            )

            msgs = [{"role": "system", "content": system_prompt}]
            for msg in history:
                msgs.append({"role": msg["role"], "content": msg["content"]})
            msgs.append({"role": "user", "content": user_message})

            response = client.chat.completions.create(
                model="openai/gpt-oss-120b",
                messages=msgs,
                max_tokens=800,
                temperature=0.75,
            )

            reply = response.choices[0].message.content.strip()
            products_list = []
            if show_products:
                for p in matched_products[:6]:
                    products_list.append({
                        "id": p.id, "name": p.name,
                        "price": p.price, "image": p.ImageURL,
                    })

            return JsonResponse({"status": "success", "reply": reply, "products": products_list})

        except Exception as e:
            print("AI Error:", str(e))
            return JsonResponse({"status": "error", "message": "AI đang bận, vui lòng thử lại sau nhé!"})

    return JsonResponse({"status": "error", "message": "Method not allowed!"})


# ============================================================
#  THANH TOÁN — Kết quả sau khi thanh toán
# ============================================================

def payment_result(request):
    """
    Hiển thị trang thành công/thất bại sau thanh toán.
    Đọc session do view checkout() đặt: payment_success, last_order_id.
    """
    ctx = _base_context(request)

    payment_success = request.session.pop('payment_success', False)
    order_id = request.session.pop('last_order_id', None)

    order = None
    if order_id:
        order = Order.objects.filter(id=order_id).first()
    elif request.user.is_authenticated:
        order = Order.objects.filter(
            customer=request.user, complete=True
        ).order_by('-date_order').first()

    ctx.update({'payment_success': payment_success, 'order': order})
    return render(request, 'shop/payment_result.html', ctx)


# ============================================================
#  TÀI KHOẢN NGƯỜI DÙNG
# ============================================================

@login_required(login_url='login')
def profile(request):
    """Trang hồ sơ cá nhân — xem & chỉnh sửa thông tin thật."""
    ctx = _base_context(request)

    if request.method == 'POST':
        user = request.user
        user.first_name = request.POST.get('first_name', '').strip() or user.first_name
        user.last_name  = request.POST.get('last_name', '').strip()  or user.last_name
        user.email      = request.POST.get('email', '').strip()      or user.email
        user.save()

        # Đổi mật khẩu nếu người dùng có điền
        old_pw = request.POST.get('old_password', '')
        new_pw = request.POST.get('new_password', '')
        confirm_pw = request.POST.get('confirm_password', '')
        if old_pw and new_pw:
            if user.check_password(old_pw):
                if new_pw == confirm_pw:
                    user.set_password(new_pw)
                    user.save()
                    messages.success(request, 'Đổi mật khẩu thành công! Vui lòng đăng nhập lại.')
                    logout(request)
                    return redirect('login')
                else:
                    messages.error(request, 'Mật khẩu xác nhận không khớp.')
            else:
                messages.error(request, 'Mật khẩu hiện tại không đúng.')
        else:
            messages.success(request, 'Cập nhật thông tin thành công!')

        return redirect('profile')

    # ── Thống kê thật cho user ──
    total_orders = Order.objects.filter(customer=request.user, complete=True).count()
    total_wishlist = Wishlist.objects.filter(user=request.user).count()
    total_vouchers = Voucher.objects.filter(user=request.user, is_used=False).count()

    # ── Huy hiệu thật do admin gán (rỗng nếu chưa được gán huy hiệu nào) ──
    user_badges = request.user.user_badges.select_related('badge').all()

    ctx.update({
        'page_title': 'Hồ sơ cá nhân',
        'total_orders': total_orders,
        'total_wishlist': total_wishlist,
        'total_vouchers': total_vouchers,
        'user_badges': user_badges,
    })
    return render(request, 'shop/profile.html', ctx)


# ============================================================
#  ĐƠN HÀNG
# ============================================================

@login_required(login_url='login')
def order_history(request):
    """Danh sách tất cả đơn hàng đã hoàn tất của người dùng hiện tại."""
    ctx = _base_context(request)
    orders = Order.objects.filter(
        customer=request.user, complete=True
    ).order_by('-date_order')

    # Đếm theo từng trạng thái (để hiển thị filter tabs có số liệu thật)
    status_counts = {
        'all': orders.count(),
        'pending':    orders.filter(status='pending').count(),
        'processing': orders.filter(status='processing').count(),
        'shipping':   orders.filter(status='shipping').count(),
        'delivered':  orders.filter(status='delivered').count(),
        'cancelled':  orders.filter(status='cancelled').count(),
    }

    ctx.update({
        'orders': orders,
        'status_counts': status_counts,
        'page_title': 'Lịch sử đơn hàng',
    })
    return render(request, 'shop/order/order_history.html', ctx)


@login_required(login_url='login')
def order_detail(request, pk):
    """Chi tiết một đơn hàng cụ thể theo ID."""
    ctx = _base_context(request)
    order = get_object_or_404(Order, id=pk, customer=request.user)
    shipping = ShippingAddress.objects.filter(order=order).first()

    # ── Hủy đơn hàng (chỉ khi còn pending) ──
    if request.method == 'POST' and request.POST.get('action') == 'cancel':
        if order.status == 'pending':
            order.status = 'cancelled'
            order.save()
            messages.success(request, f'Đã hủy đơn hàng #{order.id}.')
        else:
            messages.error(request, 'Không thể hủy đơn hàng đã được xử lý.')
        return redirect('order_detail', pk=order.id)

    ctx.update({
        'order': order,
        'shipping': shipping,
        'page_title': f'Đơn hàng #{pk}',
    })
    return render(request, 'shop/order/order_detail.html', ctx)


def order_tracking(request):
    """
    Trang tra cứu đơn hàng theo mã đơn hoặc email — không yêu cầu đăng nhập.
    """
    ctx = _base_context(request)
    order = None
    shipping = None
    searched = request.GET.get('order_id', '').strip()

    if searched:
        if searched.isdigit():
            order = Order.objects.filter(id=int(searched), complete=True).first()
        else:
            order = Order.objects.filter(
                customer__email=searched, complete=True
            ).order_by('-date_order').first()

        if order:
            shipping = ShippingAddress.objects.filter(order=order).first()

    ctx.update({'order': order, 'shipping': shipping, 'searched': searched, 'page_title': 'Theo dõi đơn hàng'})
    return render(request, 'shop/order/order_tracking.html', ctx)


# ============================================================
#  TÍNH NĂNG MUA SẮM
# ============================================================

@login_required(login_url='login')
def wishlist(request):
    """
    Danh sách yêu thích — hoạt động thật với model Wishlist.
    GET  /wishlist/                  → xem danh sách
    POST /wishlist/?action=add&id=N  → thêm sản phẩm
    POST /wishlist/?action=remove&id=N → xóa sản phẩm
    """
    if request.method == 'POST':
        action = request.POST.get('action')
        product_id = request.POST.get('product_id')
        product = get_object_or_404(Product, id=product_id)

        if action == 'add':
            Wishlist.objects.get_or_create(user=request.user, product=product)
            messages.success(request, f'Đã thêm "{product.name}" vào yêu thích!')
        elif action == 'remove':
            Wishlist.objects.filter(user=request.user, product=product).delete()
            messages.success(request, f'Đã xóa "{product.name}" khỏi yêu thích.')

        return redirect('wishlist')

    ctx = _base_context(request)
    wishlist_items = Wishlist.objects.filter(user=request.user).select_related('product')
    ctx.update({'wishlist': wishlist_items, 'page_title': 'Yêu thích'})
    return render(request, 'shop/wishlist.html', ctx)


# ============================================================
#  KHÁCH HÀNG TỰ ĐĂNG BÁN SẢN PHẨM
#  Sản phẩm khách đăng có seller=request.user, admin quản lý được
#  qua /admin-panel/products/ (thấy rõ AI ĐÃ ĐĂNG và ĐĂNG LÚC NÀO).
# ============================================================

@login_required(login_url='login')
def post_product(request):
    """
    Khách hàng tự đăng sản phẩm để bán. Sản phẩm được tạo với
    seller=request.user, date_posted tự động, is_approved=True mặc định
    (admin có thể ẩn sau nếu nội dung không phù hợp, xem admin_products()).
    """
    if request.method == 'POST':
        name       = request.POST.get('name', '').strip()
        price      = request.POST.get('price', '')
        detail_txt = request.POST.get('detail', '').strip()
        stock      = request.POST.get('stock', 1)
        category_ids = request.POST.getlist('categories')
        image_file = request.FILES.get('image')

        if name and price:
            try:
                product = Product.objects.create(
                    name=name,
                    price=float(price),
                    detail=detail_txt,
                    stock=int(stock) if stock else 1,
                    seller=request.user,
                    image=image_file,   # None nếu khách không chọn ảnh — ImageURL property tự xử lý an toàn
                )
                if category_ids:
                    product.catergory.set(category_ids)

                messages.success(request, f'Đã đăng bán "{name}" thành công! Sản phẩm đã hiển thị trên shop.')
                return redirect(f"/detail/?id={product.id}")
            except Exception as e:
                messages.error(request, f'Lỗi khi đăng sản phẩm: {e}')
        else:
            messages.error(request, 'Vui lòng nhập đầy đủ tên và giá sản phẩm.')

        return redirect('post_product')

    ctx = _base_context(request)
    categories = Catergory.objects.all()
    ctx.update({'categories_all': categories, 'page_title': 'Đăng bán sản phẩm'})
    return render(request, 'shop/product/post_product.html', ctx)


@login_required(login_url='login')
def my_products(request):
    """Danh sách sản phẩm mà CHÍNH khách hàng này đã đăng bán, kèm trạng thái duyệt."""
    ctx = _base_context(request)
    products = Product.objects.filter(seller=request.user).order_by('-date_posted')
    ctx.update({'my_products_list': products, 'page_title': 'Sản phẩm tôi đã đăng'})
    return render(request, 'shop/product/my_products.html', ctx)


def compare(request):
    """So sánh tối đa 4 sản phẩm cùng lúc — dùng query param ?ids=1,2,3,4."""
    ctx = _base_context(request)
    ids_str = request.GET.get('ids', '')
    compare_products = []
    if ids_str:
        try:
            id_list = [int(i) for i in ids_str.split(',') if i.strip()][:4]
            compare_products = list(Product.objects.filter(id__in=id_list, is_approved=True))
        except (ValueError, TypeError):
            pass

    ctx.update({
        'compare_products': compare_products,
        'products': Product.objects.filter(is_approved=True)[:12],
        'page_title': 'So sánh sản phẩm',
    })
    return render(request, 'shop/compare.html', ctx)


def flash_sale(request):
    """Trang Flash Sale — lọc sản phẩm thật có is_flash_sale=True."""
    ctx = _base_context(request)
    sale_products = Product.objects.filter(is_flash_sale=True, discount_percent__gt=0, is_approved=True)

    ctx.update({'sale_products': sale_products, 'page_title': 'Flash Sale'})
    return render(request, 'shop/flash_sale.html', ctx)


@login_required(login_url='login')
def voucher(request):
    """Trang Voucher & Điểm thưởng — dùng model Voucher thật."""
    ctx = _base_context(request)

    # Áp dụng mã voucher nhập tay (không bắt buộc gắn vào order ngay,
    # chỉ kiểm tra mã có hợp lệ và thuộc về user không)
    if request.method == 'POST':
        code = request.POST.get('code', '').strip().upper()
        v = Voucher.objects.filter(user=request.user, code=code, is_used=False).first()
        if v:
            messages.success(request, f'Áp dụng mã "{code}" thành công! Giảm {v.discount}%.')
        else:
            messages.error(request, f'Mã "{code}" không hợp lệ hoặc đã được sử dụng.')
        return redirect('voucher')

    vouchers = Voucher.objects.filter(user=request.user, is_used=False).order_by('-date_added')
    ctx.update({'vouchers': vouchers, 'page_title': 'Voucher & Điểm thưởng'})
    return render(request, 'shop/voucher.html', ctx)


# ============================================================
#  THÔNG BÁO
# ============================================================

@login_required(login_url='login')
def notifications(request):
    """
    Danh sách thông báo — dùng model Notification thật.
    POST ?action=mark_read&id=N    → đánh dấu 1 thông báo đã đọc
    POST ?action=mark_all_read     → đánh dấu tất cả đã đọc
    """
    if request.method == 'POST':
        action = request.POST.get('action')
        if action == 'mark_all_read':
            Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
            messages.success(request, 'Đã đánh dấu tất cả thông báo là đã đọc.')
        elif action == 'mark_read':
            notif_id = request.POST.get('notif_id')
            Notification.objects.filter(id=notif_id, user=request.user).update(is_read=True)
        return redirect('notifications')

    ctx = _base_context(request)
    notif_list = Notification.objects.filter(user=request.user)
    unread_count = notif_list.filter(is_read=False).count()

    ctx.update({
        'notifications': notif_list,
        'unread_count': unread_count,
        'page_title': 'Thông báo',
    })
    return render(request, 'shop/notifications.html', ctx)


# ============================================================
#  NỘI DUNG & THƯƠNG HIỆU
# ============================================================

def about(request):
    """Trang Giới thiệu — nội dung tĩnh."""
    ctx = _base_context(request)
    ctx['page_title'] = 'Giới thiệu'
    return render(request, 'shop/about.html', ctx)


def contact(request):
    """Trang Liên hệ — lưu tin nhắn thật vào model ContactMessage."""
    ctx = _base_context(request)

    if request.method == 'POST':
        name    = request.POST.get('name', '').strip()
        email   = request.POST.get('email', '').strip()
        phone   = request.POST.get('phone', '').strip()
        subject = request.POST.get('subject', '').strip()
        message = request.POST.get('message', '').strip()

        if name and email and message:
            ContactMessage.objects.create(
                name=name, email=email, phone=phone,
                subject=subject, message=message,
            )
            messages.success(request, f'Cảm ơn {name}! Chúng tôi sẽ phản hồi sớm nhất.')
            return redirect('contact')
        else:
            messages.error(request, 'Vui lòng điền đầy đủ thông tin bắt buộc.')

    ctx['page_title'] = 'Liên hệ'
    return render(request, 'shop/contact.html', ctx)


def blog(request):
    """
    Trang Blog & Tin tức.
    Chưa có model BlogPost trong models.py hiện tại —
    trang render với dữ liệu demo có sẵn trong template.
    (Nếu muốn nội dung thật, thêm model BlogPost vào models.py.)
    """
    ctx = _base_context(request)
    ctx.update({
        'posts': [],
        'featured_post': None,
        'page_title': 'Blog & Tin tức',
    })
    return render(request, 'shop/blog.html', ctx)


def faq(request):
    """Trang Câu hỏi thường gặp — nội dung tĩnh trong template."""
    ctx = _base_context(request)
    ctx['page_title'] = 'Câu hỏi thường gặp'
    return render(request, 'shop/faq.html', ctx)


def policy(request):
    """Trang Chính sách — nội dung tĩnh trong template."""
    ctx = _base_context(request)
    ctx['page_title'] = 'Chính sách'
    return render(request, 'shop/policy.html', ctx)


# ============================================================
#  XỬ LÝ LỖI 404
# ============================================================

def page_not_found(request, exception):
    """
    Custom 404 handler.
    Thêm dòng sau vào stdshop/urls.py (urls.py gốc của project):
        handler404 = 'shop.views.page_not_found'
    """
    ctx = _base_context(request)
    return render(request, 'shop/404.html', ctx, status=404)


# ============================================================
#  ADMIN PANEL (chỉ staff/superuser mới được vào)
# ============================================================

def _admin_required(request):
    """Trả về True nếu user có quyền truy cập admin panel."""
    return request.user.is_authenticated and request.user.is_staff


def admin_dashboard(request):
    """Trang tổng quan quản trị — số liệu thật từ database."""
    if not _admin_required(request):
        return redirect('login')

    ctx = _base_context(request)

    total_products = Product.objects.count()
    total_users    = User.objects.count()
    total_orders   = Order.objects.filter(complete=True).count()

    revenue_data = OrderItem.objects.filter(
        order__complete=True
    ).select_related('product')
    total_revenue = sum([item.get_total for item in revenue_data])

    recent_orders = Order.objects.filter(
        complete=True
    ).select_related('customer').order_by('-date_order')[:10]

    top_products = Product.objects.order_by('-sold')[:5]

    # ── Doanh thu 7 ngày gần nhất — tính thật từ OrderItem ──
    from datetime import timedelta
    from django.utils import timezone
    today = timezone.localdate()
    chart_data = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        items_that_day = OrderItem.objects.filter(
            order__complete=True,
            order__date_order__date=day
        ).select_related('product')
        day_total = sum([it.get_total for it in items_that_day])
        chart_data.append({
            'label': day.strftime('%d/%m'),
            'total': round(day_total, 2),
        })
    max_day_total = max([d['total'] for d in chart_data]) or 1  # tránh chia 0

    ctx.update({
        'total_products': total_products,
        'total_users':    total_users,
        'total_orders':   total_orders,
        'total_revenue':  round(total_revenue, 2),
        'recent_orders':  recent_orders,
        'top_products':   top_products,
        'chart_data':     chart_data,
        'max_day_total':  max_day_total,
        'page_title':     'Dashboard',
    })
    return render(request, 'shop/admin/dashboard.html', ctx)


def admin_reports(request):
    """Trang Báo cáo thống kê — TÍNH NĂNG MỚI, không có trong dự án gốc.
    Cung cấp dữ liệu thật cho 4 loại biểu đồ: đường (doanh thu theo ngày),
    tròn (đơn hàng theo trạng thái, doanh thu theo danh mục), cột (top sản phẩm bán chạy).
    """
    if not _admin_required(request):
        return redirect('login')

    from datetime import timedelta
    from django.db.models import Count

    ctx = _base_context(request)
    today = timezone.localdate()

    # Khoảng thời gian xem báo cáo doanh thu: 7 / 30 / 90 ngày (mặc định 30)
    try:
        days = int(request.GET.get('days', 30))
    except (TypeError, ValueError):
        days = 30
    if days not in (7, 30, 90):
        days = 30

    # ── 1. DOANH THU THEO NGÀY (biểu đồ đường) ──
    revenue_labels = []
    revenue_values = []
    for i in range(days - 1, -1, -1):
        day = today - timedelta(days=i)
        items_that_day = OrderItem.objects.filter(
            order__complete=True,
            order__date_order__date=day
        ).select_related('product')
        day_total = sum([it.get_total for it in items_that_day])
        revenue_labels.append(day.strftime('%d/%m'))
        revenue_values.append(round(day_total, 2))
    total_revenue_period = round(sum(revenue_values), 2)

    # ── 2. ĐƠN HÀNG THEO TRẠNG THÁI (biểu đồ tròn) ──
    status_labels_map = dict(Order.STATUS_CHOICES)
    status_rows = Order.objects.values('status').annotate(count=Count('id'))
    status_counts = {row['status']: row['count'] for row in status_rows}
    status_chart_labels = list(status_labels_map.values())
    status_chart_values = [status_counts.get(key, 0) for key in status_labels_map.keys()]
    total_orders_all = sum(status_chart_values)

    # ── 3. TOP 10 SẢN PHẨM BÁN CHẠY (biểu đồ cột) ──
    top_products_qs = Product.objects.order_by('-sold')[:10]
    top_labels = [p.name[:22] for p in top_products_qs]
    top_values = [p.sold for p in top_products_qs]

    # ── 4. DOANH THU THEO DANH MỤC (biểu đồ tròn/donut) ──
    # Lưu ý: 1 sản phẩm có thể thuộc nhiều danh mục (ManyToMany), nên doanh thu
    # của sản phẩm đó được cộng vào MỖI danh mục nó thuộc về (có thể trùng lặp
    # khi cộng tổng, đây là hạn chế hợp lý vì model không có "danh mục chính").
    category_revenue = {}
    completed_items = OrderItem.objects.filter(
        order__complete=True
    ).select_related('product').prefetch_related('product__catergory')
    for item in completed_items:
        if not item.product:
            continue
        cats = item.product.catergory.all()
        if not cats:
            category_revenue['Chưa phân loại'] = category_revenue.get('Chưa phân loại', 0) + item.get_total
        for cat in cats:
            category_revenue[cat.name] = category_revenue.get(cat.name, 0) + item.get_total
    category_labels = list(category_revenue.keys())
    category_values = [round(v, 2) for v in category_revenue.values()]

    ctx.update({
        'days': days,
        'total_revenue_period': total_revenue_period,
        'total_orders_all': total_orders_all,
        'revenue_labels': json.dumps(revenue_labels),
        'revenue_values': json.dumps(revenue_values),
        'status_chart_labels': json.dumps(status_chart_labels),
        'status_chart_values': json.dumps(status_chart_values),
        'top_labels': json.dumps(top_labels),
        'top_values': json.dumps(top_values),
        'category_labels': json.dumps(category_labels),
        'category_values': json.dumps(category_values),
        'page_title': 'Báo cáo thống kê',
    })
    return render(request, 'shop/admin/reports.html', ctx)


def admin_products(request):
    """Quản lý sản phẩm — CRUD đầy đủ."""
    if not _admin_required(request):
        return redirect('login')

    ctx = _base_context(request)

    if request.method == 'POST':
        action = request.POST.get('action', 'create')

        if action == 'delete':
            product_id = request.POST.get('product_id')
            Product.objects.filter(id=product_id).delete()
            messages.success(request, 'Đã xóa sản phẩm.')
            return redirect('admin_products')

        # ── Duyệt / Ẩn sản phẩm do khách hàng tự đăng ──
        if action == 'approve':
            product = get_object_or_404(Product, id=request.POST.get('product_id'))
            product.is_approved = True
            product.save()
            messages.success(request, f'Đã duyệt sản phẩm "{product.name}" của {product.seller.username if product.seller else "shop"}.')
            return redirect('admin_products')

        if action == 'reject':
            product = get_object_or_404(Product, id=request.POST.get('product_id'))
            product.is_approved = False
            product.save()
            messages.success(request, f'Đã ẩn sản phẩm "{product.name}".')
            return redirect('admin_products')

        # Thêm hoặc sửa sản phẩm
        name   = request.POST.get('name', '').strip()
        price  = request.POST.get('price', 0)
        detail = request.POST.get('detail', '').strip()
        stock  = request.POST.get('stock', 0)
        discount = request.POST.get('discount_percent', 0)
        is_flash = bool(request.POST.get('is_flash_sale'))
        product_id = request.POST.get('product_id')

        if name and price:
            try:
                if product_id:
                    # Sửa sản phẩm có sẵn
                    product = get_object_or_404(Product, id=product_id)
                    product.name = name
                    product.price = float(price)
                    product.detail = detail
                    product.stock = int(stock) if stock else 0
                    product.discount_percent = int(discount) if discount else 0
                    product.is_flash_sale = is_flash
                    product.save()
                    messages.success(request, f'Đã cập nhật "{name}".')
                else:
                    # Tạo sản phẩm mới — do ADMIN đăng nên seller=None (hàng của shop)
                    Product.objects.create(
                        name=name,
                        price=float(price),
                        detail=detail,
                        stock=int(stock) if stock else 0,
                        discount_percent=int(discount) if discount else 0,
                        is_flash_sale=is_flash,
                        seller=None,
                    )
                    messages.success(request, f'Đã thêm sản phẩm "{name}" thành công!')
            except Exception as e:
                messages.error(request, f'Lỗi: {e}')
        return redirect('admin_products')

    # ── Bộ lọc theo nguồn sản phẩm ──
    source_filter = request.GET.get('source', 'all')
    all_products = Product.objects.all().order_by('-date_posted')

    if source_filter == 'shop':
        products = all_products.filter(seller__isnull=True)
    elif source_filter == 'customer':
        products = all_products.filter(seller__isnull=False)
    elif source_filter == 'pending':
        products = all_products.filter(seller__isnull=False, is_approved=False)
    else:
        products = all_products

    source_counts = {
        'all':      all_products.count(),
        'shop':     all_products.filter(seller__isnull=True).count(),
        'customer': all_products.filter(seller__isnull=False).count(),
        'pending':  all_products.filter(seller__isnull=False, is_approved=False).count(),
    }

    categories = Catergory.objects.all()

    ctx.update({
        'products':      products,
        'categories':    categories,
        'source_filter': source_filter,
        'source_counts': source_counts,
        'page_title':    'Quản lý sản phẩm',
    })
    return render(request, 'shop/admin/products.html', ctx)


def admin_orders(request):
    """Quản lý đơn hàng — xem & cập nhật trạng thái thật."""
    if not _admin_required(request):
        return redirect('login')

    if request.method == 'POST':
        order_id   = request.POST.get('order_id')
        new_status = request.POST.get('status')
        order = get_object_or_404(Order, id=order_id)
        order.status = new_status
        order.save()
        messages.success(request, f'Đã cập nhật trạng thái đơn #{order_id}.')
        return redirect('admin_orders')

    ctx = _base_context(request)
    orders = Order.objects.filter(complete=True).select_related('customer').order_by('-date_order')

    status_counts = {
        'all': orders.count(),
        'pending':    orders.filter(status='pending').count(),
        'processing': orders.filter(status='processing').count(),
        'shipping':   orders.filter(status='shipping').count(),
        'delivered':  orders.filter(status='delivered').count(),
        'cancelled':  orders.filter(status='cancelled').count(),
    }

    ctx.update({'orders': orders, 'status_counts': status_counts, 'page_title': 'Quản lý đơn hàng'})
    return render(request, 'shop/admin/orders.html', ctx)


def admin_users(request):
    """Quản lý khách hàng — xem danh sách + khóa/mở tài khoản."""
    if not _admin_required(request):
        return redirect('login')

    if request.method == 'POST':
        user_id = request.POST.get('user_id')
        action  = request.POST.get('action')
        target_user = get_object_or_404(User, id=user_id)

        if action == 'toggle_active':
            target_user.is_active = not target_user.is_active
            target_user.save()
            status_text = 'mở khóa' if target_user.is_active else 'khóa'
            messages.success(request, f'Đã {status_text} tài khoản {target_user.username}.')
        return redirect('admin_users')

    ctx = _base_context(request)
    users_list = User.objects.all().order_by('-date_joined')

    # Gắn thêm thống kê đơn hàng/chi tiêu cho từng user (annotate đơn giản)
    for u in users_list:
        u.order_count = Order.objects.filter(customer=u, complete=True).count()
        u.total_spent = sum([
            o.get_cart_total for o in Order.objects.filter(customer=u, complete=True)
        ])

    # ── KPI tổng hợp cho 4 thẻ đầu trang ──
    from datetime import timedelta
    from django.utils import timezone
    week_ago = timezone.now() - timedelta(days=7)

    total_users = users_list.count()
    new_this_week = users_list.filter(date_joined__gte=week_ago).count()
    active_users = sum(1 for u in users_list if u.order_count > 0)
    vip_users = sum(1 for u in users_list if u.total_spent > 500)

    ctx.update({
        'users_list': users_list,
        'total_users': total_users,
        'new_this_week': new_this_week,
        'active_users': active_users,
        'vip_users': vip_users,
        'page_title': 'Quản lý khách hàng',
    })
    return render(request, 'shop/admin/users.html', ctx)
# ============================================================
#  ADMIN VIEWS BỔ SUNG — thêm vào cuối views.py hiện tại
#  4 chức năng còn thiếu trong sidebar admin:
#  1. admin_categories  — Quản lý danh mục
#  2. admin_vouchers    — Quản lý voucher
#  3. admin_flash_sale  — Quản lý Flash Sale
#  4. admin_send_notif  — Gửi thông báo hàng loạt
# ============================================================


# ── 1. QUẢN LÝ DANH MỤC ─────────────────────────────────────────────────

def admin_categories(request):
    """
    Quản lý danh mục sản phẩm — thêm / sửa / xóa.
    Model: Catergory (chính tả gốc giữ nguyên)
    """
    if not _admin_required(request):
        return redirect('login')

    if request.method == 'POST':
        action = request.POST.get('action', '')

        # ── Xóa danh mục ──
        if action == 'delete':
            cat_id = request.POST.get('cat_id')
            Catergory.objects.filter(id=cat_id).delete()
            messages.success(request, 'Đã xóa danh mục.')
            return redirect('admin_categories')

        # ── Thêm hoặc sửa danh mục ──
        name   = request.POST.get('name', '').strip()
        slug   = request.POST.get('slug', '').strip()
        is_sub = bool(request.POST.get('is_sub'))
        sub_of = request.POST.get('sub_category') or None
        cat_id = request.POST.get('cat_id')

        if name and slug:
            try:
                parent = Catergory.objects.get(id=sub_of) if sub_of else None
                if cat_id:
                    cat = get_object_or_404(Catergory, id=cat_id)
                    cat.name         = name
                    cat.slug         = slug
                    cat.is_sub       = is_sub
                    cat.sub_category = parent
                    cat.save()
                    messages.success(request, f'Đã cập nhật danh mục "{name}".')
                else:
                    Catergory.objects.create(
                        name=name, slug=slug,
                        is_sub=is_sub, sub_category=parent
                    )
                    messages.success(request, f'Đã thêm danh mục "{name}".')
            except Exception as e:
                messages.error(request, f'Lỗi: {e}')
        else:
            messages.error(request, 'Tên và slug không được để trống.')

        return redirect('admin_categories')

    ctx = _base_context(request)
    categories     = Catergory.objects.all().order_by('is_sub', 'name')
    parent_cats    = Catergory.objects.filter(is_sub=False)
    ctx.update({
        'categories':  categories,
        'parent_cats': parent_cats,
        'page_title':  'Quản lý danh mục',
    })
    return render(request, 'shop/admin/admin_categories.html', ctx)


# ── 2. QUẢN LÝ VOUCHER ──────────────────────────────────────────────────

def admin_vouchers(request):
    """
    Quản lý voucher — tạo mã mới / phân phối cho user / xóa.
    """
    if not _admin_required(request):
        return redirect('login')

    if request.method == 'POST':
        action = request.POST.get('action', '')

        # ── Xóa voucher ──
        if action == 'delete':
            v_id = request.POST.get('voucher_id')
            Voucher.objects.filter(id=v_id).delete()
            messages.success(request, 'Đã xóa voucher.')
            return redirect('admin_vouchers')

        # ── Tạo voucher cho user (hoặc tất cả) ──
        code      = request.POST.get('code', '').strip().upper()
        name      = request.POST.get('name', '').strip()
        discount  = request.POST.get('discount', 10)
        min_order = request.POST.get('min_order', 0)
        expiry    = request.POST.get('expiry') or None
        target    = request.POST.get('target', 'all')   # 'all' hoặc user_id cụ thể
        voucher_id = request.POST.get('voucher_id')

        if code:
            try:
                if voucher_id:
                    # Sửa voucher đã có
                    v = get_object_or_404(Voucher, id=voucher_id)
                    v.code      = code
                    v.name      = name
                    v.discount  = int(discount)
                    v.min_order = float(min_order)
                    v.expiry    = expiry or None
                    v.save()
                    messages.success(request, f'Đã cập nhật voucher "{code}".')
                else:
                    # Tạo voucher mới cho toàn bộ user hoặc 1 user cụ thể
                    if target == 'all':
                        users = User.objects.filter(is_active=True)
                    else:
                        users = User.objects.filter(id=target)

                    created = 0
                    for u in users:
                        _, new = Voucher.objects.get_or_create(
                            user=u, code=code,
                            defaults={
                                'name': name,
                                'discount': int(discount),
                                'min_order': float(min_order),
                                'expiry': expiry or None,
                            }
                        )
                        if new:
                            created += 1
                    messages.success(request, f'Đã tạo voucher "{code}" cho {created} người dùng.')
            except Exception as e:
                messages.error(request, f'Lỗi: {e}')
        else:
            messages.error(request, 'Mã voucher không được để trống.')

        return redirect('admin_vouchers')

    ctx = _base_context(request)
    vouchers   = Voucher.objects.select_related('user').order_by('-date_added')
    users_list = User.objects.filter(is_active=True).order_by('username')
    ctx.update({
        'vouchers':   vouchers,
        'users_list': users_list,
        'page_title': 'Quản lý Voucher',
    })
    return render(request, 'shop/admin/admin_vouchers.html', ctx)


# ── 3. QUẢN LÝ FLASH SALE ───────────────────────────────────────────────

def admin_flash_sale(request):
    """
    Quản lý Flash Sale — bật/tắt flash sale cho từng sản phẩm,
    đặt % giảm giá, quản lý tồn kho.
    """
    if not _admin_required(request):
        return redirect('login')

    if request.method == 'POST':
        action     = request.POST.get('action', '')
        product_id = request.POST.get('product_id')

        if action == 'toggle':
            # Bật / tắt flash sale nhanh
            product = get_object_or_404(Product, id=product_id)
            product.is_flash_sale = not product.is_flash_sale
            product.save()
            state = 'bật' if product.is_flash_sale else 'tắt'
            messages.success(request, f'Đã {state} Flash Sale cho "{product.name}".')

        elif action == 'update':
            # Cập nhật % giảm và tồn kho
            product  = get_object_or_404(Product, id=product_id)
            discount = request.POST.get('discount_percent', 0)
            stock    = request.POST.get('stock', product.stock)
            is_flash = bool(request.POST.get('is_flash_sale'))

            product.discount_percent = int(discount)
            product.stock            = int(stock)
            product.is_flash_sale    = is_flash
            product.save()
            messages.success(request, f'Đã cập nhật "{product.name}".')

        elif action == 'stop_all':
            # Tắt tất cả flash sale đang bật
            count = Product.objects.filter(is_flash_sale=True).update(is_flash_sale=False)
            messages.success(request, f'Đã tắt Flash Sale cho {count} sản phẩm.')

        return redirect('admin_flash_sale')

    ctx = _base_context(request)
    # Sản phẩm đang trong flash sale
    sale_products  = Product.objects.filter(is_flash_sale=True).order_by('-discount_percent')
    # Sản phẩm chưa trong flash sale (để thêm mới)
    other_products = Product.objects.filter(is_flash_sale=False).order_by('name')
    ctx.update({
        'sale_products':  sale_products,
        'other_products': other_products,
        'page_title':     'Quản lý Flash Sale',
    })
    return render(request, 'shop/admin/admin_flash_sale.html', ctx)


# ── 4. GỬI THÔNG BÁO HÀNG LOẠT ─────────────────────────────────────────

def admin_notifications(request):
    """
    Quản lý & gửi thông báo — gửi tới 1 user hoặc tất cả user.
    Cũng xem danh sách tất cả thông báo đã gửi.
    """
    if not _admin_required(request):
        return redirect('login')

    if request.method == 'POST':
        action = request.POST.get('action', '')

        # ── Xóa thông báo ──
        if action == 'delete':
            notif_id = request.POST.get('notif_id')
            Notification.objects.filter(id=notif_id).delete()
            messages.success(request, 'Đã xóa thông báo.')
            return redirect('admin_notifications')

        # ── Gửi thông báo mới ──
        title   = request.POST.get('title', '').strip()
        message = request.POST.get('message', '').strip()
        ntype   = request.POST.get('type', 'system')
        target  = request.POST.get('target', 'all')   # 'all' hoặc user_id

        if title and message:
            if target == 'all':
                users = User.objects.filter(is_active=True)
            else:
                users = User.objects.filter(id=target)

            created = 0
            for u in users:
                Notification.objects.create(
                    user=u, type=ntype,
                    title=title, message=message,
                )
                created += 1
            messages.success(request, f'Đã gửi thông báo tới {created} người dùng.')
        else:
            messages.error(request, 'Tiêu đề và nội dung không được để trống.')

        return redirect('admin_notifications')

    ctx = _base_context(request)
    notif_list = Notification.objects.select_related('user').order_by('-created_at')
    users_list = User.objects.filter(is_active=True).order_by('username')

    # Thống kê nhanh
    total_notifs  = notif_list.count()
    unread_notifs = notif_list.filter(is_read=False).count()

    ctx.update({
        'notif_list':   notif_list,
        'users_list':   users_list,
        'total_notifs': total_notifs,
        'unread_notifs':unread_notifs,
        'page_title':   'Quản lý Thông báo',
    })
    return render(request, 'shop/admin/admin_notifications.html', ctx)


# ── 5. KIỂM DUYỆT BÌNH LUẬN SẢN PHẨM ────────────────────────────────────

def admin_reviews(request):
    """
    Quản lý bình luận & đánh giá sản phẩm — duyệt / ẩn / xóa / ghim bình luận
    không phù hợp để tránh khách hàng bình luận sai chuẩn mực.
    Cũng quản lý được các bình luận trả lời (reply).
    """
    if not _admin_required(request):
        return redirect('login')

    if request.method == 'POST':
        action     = request.POST.get('action', '')
        review_id  = request.POST.get('review_id')

        # ── Ẩn bình luận (vi phạm chuẩn mực) ──
        if action == 'hide':
            note = request.POST.get('admin_note', '').strip()
            review = get_object_or_404(Review, id=review_id)
            review.is_approved = False
            review.is_flagged  = False
            review.admin_note  = note or 'Vi phạm quy định bình luận'
            review.save()
            messages.success(request, f'Đã ẩn bình luận của "{review.user.username}".')

        # ── Duyệt lại bình luận đã ẩn ──
        elif action == 'approve':
            review = get_object_or_404(Review, id=review_id)
            review.is_approved = True
            review.is_flagged  = False
            review.admin_note  = None
            review.save()
            messages.success(request, f'Đã duyệt lại bình luận của "{review.user.username}".')

        # ── Ghim bình luận nổi bật lên đầu (chỉ áp dụng cho bình luận gốc) + gửi thông báo ──
        elif action == 'pin':
            review = get_object_or_404(Review, id=review_id)
            if review.parent_id is not None:
                messages.error(request, 'Chỉ có thể ghim bình luận gốc, không ghim câu trả lời.')
            else:
                review.is_pinned = True
                review.save()
                Notification.objects.create(
                    user=review.user, type='promo',
                    title='Bình luận của bạn đã được ghim! 📌',
                    message=f'Bình luận của bạn về sản phẩm "{review.product.name}" đã được ghim nổi bật lên đầu.'
                )
                messages.success(request, f'Đã ghim bình luận của "{review.user.username}" và gửi thông báo.')

        # ── Bỏ ghim ──
        elif action == 'unpin':
            review = get_object_or_404(Review, id=review_id)
            review.is_pinned = False
            review.save()
            messages.success(request, f'Đã bỏ ghim bình luận của "{review.user.username}".')

        # ── Xóa vĩnh viễn ──
        elif action == 'delete':
            review = get_object_or_404(Review, id=review_id)
            username = review.user.username
            review.delete()
            messages.success(request, f'Đã xóa vĩnh viễn bình luận của "{username}".')

        return redirect(f"{request.path}?status={request.GET.get('status', 'all')}")

    ctx = _base_context(request)

    # ── Bộ lọc theo trạng thái ──
    status_filter = request.GET.get('status', 'all')
    all_reviews = Review.objects.select_related('user', 'product', 'parent__user').all()

    if status_filter == 'approved':
        reviews_list = all_reviews.filter(is_approved=True)
    elif status_filter == 'hidden':
        reviews_list = all_reviews.filter(is_approved=False)
    elif status_filter == 'flagged':
        reviews_list = all_reviews.filter(is_flagged=True)
    elif status_filter == 'pinned':
        reviews_list = all_reviews.filter(is_pinned=True)
    elif status_filter == 'replies':
        reviews_list = all_reviews.filter(parent__isnull=False)
    else:
        reviews_list = all_reviews

    # ── Đếm theo trạng thái cho tab filter ──
    status_counts = {
        'all':      all_reviews.count(),
        'approved': all_reviews.filter(is_approved=True).count(),
        'hidden':   all_reviews.filter(is_approved=False).count(),
        'flagged':  all_reviews.filter(is_flagged=True).count(),
        'pinned':   all_reviews.filter(is_pinned=True).count(),
        'replies':  all_reviews.filter(parent__isnull=False).count(),
    }

    # ── Danh sách từ khóa nhạy cảm cơ bản để tự động gắn cờ (có thể mở rộng) ──
    SENSITIVE_KEYWORDS = ['lừa đảo', 'rác', 'ngu', 'đồ', 'chửi', 'scam', 'fake']
    for r in reviews_list:
        r.has_sensitive_word = any(kw in r.comment.lower() for kw in SENSITIVE_KEYWORDS)
        r.is_reply = r.parent_id is not None
        if not r.is_reply:
            r.reply_count = r.replies.count()

    ctx.update({
        'reviews_list':   reviews_list,
        'status_filter':  status_filter,
        'status_counts':  status_counts,
        'page_title':     'Quản lý Bình luận',
    })
    return render(request, 'shop/admin/admin_reviews.html', ctx)


# ── 6. QUẢN LÝ HUY HIỆU NGƯỜI DÙNG ──────────────────────────────────────

def admin_badges(request):
    """
    Quản lý huy hiệu — admin tự tạo huy hiệu (tên + màu sắc tùy ý),
    gán cho bất kỳ người dùng nào, hoặc thu hồi huy hiệu đã gán.
    """
    if not _admin_required(request):
        return redirect('login')

    if request.method == 'POST':
        action = request.POST.get('action', '')

        # ── Tạo huy hiệu mới ──
        if action == 'create_badge':
            name       = request.POST.get('name', '').strip()
            color      = request.POST.get('color', '#3B82F6')
            text_color = request.POST.get('text_color', '#FFFFFF')
            icon       = request.POST.get('icon', '').strip()
            if name:
                Badge.objects.create(name=name, color=color, text_color=text_color, icon=icon or None)
                messages.success(request, f'Đã tạo huy hiệu "{name}".')
            else:
                messages.error(request, 'Tên huy hiệu không được để trống.')
            return redirect('admin_badges')

        # ── Xóa huy hiệu (xóa khỏi mọi user đang có) ──
        elif action == 'delete_badge':
            badge_id = request.POST.get('badge_id')
            badge = get_object_or_404(Badge, id=badge_id)
            name = badge.name
            badge.delete()
            messages.success(request, f'Đã xóa huy hiệu "{name}" khỏi hệ thống.')
            return redirect('admin_badges')

        # ── Gán huy hiệu cho 1 người dùng ──
        elif action == 'assign':
            user_id  = request.POST.get('user_id')
            badge_id = request.POST.get('badge_id')
            target_user = get_object_or_404(User, id=user_id)
            badge = get_object_or_404(Badge, id=badge_id)
            _, created = UserBadge.objects.get_or_create(user=target_user, badge=badge)
            if created:
                messages.success(request, f'Đã gán huy hiệu "{badge.name}" cho {target_user.username}.')
            else:
                messages.info(request, f'{target_user.username} đã có huy hiệu này rồi.')
            return redirect('admin_badges')

        # ── Thu hồi huy hiệu khỏi 1 người dùng ──
        elif action == 'revoke':
            userbadge_id = request.POST.get('userbadge_id')
            ub = get_object_or_404(UserBadge, id=userbadge_id)
            username, badge_name = ub.user.username, ub.badge.name
            ub.delete()
            messages.success(request, f'Đã thu hồi huy hiệu "{badge_name}" khỏi {username}.')
            return redirect('admin_badges')

    ctx = _base_context(request)
    badges     = Badge.objects.all().order_by('name')
    users_list = User.objects.filter(is_active=True).order_by('username').prefetch_related('user_badges__badge')

    ctx.update({
        'badges':     badges,
        'users_list': users_list,
        'page_title': 'Quản lý Huy hiệu',
    })
    return render(request, 'shop/admin/admin_badges.html', ctx)


# ============================================================
#  ĐĂNG NHẬP MẠNG XÃ HỘI — ZALO
#  (django-allauth không hỗ trợ sẵn Zalo nên viết OAuth2 thủ công
#   theo tài liệu chính thức: https://developers.zalo.me/docs/api/
#   social-api-tich-hop-dang-nhap-and-lay-thong-tin-nguoi-dung-mvi)
#
#  ⚠️ LƯU Ý QUAN TRỌNG: Đoạn code này được viết theo đúng luồng OAuth2 + PKCE
#  mà Zalo công bố, nhưng CHƯA THỂ kiểm thử trực tiếp với máy chủ thật của Zalo.
#  Trước khi dùng thật, hãy:
#    1. Đăng ký App tại https://developers.zalo.me/apps để lấy App ID + Secret Key
#    2. Điền ZALO_APP_ID, ZALO_APP_SECRET, ZALO_REDIRECT_URI vào file .env
#    3. Test kỹ luồng đăng nhập, đối chiếu lại tài liệu Zalo mới nhất nếu lỗi
#       (API có thể thay đổi endpoint/tham số theo thời gian)
# ============================================================

import secrets
import hashlib
import base64

try:
    import requests
except ImportError:
    requests = None  # nhắc cài đặt: pip install requests


def _generate_pkce_pair():
    """Sinh cặp code_verifier / code_challenge theo chuẩn PKCE mà Zalo yêu cầu."""
    code_verifier = secrets.token_urlsafe(64)[:128]
    code_challenge = base64.urlsafe_b64encode(
        hashlib.sha256(code_verifier.encode('utf-8')).digest()
    ).decode('utf-8').rstrip('=')
    return code_verifier, code_challenge


def zalo_login(request):
    """
    Bước 1 — Chuyển hướng người dùng sang trang đăng nhập của Zalo.
    """
    if not settings.ZALO_APP_ID:
        messages.error(request, 'Đăng nhập Zalo chưa được cấu hình (thiếu ZALO_APP_ID trong .env).')
        return redirect('login')

    code_verifier, code_challenge = _generate_pkce_pair()
    state = secrets.token_urlsafe(16)

    # Lưu tạm vào session để đối chiếu lại ở bước callback
    request.session['zalo_code_verifier'] = code_verifier
    request.session['zalo_oauth_state'] = state

    auth_url = (
        'https://oauth.zaloapp.com/v4/permission'
        f'?app_id={settings.ZALO_APP_ID}'
        f'&redirect_uri={settings.ZALO_REDIRECT_URI}'
        f'&code_challenge={code_challenge}'
        f'&state={state}'
    )
    return redirect(auth_url)


def zalo_callback(request):
    """
    Bước 2 — Zalo redirect người dùng về đây kèm ?code=...&state=...
    Đổi code lấy access_token, sau đó lấy thông tin người dùng và đăng nhập.
    """
    if requests is None:
        messages.error(request, 'Thiếu thư viện "requests". Chạy: pip install requests')
        return redirect('login')

    error = request.GET.get('error')
    if error:
        messages.error(request, 'Bạn đã hủy đăng nhập bằng Zalo.')
        return redirect('login')

    code = request.GET.get('code')
    state = request.GET.get('state')
    saved_state = request.session.pop('zalo_oauth_state', None)
    code_verifier = request.session.pop('zalo_code_verifier', None)

    if not code or not state or state != saved_state:
        messages.error(request, 'Phiên đăng nhập Zalo không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.')
        return redirect('login')

    try:
        # ── Đổi authorization code lấy access_token ──
        token_res = requests.post(
            'https://oauth.zaloapp.com/v4/access_token',
            headers={'secret_key': settings.ZALO_APP_SECRET},
            data={
                'app_id': settings.ZALO_APP_ID,
                'code': code,
                'grant_type': 'authorization_code',
                'code_verifier': code_verifier,
            },
            timeout=10,
        )
        token_data = token_res.json()
        access_token = token_data.get('access_token')

        if not access_token:
            messages.error(request, 'Không lấy được access token từ Zalo. Vui lòng thử lại.')
            return redirect('login')

        # ── Lấy thông tin hồ sơ người dùng Zalo ──
        profile_res = requests.get(
            'https://graph.zalo.me/v2.0/me',
            headers={'access_token': access_token},
            params={'fields': 'id,name,picture'},
            timeout=10,
        )
        profile = profile_res.json()
        zalo_id = profile.get('id')
        display_name = profile.get('name', f'zalo_user_{zalo_id}')

        if not zalo_id:
            messages.error(request, 'Không lấy được thông tin tài khoản Zalo.')
            return redirect('login')

        # ── Tìm hoặc tạo tài khoản Django tương ứng với zalo_id này ──
        username = f'zalo_{zalo_id}'
        user, created = User.objects.get_or_create(
            username=username,
            defaults={'first_name': display_name}
        )
        if created:
            user.set_unusable_password()   # tài khoản này chỉ đăng nhập qua Zalo, không có mật khẩu
            user.save()

        login(request, user, backend='django.contrib.auth.backends.ModelBackend')
        messages.success(request, f'Đăng nhập bằng Zalo thành công! Xin chào {display_name}.')
        return redirect('home')

    except requests.RequestException as e:
        messages.error(request, f'Lỗi kết nối tới Zalo: {e}')
        return redirect('login')


# ============================================================
#  ĐĂNG NHẬP ZALO — tự viết OAuth vì django-allauth chưa hỗ trợ sẵn.
#  Google & Facebook được xử lý tự động bởi django-allauth (xem urls.py:
#  path('accounts/', include('allauth.urls'))) — không cần view riêng.
# ============================================================

def zalo_login(request):
    """Chuyển hướng người dùng sang trang đăng nhập Zalo (bước 1 của OAuth2)."""
    if not settings.ZALO_APP_ID:
        messages.error(request, 'Đăng nhập Zalo chưa được cấu hình. Vui lòng liên hệ quản trị viên.')
        return redirect('login')

    redirect_uri = request.build_absolute_uri('/zalo/callback/')
    zalo_auth_url = (
        'https://oauth.zaloapp.com/v4/permission'
        f'?app_id={settings.ZALO_APP_ID}'
        f'&redirect_uri={redirect_uri}'
        '&state=lotus_shop'
    )
    return redirect(zalo_auth_url)


def zalo_callback(request):
    """
    Zalo chuyển hướng về đây sau khi người dùng đồng ý đăng nhập (bước 2 của OAuth2).
    Đổi authorization code lấy access token, lấy thông tin người dùng,
    rồi tạo hoặc đăng nhập tài khoản Django tương ứng.
    """
    code = request.GET.get('code')
    if not code:
        messages.error(request, 'Đăng nhập Zalo thất bại hoặc đã bị hủy.')
        return redirect('login')

    try:
        # ── Bước 1: đổi code lấy access token ──
        token_response = requests.post(
            'https://oauth.zaloapp.com/v4/access_token',
            data={
                'code': code,
                'app_id': settings.ZALO_APP_ID,
                'grant_type': 'authorization_code',
            },
            headers={'secret_key': settings.ZALO_APP_SECRET},
            timeout=10,
        ).json()

        access_token = token_response.get('access_token')
        if not access_token:
            messages.error(request, 'Không lấy được access token từ Zalo. Vui lòng thử lại.')
            return redirect('login')

        # ── Bước 2: lấy thông tin hồ sơ người dùng từ Zalo ──
        profile_response = requests.get(
            'https://graph.zalo.me/v2.0/me',
            params={'access_token': access_token, 'fields': 'id,name,picture'},
            timeout=10,
        ).json()

        zalo_id = profile_response.get('id')
        display_name = profile_response.get('name', '').strip()

        if not zalo_id:
            messages.error(request, 'Không lấy được thông tin tài khoản Zalo.')
            return redirect('login')

        # ── Bước 3: tạo hoặc lấy user Django tương ứng với tài khoản Zalo này ──
        username = f'zalo_{zalo_id}'
        user, created = User.objects.get_or_create(
            username=username,
            defaults={'first_name': display_name or username},
        )

        login(request, user)

        if created:
            messages.success(request, f'Chào mừng {display_name or "bạn"} đã tham gia Lotus Shop qua Zalo! 🎉')
        else:
            messages.success(request, f'Chào mừng trở lại, {display_name or user.username}!')

        return redirect('home')

    except requests.RequestException:
        messages.error(request, 'Không thể kết nối tới Zalo. Vui lòng thử lại sau.')
        return redirect('login')