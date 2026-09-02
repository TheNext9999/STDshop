/* ===== USER DROPDOWN (nav giờ render thật từ Django, JS chỉ lo hiệu ứng bật/tắt) ===== */
(function () {
    const navUser = document.getElementById("navUser");
    if (!navUser) return;

    navUser.addEventListener("click", function (e) {
        e.stopPropagation();
        navUser.classList.toggle("open");
    });
    document.addEventListener("click", function () {
        navUser.classList.remove("open");
    });
})();

/* ==================== ĐIỀU HƯỚNG KHI CLICK VÀO CARD SẢN PHẨM ====================
   Card sản phẩm giờ do Django render sẵn (server-side), không còn tạo bằng JS nữa.
   Dùng event delegation để bắt click vào bất kỳ .product-card nào (kể cả card
   được render sau này) và điều hướng sang trang chi tiết dựa vào data-id. */
document.addEventListener('click', (e) => {
    const card = e.target.closest('.product-card');
    if (card && card.dataset.id) {
        window.location.href = `/detail/?id=${card.dataset.id}`;
    }
});

/* ================= MAIN APP ================= */
document.addEventListener('DOMContentLoaded', () => {

    /* ==================== SETUP SEARCH BAR ====================
       Lưu ý: phần "gợi ý tìm kiếm trực tiếp" (live search dropdown) đã bị bỏ vì
       trước đây nó lọc trên mảng allProducts load bằng JS - giờ dữ liệu sản phẩm
       nằm ở Django/database. Khi cần làm lại live search, nên gọi 1 API Django
       (ví dụ /search/suggest/?q=...) trả JSON rồi hiển thị tương tự. Hiện tại
       thanh tìm kiếm chỉ điều hướng sang trang kết quả tìm kiếm khi Enter/bấm nút. */
    /* Lưu ý: thanh tìm kiếm giờ là <form method="post" action="{% url 'search' %}">
       thật trong base.html (field name="searched" khớp với request.POST['searched']
       trong views.search()) - nên không cần JS bắt sự kiện Enter/click để redirect
       nữa, trình duyệt tự submit form chuẩn. JS ở đây chỉ còn lo hiệu ứng "has-text". */
    function setupSearchBar() {
        const searchInput = document.getElementById("searchInput");
        const searchWrapper = document.querySelector('.search-wrapper');

        if (!searchInput || !searchWrapper) return;

        searchInput.addEventListener("input", function () {
            searchWrapper.classList.toggle("has-text", this.value.trim().length > 0);
        });
        searchInput.addEventListener("focus", () => {
            if (searchInput.value.trim().length > 0) searchWrapper.classList.add("has-text");
        });
        searchInput.addEventListener("blur", () => {
            if (searchInput.value.trim().length === 0) searchWrapper.classList.remove("has-text");
        });
    }

    /* ==================== SETUP CATEGORY FILTERS ==================== */
    /* Lưu ý: setupCategoryFilters() đã bị xóa — trước đây category-card dùng
       href="#" nên cần JS bắt click để điều hướng tới /html/search.html (đường
       dẫn tĩnh từ bản demo gốc). Giờ mỗi category-card đã có href thật trỏ tới
       {% url 'category' %}?category=<slug>, nên để trình duyệt tự điều hướng
       bình thường, không cần JS can thiệp/ghi đè nữa. */

    /* ==================== CART MANAGEMENT ==================== */
    /* ==================== INITIALIZE ==================== */
    setupSearchBar();
});

/* ==================== GO TO CHECKOUT ==================== */
window.goToCheckout = function () {
    // Việc kiểm tra "đã đăng nhập chưa" giờ để Django xử lý ở phía server
    // (mỗi view trong views.py đã tự có logic authenticated/not).
    window.location.href = "/cart/";
};

/* ==================== GO TO CART ==================== */
window.goToCart = function () {
    window.location.href = "/cart/";
};