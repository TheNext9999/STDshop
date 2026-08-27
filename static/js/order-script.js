/* ===== USER DROPDOWN (nav giờ render thật từ Django, JS chỉ lo hiệu ứng bật/tắt) ===== */
(function () {
    const navUser = document.getElementById("navUser");
    const navDropdown = document.getElementById("userDropdown");
    if (!navUser || !navDropdown) return;

    navUser.style.cursor = "pointer";
    navUser.addEventListener("click", function (e) {
        e.stopPropagation();
        const isOpen = navDropdown.classList.toggle("open");
        navDropdown.style.display = isOpen ? "block" : "none";
    });
    document.addEventListener("click", function () {
        navDropdown.classList.remove("open");
        navDropdown.style.display = "none";
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

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

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
    function saveCart() {
        localStorage.setItem("cart", JSON.stringify(cart));
    }

    function updateCartCount() {
        const totalItems = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
        document.querySelectorAll('#cartCount').forEach(el => el.textContent = totalItems);
        updateCartUI();
        saveCart();
    }

    function updateCartUI() {
        const currentCart = JSON.parse(localStorage.getItem("cart")) || [];

        const statusEl = document.getElementById('cartStatusText');
        if (statusEl) statusEl.textContent = `${currentCart.length} sản phẩm`;

        const listContainer = document.getElementById('cartItemsList');
        if (!listContainer) return;

        if (currentCart.length === 0) {
            listContainer.innerHTML = `<p class="empty-cart-msg">Chưa có sản phẩm</p>`;
            return;
        }

        const displayItems = [...currentCart].reverse().slice(0, 5);
        listContainer.innerHTML = displayItems.map(item => `
            <div class="cart-mini-item">
                <img src="${item.img}" alt="${item.name}">
                <div class="cart-mini-info">
                    <p class="cart-mini-name">${item.name}</p>
                    <small class="cart-mini-qty">x${item.qty || 1}</small>
                </div>
                <span class="cart-mini-price">${(item.price * (item.qty || 1)).toLocaleString('vi-VN')}đ</span>
            </div>
        `).join('');
    }

    /* ==================== CART DROPDOWN - HOVER ==================== */
    const cartBtn = document.getElementById('openCartBtn');
    const cartDropdown = document.getElementById('cartDropdown');

    if (cartBtn && cartDropdown) {
        cartBtn.addEventListener('mouseenter', () => {
            cartDropdown.style.display = 'block';
            updateCartUI();
        });
        cartBtn.addEventListener('mouseleave', () => {
            setTimeout(() => { if (!cartDropdown.matches(':hover')) cartDropdown.style.display = 'none'; }, 200);
        });
        cartDropdown.addEventListener('mouseenter', () => { cartDropdown.style.display = 'block'; });
        cartDropdown.addEventListener('mouseleave', () => { cartDropdown.style.display = 'none'; });
    }

    /* ==================== INITIALIZE ==================== */
    setupSearchBar();
    setupCategoryFilters();
    updateCartCount();
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