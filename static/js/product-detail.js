/* ============================================================
   TRANG CHI TIẾT SẢN PHẨM - STDShop
   Nội dung trang do Django render sẵn; file này chỉ lo phần tương tác:
   số lượng, thêm giỏ hàng / mua ngay, chia sẻ, chọn sao đánh giá, mở form trả lời.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ---------- Thông báo nổi ----------
    function toast(message, type) {
        const el = document.createElement('div');
        el.className = 'pd-toast ' + (type || '');
        el.textContent = message;
        document.body.appendChild(el);
        requestAnimationFrame(() => el.classList.add('show'));
        setTimeout(() => {
            el.classList.remove('show');
            setTimeout(() => el.remove(), 300);
        }, 2400);
    }

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return '';
    }
    // Ưu tiên cookie; nếu chưa có thì lấy token trong 1 form bất kỳ của trang
    function getCsrf() {
        const fromCookie = getCookie('csrftoken');
        if (fromCookie) return fromCookie;
        const input = document.querySelector('input[name="csrfmiddlewaretoken"]');
        return input ? input.value : '';
    }

    const root = document.getElementById('pdRoot');

    // ===== 1. SỐ LƯỢNG + THÊM GIỎ HÀNG + MUA NGAY =====
    if (root) {
        const productId = root.dataset.productId;
        const updateUrl = root.dataset.updateUrl;
        const cartUrl = root.dataset.cartUrl;
        // data-stock rỗng nghĩa là không giới hạn kho
        const stock = root.dataset.stock === '' ? Infinity : parseInt(root.dataset.stock, 10);

        const qtyEl = document.getElementById('pdQty');
        const minusBtn = document.getElementById('pdQtyMinus');
        const plusBtn = document.getElementById('pdQtyPlus');
        const addBtn = document.getElementById('pdAddCart');
        const buyBtn = document.getElementById('pdBuyNow');

        let quantity = 1;
        let busy = false;

        function renderQty() { if (qtyEl) qtyEl.textContent = quantity; }

        if (minusBtn) {
            minusBtn.addEventListener('click', () => {
                if (quantity > 1) { quantity--; renderQty(); }
            });
        }
        if (plusBtn) {
            plusBtn.addEventListener('click', () => {
                if (quantity < stock) { quantity++; renderQty(); }
                else toast('Chỉ còn ' + stock + ' sản phẩm trong kho', 'error');
            });
        }

        // Gọi API thêm giỏ hàng LẦN LƯỢT từng đơn vị (không gọi song song) để server
        // cộng số lượng chính xác, tránh mất lượt khi nhiều request chạm nhau.
        async function addToCart(qty) {
            for (let i = 0; i < qty; i++) {
                const res = await fetch(updateUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrf() },
                    body: JSON.stringify({ productID: productId, action: 'add' })
                });
                if (!res.ok) throw new Error('HTTP ' + res.status);
            }
            const countEl = document.getElementById('cartCount');
            if (countEl) countEl.textContent = (parseInt(countEl.textContent, 10) || 0) + qty;
        }

        function setBusy(state) {
            busy = state;
            [addBtn, buyBtn].forEach(btn => { if (btn) btn.disabled = state; });
        }

        if (addBtn) {
            addBtn.addEventListener('click', async () => {
                if (busy) return;
                setBusy(true);
                try {
                    await addToCart(quantity);
                    toast('Đã thêm ' + quantity + ' sản phẩm vào giỏ hàng', 'success');
                } catch (err) {
                    toast('Không thể thêm vào giỏ hàng, vui lòng thử lại', 'error');
                }
                setBusy(false);
            });
        }

        if (buyBtn) {
            buyBtn.addEventListener('click', async () => {
                if (busy) return;
                setBusy(true);
                try {
                    await addToCart(quantity);
                    window.location.href = cartUrl;
                } catch (err) {
                    toast('Không thể xử lý, vui lòng thử lại', 'error');
                    setBusy(false);
                }
            });
        }
    }

    // ===== 2. CHIA SẺ = SAO CHÉP LIÊN KẾT =====
    const shareBtn = document.getElementById('pdShare');
    if (shareBtn) {
        function fallbackCopy(text) {
            const tmp = document.createElement('textarea');
            tmp.value = text;
            tmp.style.position = 'fixed';
            tmp.style.opacity = '0';
            document.body.appendChild(tmp);
            tmp.select();
            let ok = false;
            try { ok = document.execCommand('copy'); } catch (err) { /* bỏ qua */ }
            document.body.removeChild(tmp);
            toast(ok ? 'Đã sao chép liên kết sản phẩm' : 'Không sao chép được liên kết', ok ? 'success' : 'error');
        }
        shareBtn.addEventListener('click', () => {
            const url = window.location.href.split('#')[0];
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(url)
                    .then(() => toast('Đã sao chép liên kết sản phẩm', 'success'))
                    .catch(() => fallbackCopy(url));
            } else {
                fallbackCopy(url);
            }
        });
    }

    // ===== 3. CHỌN SAO ĐÁNH GIÁ =====
    const starBox = document.getElementById('pdStarInput');
    const ratingInput = document.getElementById('pdRatingInput');
    if (starBox && ratingInput) {
        const stars = Array.from(starBox.querySelectorAll('i'));
        function paint(value) {
            stars.forEach(star => star.classList.toggle('active', Number(star.dataset.value) <= value));
        }
        paint(Number(ratingInput.value) || 5);
        stars.forEach(star => {
            star.addEventListener('click', () => {
                ratingInput.value = star.dataset.value;
                paint(Number(star.dataset.value));
            });
            star.addEventListener('mouseenter', () => paint(Number(star.dataset.value)));
        });
        starBox.addEventListener('mouseleave', () => paint(Number(ratingInput.value) || 5));
    }

    // ===== 4. MỞ / ĐÓNG FORM TRẢ LỜI =====
    document.querySelectorAll('[data-reply-toggle]').forEach(btn => {
        btn.addEventListener('click', () => {
            const form = document.getElementById('reply-form-' + btn.dataset.replyToggle);
            if (!form) return;
            form.hidden = !form.hidden;
            if (!form.hidden) {
                const box = form.querySelector('textarea');
                if (box) box.focus();
            }
        });
    });
});
