/* ================= CONFIG ================= */
const API_BASE = '/api';

/* ===== AUTH NAVBAR (khớp với HTML mới) ===== */
(function () {
    const user = JSON.parse(localStorage.getItem("user"));

    const navUser       = document.getElementById("navUser");
    const navAvatar     = document.getElementById("navAvatar");
    const navIconGuest  = document.getElementById("navIconGuest");
    const navUsername   = document.getElementById("navUsername");
    const navChevron    = document.getElementById("navChevron");
    const navDropdown   = document.getElementById("navDropdown");
    const navDropHeader = document.getElementById("navDropdownHeader");
    const navDropAvatar = document.getElementById("navDropAvatar");
    const navDropName   = document.getElementById("navDropName");

    if (user && user.name) {
        // ── Đã đăng nhập ──────────────────────────────────────
        const displayName = user.name !== "undefined" ? user.name
                          : (user.email ? user.email.split("@")[0] : "Người dùng");

        // Username trên thanh nav
        navUsername.textContent = displayName;

        // Ẩn icon khách, hiện chevron
        navIconGuest.style.display = "none";
        navChevron.style.display   = "";

        // Avatar (nếu user có trường avatar, dùng nó; không thì ẩn ảnh)
        if (user.avatar) {
            navAvatar.src          = user.avatar;
            navAvatar.style.display = "";
        } else {
            navAvatar.style.display = "none";
        }

        // Header trong dropdown
        navDropName.textContent    = displayName;
        if (user.avatar) navDropAvatar.src = user.avatar;
        navDropHeader.style.display = "";

        // Toggle dropdown khi click vào khu vực nav-user
        navUser.style.cursor = "pointer";
        navUser.addEventListener("click", function (e) {
            e.stopPropagation();
            const isOpen = navDropdown.classList.toggle("open");
            navDropdown.style.display = isOpen ? "" : "none";
        });
        document.addEventListener("click", function () {
            navDropdown.classList.remove("open");
            navDropdown.style.display = "none";
        });

    } else {
        // ── Chưa đăng nhập ────────────────────────────────────
        navUsername.textContent     = "Đăng nhập / Đăng ký";
        navAvatar.style.display     = "none";
        navIconGuest.style.display  = "";
        navChevron.style.display    = "none";
        navDropdown.style.display   = "none";
        navDropHeader.style.display = "none";

        navUser.style.cursor = "pointer";
        navUser.addEventListener("click", function () {
            window.location.href = "/html/auth.html";
        });
    }

    // Nút đăng xuất trong dropdown
    const logoutBtn = document.querySelector(".nav-logout");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function (e) {
            e.preventDefault();
            localStorage.removeItem("user");
            localStorage.removeItem("cart");
            window.location.href = "/html/auth.html";
        });
    }
})();

/* ================= HELPERS ================= */
function formatPrice(n) {
    return Number(n).toLocaleString('vi-VN') + 'đ';
}

function renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

/* ==================== TẠO PRODUCT CARD ==================== */
function createProductCard(product) {
    // Hiển thị số lượng đã bán (ví dụ: 1200 → "1.2k")
    const soldDisplay = product.sold >= 1000
        ? (product.sold / 1000).toFixed(1).replace('.0', '') + 'k'
        : (product.sold || 0);

    // Tính % giảm giá nếu có oldPrice, nếu không dùng trường discount
    const discount = product.discount
        || (product.oldPrice && product.oldPrice > product.price
            ? Math.round((1 - product.price / product.oldPrice) * 100)
            : null);

    const card = document.createElement('div');
    card.className = 'product-card';
    card.style.cursor = 'pointer';
    card.onclick = () => { window.location.href = `/html/dish-detail.html?id=${product.id}`; };

    card.innerHTML = `
        <div class="product-card__img-wrap">
            <img src="${product.img}" alt="${product.name}" loading="lazy">
            ${discount ? `<span class="product-card__discount">-${discount}%</span>` : ''}
            ${product.hot ? `<span class="product-card__hot">🔥 Bán chạy</span>` : ''}
        </div>
        <div class="product-card__body">
            <div class="product-card__name">${product.name}</div>

            <div class="product-card__rating">
                <span class="product-card__stars">${renderStars(product.rating || 4.5)}</span>
                <span class="product-card__rating-score">${product.rating || 4.5}</span>
                <span class="product-card__rating-divider">|</span>
                <span class="product-card__sold">Đã bán ${soldDisplay}</span>
            </div>

            <div class="product-card__price-row">
                <span class="product-card__price">${formatPrice(product.price)}</span>
                ${product.oldPrice ? `<span class="product-card__price-original">${formatPrice(product.oldPrice)}</span>` : ''}
            </div>
        </div>
    `;
    return card;
}

/* ================= MAIN APP ================= */
document.addEventListener('DOMContentLoaded', async () => {

    let allProducts = [];
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    /* ==================== LOAD PRODUCTS TỪ API (MYSQL) ==================== */
    async function loadProducts() {
        try {
            console.log('📡 Đang kết nối tới API: ' + API_BASE + '/products');
            const res = await fetch(`${API_BASE}/products`);

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();

            if (!data || data.length === 0) {
                console.warn('⚠️ API trả về dữ liệu trống');
                showErrorMessage();
                return;
            }

            console.log('✅ Loaded products từ MySQL:', data.length, 'sản phẩm');

            // Map đủ trường từ MySQL — thêm oldPrice, discount, sold, hot
            allProducts = data.map(p => ({
                id: p.id,
                name: p.name,
                price: p.price,
                oldPrice: p.old_price || p.oldPrice || null,   // cột old_price trong DB
                discount: p.discount || null,                   // cột discount trong DB
                rating: p.rating || 4.5,
                ratingCount: p.rating_count || p.ratingCount || 0,
                sold: p.sold || 0,                              // cột sold trong DB
                img: p.img,
                category: p.category || "Khác",
                seller: p.seller || "Shop",
                stock: p.stock || 100,
                hot: p.hot == 1 || p.hot === true || false      // cột hot trong DB (0/1)
            }));

            renderAllProducts();
            renderTrending();
            setupCategoryFilters();
            setupSearchBar();

        } catch (err) {
            console.error('❌ Lỗi load products từ API:', err);
            showErrorMessage();
        }
    }

    /* ==================== HIỂN THỊ THÔNG BÁO LỖI KẾT NỐI ==================== */
    function showErrorMessage() {
        const errorHTML = `
            <div style="grid-column: 1/-1; padding: 40px; text-align: center; color: #d32f2f; background: #ffebee; border-radius: 8px;">
                <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                <h3>❌ Không thể tải sản phẩm từ database</h3>
                <p style="margin: 8px 0;">Vui lòng kiểm tra kết nối server</p>
                <small style="color: #666;">Mở Console (F12) để xem chi tiết lỗi</small>
                <br><br>
                <details style="text-align: left; color: #666;">
                    <summary style="cursor: pointer; font-weight: 500;">Hướng dẫn khắc phục</summary>
                    <ol style="margin-top: 10px;">
                        <li>Kiểm tra MySQL có chạy: <code>mysql -u root -p</code></li>
                        <li>Kiểm tra Database: <code>USE stdshop2;</code></li>
                        <li>Kiểm tra Table: <code>SELECT * FROM products LIMIT 1;</code></li>
                        <li>Khởi động lại Node.js server: <code>node index.js</code></li>
                        <li>Kiểm tra CORS port trong index.js</li>
                    </ol>
                </details>
            </div>
        `;
        const dishGrid = document.getElementById('dishGrid');
        if (dishGrid) dishGrid.innerHTML = errorHTML;
        const trendingGrid = document.getElementById('trendingGrid');
        if (trendingGrid) trendingGrid.innerHTML = errorHTML;
    }

    /* ==================== RENDER TẤT CẢ SẢN PHẨM (dishGrid) ==================== */
    function renderAllProducts(filteredList) {
        const grid = document.getElementById('dishGrid');
        if (!grid) return;
        grid.innerHTML = '';

        const list = filteredList || allProducts;

        if (list.length === 0) {
            grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #999; padding: 40px;">Không tìm thấy sản phẩm</p>`;
            return;
        }

        list.forEach(p => grid.appendChild(createProductCard(p)));
    }

    /* ==================== RENDER TRENDING (random 6) ==================== */
    function renderTrending() {
        const grid = document.getElementById('trendingGrid');
        if (!grid) return;
        grid.innerHTML = '';

        // Ưu tiên sản phẩm hot, nếu không đủ thì random
        const hotProducts = allProducts.filter(p => p.hot);
        const trending = hotProducts.length >= 5
            ? hotProducts.slice(0, 5)
            : [...allProducts].sort(() => Math.random() - 0.5).slice(0, 5);

        trending.forEach(p => grid.appendChild(createProductCard(p)));
    }

    /* ==================== SETUP SEARCH BAR ==================== */
    function setupSearchBar() {
        const searchInput = document.getElementById("searchInput");
        const searchResults = document.getElementById("searchResults");
        const searchSubmitBtn = document.querySelector(".search-submit-btn");
        const searchWrapper = document.querySelector('.search-wrapper');

        if (!searchInput) return;

        // Submit button
        if (searchSubmitBtn) {
            searchSubmitBtn.addEventListener("click", (e) => {
                e.preventDefault();
                const keyword = searchInput.value.trim();
                if (keyword) window.location.href = `/html/search.html?q=${encodeURIComponent(keyword)}`;
            });
        }

        // Enter key
        searchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                const keyword = searchInput.value.trim();
                if (keyword) window.location.href = `/html/search.html?q=${encodeURIComponent(keyword)}`;
            }
        });

        // Live search dropdown
        searchInput.addEventListener("input", () => {
            const keyword = searchInput.value.toLowerCase().trim();

            if (keyword === "") {
                if (searchResults) searchResults.style.display = "none";
                return;
            }

            const results = allProducts.filter(p => p.name.toLowerCase().includes(keyword)).slice(0, 8);
            renderSearchResults(results, searchResults);
        });

        // Ẩn dropdown khi click ra ngoài
        document.addEventListener("click", (e) => {
            if (!searchInput.contains(e.target) && !searchResults?.contains(e.target)) {
                if (searchResults) searchResults.style.display = "none";
            }
        });

        if (searchWrapper) {
            searchInput.addEventListener("focus", () => {
                if (searchInput.value.trim().length > 0) searchWrapper.classList.add("has-text");
            });
            searchInput.addEventListener("blur", () => {
                setTimeout(() => {
                    if (searchInput.value.trim().length === 0) searchWrapper.classList.remove("has-text");
                }, 200);
            });
        }
    }

    function renderSearchResults(results, container) {
        if (!container) return;
        container.innerHTML = "";

        if (results.length === 0) {
            container.innerHTML = "<div class='search-item'>Không tìm thấy sản phẩm</div>";
            container.style.display = "block";
            return;
        }

        results.forEach(dish => {
            const div = document.createElement("div");
            div.className = "search-item";
            div.innerHTML = `
                <img src="${dish.img}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
                <div class="search-info">
                    <div class="search-name" style="font-weight: 500; color: #222;">${dish.name}</div>
                    <div class="search-price" style="color: #00C9B0; font-weight: bold;">${formatPrice(dish.price)}</div>
                </div>
            `;
            div.onclick = () => {
                window.location.href = `/html/dish-detail.html?id=${dish.id}`;
            };
            container.appendChild(div);
        });

        container.style.display = "block";
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
    console.log('🚀 Initializing STDShop...');
    await loadProducts();
    updateCartCount();
    console.log('%c✅ STDShop đã sẵn sàng!', 'color:#00C9B0; font-size:18px; font-weight:bold');
    console.log('📦 Tổng sản phẩm:', allProducts.length);
});

/* ==================== GO TO CHECKOUT ==================== */
window.goToCheckout = function () {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const user = JSON.parse(localStorage.getItem("user"));

    if (cart.length === 0) { alert("❌ Giỏ hàng trống!"); return; }
    if (!user) { alert("❌ Vui lòng đăng nhập!"); window.location.href = "/html/auth.html"; return; }

    window.location.href = "/html/cart.html";
};

/* ==================== GO TO CART ==================== */
window.goToCart = function () {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) { alert("❌ Vui lòng đăng nhập!"); window.location.href = "/html/auth.html"; return; }
    window.location.href = "/html/cart.html";
};