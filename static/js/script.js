document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle
    const toggleBtn = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    toggleBtn.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    // Click ngoài để đóng menu mobile
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.navbar')) {
            navMenu.classList.remove('active');
        }
    });

    // Thông báo khi click nút đối tác (có thể thay bằng link thật sau)
    document.querySelectorAll('.btn-partner').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            alert('🔄 Bạn đang chuyển đến trang Đăng ký Đối tác (sẽ làm ở bước sau)');
        });
    });

    console.log('%c✅ Trang AquaFood đã sẵn sàng cho đồ án của bạn!', 'color:#00C9B0; font-size:16px; font-weight:bold');
});