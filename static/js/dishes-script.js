const API_BASE = '/api';

// ==================== USER INFO ====================
const loggedUser = JSON.parse(localStorage.getItem("user"));

if (loggedUser) {
    const authText = document.getElementById("authText");
    if (authText) authText.textContent = loggedUser.name;
}

// ==================== USER DROPDOWN ====================
const userMenu = document.querySelector(".user-menu");
const logoutBtn = document.getElementById("logoutBtn");

if (userMenu) {
    userMenu.addEventListener("click", () => {
        userMenu.classList.toggle("open");
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("user");
        localStorage.removeItem("cart");
        alert("Đã đăng xuất!");
        window.location.href = "/html/auth.html";
    });
}

// ==================== MAIN APP ====================
document.addEventListener('DOMContentLoaded', async () => {
    
    let dishes = [];
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    // ==================== LOAD PRODUCTS TỪ API ====================
    async function loadProducts() {
        try {
            const res = await fetch(`${API_BASE}/products`);
            const data = await res.json();
            
            console.log('✅ Loaded products:', data.length);
            
            dishes = data.map(p => ({
                id: p.id,
                name: p.name,
                price: p.price,
                rating: p.rating || 4.5,
                img: p.img,
                category: p.category || "Khác",
                seller: p.seller || "Shop"
            }));

            renderDishes('dishGrid', dishes.slice(0, 12));
            renderTrending();
            setupCategoryFilters();
            setupSearchBar();

        } catch (err) {
            console.error('❌ Lỗi load products:', err);
            loadDefaultProducts();
        }
    }

    // ==================== FALLBACK DEFAULT PRODUCTS ====================
    function loadDefaultProducts() {
        const defaultDishes = [
            { id: 1, name: "Áo Hoodie Oversize Unisex", price: 189000, rating: 4.8, img: "https://down-vn.img.susercontent.com/file/vn-11134201-7r98o-lpja7tsxdp9xfe@resize_w900_nl.webp", category: "Thời Trang Nam", seller: "Shop Sinh Viên" },
            { id: 2, name: "Balo Sinh Viên Chống Nước", price: 245000, rating: 4.9, img: "https://sakos.vn/wp-content/uploads/2024/07/balo-chong-nuoc-Sakos-Oceanus-xam-1.png", category: "Balo & Túi Xách", seller: "ShopDunk" },
            { id: 3, name: "Sạc Dự Phòng 20000mAh Baseus", price: 390000, rating: 4.7, img: "https://smartones.com.vn/wp-content/uploads/2022/09/663200127a-7.jpg", category: "Điện Thoại & Phụ Kiện", seller: "Tech Store" },
            { id: 4, name: "Tai Nghe Bluetooth AirPods Style", price: 159000, rating: 4.6, img: "https://cdn.tgdd.vn/Products/Images/54/315014/tai-nghe-bluetooth-airpods-pro-2nd-gen-usb-c-charge-apple-1-750x500.jpg", category: "Âm Nhạc & Tai Nghe", seller: "Audio Hub" },
            { id: 5, name: "Vở Ghi Chép B5 Dot Grid 200 trang", price: 45000, rating: 4.8, img: "https://klong.com.vn/image/cache/catalog/So%20ruot%20cham/960%20combo-800x800.jpg", category: "Sách & Văn Phòng Phẩm", seller: "Stationery" },
            { id: 6, name: "Bình Giữ Nhiệt Lock&Lock 500ml", price: 135000, rating: 4.9, img: "https://down-vn.img.susercontent.com/file/82aae631338a31e639d9626a5cc16b11", category: "Đồ Gia Dụng & Nhà Ở", seller: "Home Living" },
            { id: 7, name: "Giày Thể Thao Sneaker Nam/Nữ", price: 289000, rating: 4.5, img: "https://shopdonghai.com/cdn/shop/files/giay-sneaker-nu-zuciani-GRC08-den-1_7b71cbc3-ace4-40f1-a77f-d1aec945f302.jpg", category: "Giày Dép", seller: "Shoe Store" },
            { id: 8, name: "Đèn Bàn Học LED Chống Cận", price: 165000, rating: 4.7, img: "https://cdn.hstatic.net/products/200000661969/3_b60babf064754a339e970be5cf3c8c68_1024x1024.png", category: "Đèn & Decor Phòng", seller: "Lighting" },
            { id: 9, name: "Chuột Không Dây Logitech", price: 199000, rating: 4.6, img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/c/h/chuot-gaming-logitech-pro-x-superlight-2-lightspeed-2.png", category: "Laptop & Phụ Kiện", seller: "Tech" },
            { id: 10, name: "Túi Đeo Chéo Canvas Sinh Viên", price: 95000, rating: 4.8, img: "https://product.hstatic.net/1000238555/product/dcffggg_cba3a2ae4da2473d8e56ade28f1fdb60.jpg", category: "Balo & Túi Xách", seller: "Bag Shop" },
            { id: 11, name: "Mũ Lưỡi Trai Unisex", price: 65000, rating: 4.9, img: "https://file.hstatic.net/1000362402/file/4e5735095d67391837333b38624078f777ed3_bc76a7ea9d704f07b4c5962aee2af117.jpg", category: "Thời Trang Nam", seller: "Fashion" },
            { id: 12, name: "Kem Dưỡng Da The Ordinary", price: 180000, rating: 4.7, img: "https://ordinary.com.vn/wp-content/uploads/2020/09/The-Ordinary-Natural-Moisturizing-Factor-HA-30ml.jpg", category: "Mỹ Phẩm & Chăm Sóc", seller: "Beauty" }
        ];

        dishes = defaultDishes;
        renderDishes('dishGrid', dishes);
        renderTrending();
    }

    // ==================== RENDER DISHES ====================
    function renderDishes(gridId, filteredDishes) {
        const grid = document.getElementById(gridId);
        if (!grid) return;
        
        grid.innerHTML = '';

        if (filteredDishes.length === 0) {
            grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #999; padding: 40px;">Không tìm thấy sản phẩm</p>`;
            return;
        }

        filteredDishes.forEach(dish => {
            const card = document.createElement('div');
            card.className = 'dish-card';
            card.innerHTML = `
                <a href="/html/dish-detail.html?id=${dish.id}" class="product-link" style="text-decoration: none; color: inherit;">
                    <img src="${dish.img}" alt="${dish.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;">
                    <div class="dish-info">
                        <h4 style="margin: 8px 0; font-size: 14px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${dish.name}</h4>
                        <p class="rating" style="color: #f59e0b; margin: 4px 0; font-size: 13px;">⭐ ${dish.rating}</p>
                        <p class="price" style="color: #00C9B0; font-weight: bold; margin: 4px 0; font-size: 15px;">${Number(dish.price).toLocaleString('vi-VN')}đ</p>
                    </div>
                </a>
            `;
            grid.appendChild(card);
        });
    }

    // ==================== RENDER TRENDING ====================
    function renderTrending() {
        const trendingGrid = document.getElementById('trendingGrid');
        if (!trendingGrid) return;

        const trending = dishes.slice(0, 6);
        renderDishes('trendingGrid', trending);
    }

    // ==================== SETUP SEARCH BAR ====================
    function setupSearchBar() {
        const searchInput = document.getElementById("searchInput");
        const searchResults = document.getElementById("searchResults");
        const searchSubmitBtn = document.getElementById("searchSubmitBtn");
        const searchWrapper = document.querySelector('.search-wrapper');

        if (!searchInput) return;

        // Submit button
        if (searchSubmitBtn) {
            searchSubmitBtn.addEventListener("click", (e) => {
                e.preventDefault();
                const keyword = searchInput.value.trim();
                if (keyword) {
                    window.location.href = `/html/more-dishes.html?q=${encodeURIComponent(keyword)}`;
                }
            });
        }

        // Enter key
        searchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                const keyword = searchInput.value.trim();
                if (keyword) {
                    window.location.href = `/html/more-dishes.html?q=${encodeURIComponent(keyword)}`;
                }
            }
        });

        // Live search
        searchInput.addEventListener("input", () => {
            const keyword = searchInput.value.toLowerCase();

            if (keyword === "") {
                searchResults.style.display = "none";
                searchWrapper.classList.remove("has-text");
                return;
            }

            searchWrapper.classList.add("has-text");

            const results = dishes.filter(dish =>
                dish.name.toLowerCase().includes(keyword)
            ).slice(0, 5);

            renderSearchResults(results, searchResults);
        });

        // Focus/Blur
        searchInput.addEventListener("focus", () => {
            if (searchInput.value.trim().length > 0) {
                searchWrapper.classList.add("has-text");
            }
        });

        searchInput.addEventListener("blur", () => {
            setTimeout(() => {
                if (searchInput.value.trim().length === 0) {
                    searchWrapper.classList.remove("has-text");
                }
            }, 200);
        });
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
                    <div class="search-price" style="color: #00C9B0; font-weight: bold;">${Number(dish.price).toLocaleString('vi-VN')}đ</div>
                </div>
            `;

            div.onclick = () => {
                window.location.href = `/html/more-dishes.html?q=${encodeURIComponent(dish.name)}`;
            };

            container.appendChild(div);
        });

        container.style.display = "block";
    }

    // ==================== SETUP CATEGORY FILTERS ====================
    function setupCategoryFilters() {
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const category = card.dataset.category;
                if (!category) return;

                const filtered = dishes.filter(d => d.category === category);
                renderDishes('dishGrid', filtered);

                // Scroll to products
                const dishGrid = document.getElementById('dishGrid');
                if (dishGrid) {
                    dishGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    // ==================== CART MANAGEMENT ====================
    function saveCart() {
        localStorage.setItem("cart", JSON.stringify(cart));
    }

    function updateCart() {
        const totalItems = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
        
        // Update all cart count badges
        const cartCountEls = document.querySelectorAll('#cartCount');
        cartCountEls.forEach(el => el.textContent = totalItems);

        // Update cart dropdown
        const cartItemsList = document.getElementById('cartItemsList');
        const cartTotal = document.getElementById('cartTotal');

        if (!cartItemsList) return;

        cartItemsList.innerHTML = '';
        let total = 0;

        if (cart.length === 0) {
            cartItemsList.innerHTML = `<p class="empty-cart-msg">Chưa có sản phẩm</p>`;
            if (cartTotal) cartTotal.textContent = "0đ";
        } else {
            cart.forEach((item, index) => {
                total += item.price * (item.qty || 1);

                const div = document.createElement('div');
                div.className = 'cart-item';
                div.style.cssText = 'display: flex; gap: 12px; align-items: center; padding: 12px; border-bottom: 1px solid #f0f0f0;';

                div.innerHTML = `
                    <img src="${item.img}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; flex-shrink: 0;">

                    <div style="flex: 1; min-width: 0;">
                        <div style="font-size: 13px; font-weight: 500; color: #222; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</div>
                        <div style="color: #00C9B0; font-weight: bold; font-size: 12px; margin-top: 4px;">${Number(item.price).toLocaleString('vi-VN')}đ</div>
                    </div>

                    <div class="quantity-control" style="display: flex; gap: 4px; align-items: center; border: 1px solid #ddd; border-radius: 4px; padding: 2px;">
                        <button class="minus" data-index="${index}" style="width: 24px; height: 24px; border: none; background: white; color: #00C9B0; cursor: pointer; font-weight: bold;">−</button>
                        <span style="min-width: 20px; text-align: center; font-weight: 500;">${item.qty || 1}</span>
                        <button class="plus" data-index="${index}" style="width: 24px; height: 24px; border: none; background: white; color: #00C9B0; cursor: pointer; font-weight: bold;">+</button>
                    </div>

                    <button class="remove-item" data-index="${index}" style="background: none; border: none; color: #e74c3c; cursor: pointer; font-size: 16px;">✕</button>
                `;

                cartItemsList.appendChild(div);
            });

            if (cartTotal) cartTotal.textContent = Number(total).toLocaleString('vi-VN') + "đ";
        }

        // Update status text
        const cartStatusText = document.getElementById('cartStatusText');
        if (cartStatusText) {
            cartStatusText.textContent = `${totalItems} sản phẩm trong giỏ`;
        }

        saveCart();
    }

    // ==================== CART EVENTS ====================
    document.addEventListener('click', e => {
        if (e.target.classList.contains('plus')) {
            const index = parseInt(e.target.dataset.index);
            if (cart[index]) {
                cart[index].qty = (cart[index].qty || 1) + 1;
                updateCart();
            }
        }

        if (e.target.classList.contains('minus')) {
            const index = parseInt(e.target.dataset.index);
            if (cart[index]) {
                if ((cart[index].qty || 1) > 1) {
                    cart[index].qty--;
                } else {
                    cart.splice(index, 1);
                }
                updateCart();
            }
        }

        if (e.target.classList.contains('remove-item')) {
            const index = parseInt(e.target.dataset.index);
            cart.splice(index, 1);
            updateCart();
        }
    });

    // ==================== CART DROPDOWN TOGGLE ====================
    const cartBtn = document.getElementById('cartBtn');
    const cartDropdown = document.getElementById('cartDropdown');

    if (cartBtn && cartDropdown) {
        cartBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            cartDropdown.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!cartBtn.contains(e.target) && !cartDropdown.contains(e.target)) {
                cartDropdown.classList.remove('active');
            }
        });
    }

    // ==================== CHECKOUT ====================
    const checkoutBtn = document.querySelector('.cart-total .btn-primary');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const user = JSON.parse(localStorage.getItem("user"));

            if (!user) {
                alert("Vui lòng đăng nhập để thanh toán!");
                window.location.href = "/html/auth.html";
                return;
            }

            if (cart.length === 0) {
                alert("Giỏ hàng trống!");
                return;
            }

            window.location.href = "/html/cart.html";
        });
    }

    // ==================== INITIALIZE ====================
    await loadProducts();
    updateCart();

    console.log('%c✅ STDShop đã sẵn sàng!', 'color:#00C9B0; font-size:18px; font-weight:bold');
});