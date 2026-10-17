/* Lưu ý: Flash Sale, Trending, All Products giờ do Django render sẵn trong HTML
   (xem shop/views.py + templates/shop/index.html). File này chỉ còn giữ lại phần
   thuần giao diện: đếm ngược Flash Sale, nút cuộn ngang, và hero banner slider. */

document.addEventListener('DOMContentLoaded', () => {

    // ==================== ĐẾM NGƯỢC FLASH SALE ====================
    // Đếm ngược tới 24:00 hôm nay (theo giờ máy người xem) - cùng cách tính với
    // trang Flash Sale (/flash-sale/), thay cho số giả 15:59 luôn reset mỗi lần tải trang.
    function secondsUntilMidnight() {
        const now = new Date();
        const end = new Date(now);
        end.setHours(24, 0, 0, 0);
        return Math.max(0, Math.floor((end - now) / 1000));
    }
    function renderCountdown() {
        const timeLeft = secondsUntilMidnight();
        const hours   = Math.floor(timeLeft / 3600);
        const minutes = Math.floor((timeLeft % 3600) / 60);
        const seconds = timeLeft % 60;
        const hEl = document.getElementById('hours');
        const mEl = document.getElementById('minutes');
        const sEl = document.getElementById('seconds');
        if (hEl) hEl.textContent = String(hours).padStart(2, '0');
        if (mEl) mEl.textContent = String(minutes).padStart(2, '0');
        if (sEl) sEl.textContent = String(seconds).padStart(2, '0');
    }
    renderCountdown();
    setInterval(renderCountdown, 1000);

    // ==================== NÚT CUỘN FLASH SALE ====================
    const flashLeftBtn = document.getElementById('flashLeft');
    const flashRightBtn = document.getElementById('flashRight');
    const flashGrid = document.getElementById('flashSaleGrid');

    if (flashLeftBtn && flashGrid) {
        flashLeftBtn.addEventListener('click', () => {
            flashGrid.scrollBy({ left: -220, behavior: 'smooth' });
        });
    }
    if (flashRightBtn && flashGrid) {
        flashRightBtn.addEventListener('click', () => {
            flashGrid.scrollBy({ left: 220, behavior: 'smooth' });
        });
    }

    // ==================== HERO BANNER SLIDER ====================
    const slides = document.querySelectorAll('.hero-slide');
    if (slides.length > 0) {
        let currentSlide = 0;
        const slideInterval = 3000; // 3 giây

        function showSlide(index) {
            slides.forEach(slide => slide.classList.remove('active'));
            slides[index].classList.add('active');
        }

        function nextSlide() {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        }

        function prevSlide() {
            currentSlide = (currentSlide - 1 + slides.length) % slides.length;
            showSlide(currentSlide);
        }

        let autoSlide = setInterval(nextSlide, slideInterval);

        const heroRightBtn = document.getElementById('heroRight');
        const heroLeftBtn = document.getElementById('heroLeft');

        if (heroRightBtn) {
            heroRightBtn.addEventListener('click', () => {
                clearInterval(autoSlide);
                nextSlide();
                autoSlide = setInterval(nextSlide, slideInterval);
            });
        }

        if (heroLeftBtn) {
            heroLeftBtn.addEventListener('click', () => {
                clearInterval(autoSlide);
                prevSlide();
                autoSlide = setInterval(nextSlide, slideInterval);
            });
        }

        showSlide(0);
    }
});