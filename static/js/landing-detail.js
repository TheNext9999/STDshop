/* ============================================================
   TRANG CHI TIẾT SẢN PHẨM THANH LÝ - STD Market
   Toàn bộ nội dung trang do Django render sẵn; file này chỉ lo 3 việc
   tương tác nhỏ: dropdown tài khoản, chọn sao đánh giá, sao chép liên kết.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ===== 1. DROPDOWN TÀI KHOẢN (id riêng, không dùng chung với navbar STDShop) =====
    const navUser = document.getElementById('marketNavUser');
    const userDropdown = document.getElementById('marketUserDropdown');
    if (navUser && userDropdown) {
        navUser.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = navUser.classList.toggle('open');
            userDropdown.style.display = isOpen ? 'block' : 'none';
        });
        document.addEventListener('click', () => {
            navUser.classList.remove('open');
            userDropdown.style.display = 'none';
        });
    }

    // ===== 2. CHỌN SAO ĐÁNH GIÁ =====
    const starBox = document.getElementById('ldStarInput');
    const ratingInput = document.getElementById('ldRatingInput');
    if (starBox && ratingInput) {
        const stars = Array.from(starBox.querySelectorAll('i'));

        function paint(value) {
            stars.forEach(star => {
                star.classList.toggle('active', Number(star.dataset.value) <= value);
            });
        }

        // Tô sẵn theo giá trị hiện tại (mặc định 5 sao, hoặc số sao người dùng đã chọn trước đó)
        paint(Number(ratingInput.value) || 5);

        stars.forEach(star => {
            star.addEventListener('click', () => {
                ratingInput.value = star.dataset.value;
                paint(Number(star.dataset.value));
            });
            // Rê chuột: xem trước số sao sẽ chọn
            star.addEventListener('mouseenter', () => paint(Number(star.dataset.value)));
        });
        starBox.addEventListener('mouseleave', () => paint(Number(ratingInput.value) || 5));
    }

    // ===== 3. CHIA SẺ = SAO CHÉP LIÊN KẾT TRANG =====
    const shareBtn = document.getElementById('ldShareBtn');
    if (shareBtn) {
        const originalHTML = shareBtn.innerHTML;

        function showCopied() {
            shareBtn.innerHTML = '<i class="fas fa-check"></i> Đã sao chép liên kết';
            setTimeout(() => { shareBtn.innerHTML = originalHTML; }, 1800);
        }

        function fallbackCopy(text) {
            const tmp = document.createElement('textarea');
            tmp.value = text;
            tmp.style.position = 'fixed';
            tmp.style.opacity = '0';
            document.body.appendChild(tmp);
            tmp.select();
            try { document.execCommand('copy'); showCopied(); } catch (err) { /* bỏ qua */ }
            document.body.removeChild(tmp);
        }

        shareBtn.addEventListener('click', () => {
            const url = window.location.href.split('#')[0];
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(url).then(showCopied).catch(() => fallbackCopy(url));
            } else {
                fallbackCopy(url);
            }
        });
    }
});
