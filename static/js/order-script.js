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
    function setupSearchBar() {
        const searchInput = document.getElementById("searchInput");
        const searchSubmitBtn = document.querySelector(".search-submit-btn");
        const searchWrapper = document.querySelector('.search-wrapper');

        if (!searchInput) return;

        if (searchSubmitBtn) {
            searchSubmitBtn.addEventListener("click", (e) => {
                e.preventDefault();
                const keyword = searchInput.value.trim();
                if (keyword) window.location.href = `/html/search.html?q=${encodeURIComponent(keyword)}`;
            });
        }

        searchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                const keyword = searchInput.value.trim();
                if (keyword) window.location.href = `/html/search.html?q=${encodeURIComponent(keyword)}`;
            }
        });

        if (searchWrapper) {
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
    }

    /* ==================== SETUP CATEGORY FILTERS ==================== */
    function setupCategoryFilters() {
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const category = card.dataset.category || card.querySelector('p')?.textContent;
                if (!category) return;
                window.location.href = `/html/search.html?category=${encodeURIComponent(category)}`;
            });
        });
    }

    /* ==================== CART MANAGEMENT ==================== */
    /* ==================== INITIALIZE ==================== */
    setupSearchBar();
    setupCategoryFilters();
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