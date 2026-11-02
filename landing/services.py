# ============================================================
#  landing/services.py
#  Nghiệp vụ của STD Market: đặt mua, chuyển trạng thái đơn, đánh dấu đã bán,
#  xóa tin. Mỗi hàm trả về (kết quả, thông báo) để view hiển thị lại cho người dùng.
#  Mọi bước quan trọng đều gửi thông báo (MarketNotification) cho bên liên quan.
# ============================================================

import re

from django.db import transaction
from django.urls import reverse

from .models import MarketOrder, MarketProduct
from .notifications import notify

PHONE_RE = re.compile(r'^\d{9,11}$')


def _seller_orders_link():
    return reverse('landing:landing_seller') + '?tab=orders'


def _product_link(product):
    return reverse('landing:landing_product', args=[product.pk])


# ------------------------------------------------------------------
#  Tin đăng
# ------------------------------------------------------------------
def cancel_pending_orders(product, reason):
    """Hủy các đơn đang CHỜ XÁC NHẬN của 1 sản phẩm (VD khi sản phẩm đã bán) và báo người mua."""
    pending = list(MarketOrder.objects.filter(product=product, status='pending'))
    for order in pending:
        order.status = 'cancelled'
        order.save(update_fields=['status', 'updated_at'])
        notify(order.buyer, 'order', f'Đơn {order.order_code} đã bị hủy', reason, _product_link(product))
    return len(pending)


def set_product_sold(product, sold):
    """Đánh dấu 'đã bán' hoặc mở bán lại. Trả về (ok, message)."""
    with transaction.atomic():
        locked = MarketProduct.objects.select_for_update().get(pk=product.pk)
        if sold:
            if locked.is_sold:
                return False, 'Sản phẩm này đã ở trạng thái đã bán.'
            if locked.orders.filter(status__in=MarketOrder.HOLDING_STATUSES).exists():
                return False, ('Sản phẩm đang có đơn được xác nhận / đang giao. '
                               'Hãy hoàn tất hoặc hủy đơn đó trước khi đánh dấu đã bán.')
            cancel_pending_orders(
                locked, f'Sản phẩm "{locked.name}" đã được người bán bán ở nơi khác.')
            locked.is_sold = True
            message = 'Đã đánh dấu sản phẩm là ĐÃ BÁN.'
        else:
            if not locked.is_sold:
                return False, 'Sản phẩm này đang được rao bán.'
            locked.is_sold = False
            message = 'Đã mở bán lại sản phẩm.'
        locked.save(update_fields=['is_sold'])
    product.is_sold = locked.is_sold   # cập nhật lại bản đang giữ ở view
    return True, message


def delete_product(product):
    """Xóa tin. Tin đã có đơn thì KHÔNG xóa để giữ lịch sử giao dịch."""
    if product.orders.exists():
        return False, 'Sản phẩm đã có đơn hàng nên không thể xóa (để giữ lịch sử giao dịch).'
    name = product.name
    product.delete()
    return True, f'Đã xóa sản phẩm "{name}".'


# ------------------------------------------------------------------
#  Đơn hàng - phía người mua
# ------------------------------------------------------------------
def place_order(product, buyer, receiver_name, phone, address, note=''):
    """Người mua đặt mua 1 sản phẩm. Trả về (order | None, message)."""
    receiver_name = (receiver_name or '').strip()
    address = (address or '').strip()
    note = (note or '').strip()
    phone_digits = re.sub(r'[\s.\-()+]', '', phone or '')

    if buyer == product.seller:
        return None, 'Bạn không thể đặt mua sản phẩm của chính mình.'
    if not receiver_name or not address:
        return None, 'Vui lòng nhập đầy đủ họ tên và địa chỉ nhận hàng.'
    if not PHONE_RE.match(phone_digits):
        return None, 'Số điện thoại không hợp lệ (cần 9-11 chữ số).'

    with transaction.atomic():
        locked = MarketProduct.objects.select_for_update().select_related('seller').get(pk=product.pk)
        if not locked.is_approved or locked.is_sold:
            return None, 'Sản phẩm hiện không còn nhận đặt mua.'
        if MarketOrder.objects.filter(
                product=locked, buyer=buyer, status__in=MarketOrder.ACTIVE_STATUSES).exists():
            return None, 'Bạn đã có đơn đang xử lý cho sản phẩm này.'
        if MarketOrder.objects.filter(product=locked, status__in=MarketOrder.HOLDING_STATUSES).exists():
            return None, 'Sản phẩm đang được giữ cho người mua khác.'

        order = MarketOrder.objects.create(
            product=locked, buyer=buyer, seller=locked.seller, price=locked.price,
            receiver_name=receiver_name, phone=phone_digits, address=address, note=note,
        )

    notify(locked.seller, 'order', f'Có đơn đặt mua mới {order.order_code}',
           f'{receiver_name} muốn mua "{locked.name}". Hãy xác nhận đơn để giữ hàng cho người mua.',
           _seller_orders_link())
    return order, 'Đặt mua thành công! Người bán sẽ xem và xác nhận đơn của bạn.'


def cancel_order_by_buyer(order_id, buyer):
    """Người mua tự hủy đơn khi đơn chưa giao. Trả về (ok, message)."""
    with transaction.atomic():
        order = (MarketOrder.objects.select_for_update().select_related('product')
                 .filter(pk=order_id, buyer=buyer).first())
        if order is None:
            return False, 'Không tìm thấy đơn hàng.'
        if order.status not in ('pending', 'confirmed'):
            return False, f'Đơn {order.order_code} đang ở trạng thái "{order.status_label}" nên không thể hủy.'
        order.status = 'cancelled'
        order.save(update_fields=['status', 'updated_at'])

    notify(order.seller, 'order', f'Đơn {order.order_code} đã bị người mua hủy',
           f'{order.receiver_name} đã hủy đơn mua "{order.product.name}".', _seller_orders_link())
    return True, f'Đã hủy đơn {order.order_code}.'


# ------------------------------------------------------------------
#  Đơn hàng - phía người bán
# ------------------------------------------------------------------
# thao tác -> (các trạng thái được phép đi từ đó, trạng thái mới)
ORDER_TRANSITIONS = {
    'confirm': ({'pending'}, 'confirmed'),
    'ship': ({'confirmed'}, 'shipping'),
    'complete': ({'shipping'}, 'completed'),
    'cancel': ({'pending', 'confirmed', 'shipping'}, 'cancelled'),
}


def seller_update_order(order_id, seller, action):
    """Người bán xác nhận / giao / hoàn tất / hủy đơn. Trả về (ok, message)."""
    if action not in ORDER_TRANSITIONS:
        return False, 'Thao tác không hợp lệ.'
    allowed_from, new_status = ORDER_TRANSITIONS[action]

    with transaction.atomic():
        order = (MarketOrder.objects.select_for_update().select_related('product')
                 .filter(pk=order_id, seller=seller).first())
        if order is None:
            return False, 'Không tìm thấy đơn hàng.'
        if order.status not in allowed_from:
            return False, (f'Đơn {order.order_code} đang ở trạng thái "{order.status_label}", '
                           'không thể thực hiện thao tác này.')
        if action == 'confirm' and MarketOrder.objects.filter(
                product=order.product, status__in=MarketOrder.HOLDING_STATUSES
        ).exclude(pk=order.pk).exists():
            return False, ('Bạn đang giao dịch với một người mua khác cho sản phẩm này. '
                           'Hãy hoàn tất hoặc hủy đơn đó trước.')

        order.status = new_status
        order.save(update_fields=['status', 'updated_at'])

        product = order.product
        if action == 'complete':
            product.is_sold = True
            product.save(update_fields=['is_sold'])
            cancel_pending_orders(
                product, f'Sản phẩm "{product.name}" đã được bán cho người mua khác.')

    link = _product_link(product)
    code = order.order_code
    if action == 'confirm':
        notify(order.buyer, 'order', f'Đơn {code} đã được xác nhận',
               f'Người bán đã xác nhận đơn mua "{product.name}". Hãy chuẩn bị nhận hàng.', link)
        return True, f'Đã xác nhận đơn {code}.'
    if action == 'ship':
        notify(order.buyer, 'order', f'Đơn {code} đang được giao',
               f'Đơn mua "{product.name}" của bạn đang trên đường giao tới.', link)
        return True, f'Đơn {code} đã chuyển sang trạng thái đang giao.'
    if action == 'complete':
        notify(order.buyer, 'order', f'Giao dịch {code} đã hoàn tất',
               f'Cảm ơn bạn đã mua "{product.name}". Đừng quên để lại đánh giá cho sản phẩm nhé!',
               link + '#reviews')
        return True, f'Đã hoàn tất giao dịch {code}. Sản phẩm được chuyển sang "Đã bán".'
    # cancel
    notify(order.buyer, 'order', f'Đơn {code} đã bị hủy',
           f'Người bán đã hủy đơn mua "{product.name}".', link)
    return True, f'Đã hủy đơn {code}.'
