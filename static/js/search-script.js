const API_BASE = '/api';

let allProducts = [];
let filteredProducts = [];
let currentKeyword = '';
let currentCategory = '';
let currentPriceFilter = 'all';
let cart = JSON.parse(localStorage.getItem("cart")) || [];

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

// ==================== LOAD PRODUCTS ====================
async function loadAllProducts() {
    try {
        const res = await fetch(`${API_BASE}/products`);
        const data = await res.json();
        
        allProducts = data.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            rating: p.rating || 4.5,
            img: p.img,
            category: p.category || "Khác",
            seller: p.seller || "Shop"
        }));

        console.log('✅ Loaded products:', allProducts.length);
        
        // Lấy keyword từ URL
        const params = new URLSearchParams(window.location.search);
        currentKeyword = params.get('q') || '';
        
        if (currentKeyword) {
            performSearch(currentKeyword);
        } else {
            displayAllProducts();
        }

        populateFilters();

    } catch (err) {
        console.error('❌ Lỗi load products:', err);
    }
}

// ==================== PERFORM SEARCH ====================
function performSearch(keyword) {
    currentKeyword = keyword.toLowerCase();
    
    // Cập nhật header
    const searchTermEl = document.getElementById('searchTerm');
    if (searchTermEl) {
        searchTermEl.textContent = `Tìm kiếm: "${keyword}"`;
    }
    
    // Lọc sản phẩm (case-insensitive)
    filteredProducts = allProducts.filter(product =>
        product.name.toLowerCase().includes(currentKeyword) ||
        product.category.toLowerCase().includes(currentKeyword)
    );

    console.log('🔍 Found products:', filteredProducts.length);
    
    applyFilters();
}

// ==================== DISPLAY ALL PRODUCTS ====================
function displayAllProducts() {
    const searchTermEl = document.getElementById('searchTerm');
    if (searchTermEl) {
        searchTermEl.textContent = 'Tất cả sản phẩm';
    }
    filteredProducts = allProducts;
    renderResults();
}

// ==================== APPLY FILTERS ====================
function applyFilters() {
    let results = [...filteredProducts];

    // Filter by category
    if (currentCategory) {
        results = results.filter(p => p.category === currentCategory);
    }

    // Filter by price
    if (currentPriceFilter !== 'all') {
        results = results.filter(p => {
            if (currentPriceFilter === '0-100') return p.price < 100000;
            if (currentPriceFilter === '100-300') return p.price >= 100000 && p.price < 300000;
            if (currentPriceFilter === '300-500') return p.price >= 300000 && p.price < 500000;
            if (currentPriceFilter === '500+') return p.price >= 500000;
            return true;
        });
    }

    renderResults(results);
}

// ==================== POPULATE FILTERS ====================
function populateFilters() {
    const categories = [...new Set(allProducts.map(p => p.category))].sort();
    const filterContainer = document.getElementById('categoryFilters');
    
    if (!filterContainer) return;

    filterContainer.innerHTML = '<button class="filter-btn active" data-category="">📂 Tất cả</button>';
    
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.textContent = cat;
        btn.dataset.category = cat;
        btn.addEventListener('click', () => {
            document.querySelectorAll('#categoryFilters .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = cat;
            applyFilters();
        });
        filterContainer.appendChild(btn);
    });
}

// ==================== RENDER RESULTS ====================
function renderResults(results = filteredProducts) {
    const grid = document.getElementById('searchResultsGrid');
    const noResults = document.getElementById('noResults');
    const resultsCount = document.getElementById('resultsCount');

    if (!grid || !noResults || !resultsCount) {
        console.error('❌ Thiếu các element cần thiết');
        return;
    }

    if (results.length === 0) {
        grid.innerHTML = '';
        noResults.style.display = 'block';
        resultsCount.textContent = 'Không tìm thấy sản phẩm nào';
        return;
    }

    noResults.style.display = 'none';
    resultsCount.textContent = `Tìm thấy ${results.length} sản phẩm`;
    grid.innerHTML = '';

    results.forEach(product => {
        const card = document.createElement('div');
        card.className = 'dish-card';
        card.innerHTML = `
            <a href="/html/dish-detail.html?id=${product.id}" style="text-decoration: none; color: inherit;">
                <img src="${product.img}" alt="${product.name}" style="width: 100%; height: 180px; object-fit: cover; border-radius: 8px;">
                <div class="dish-info">
                    <h4 style="margin: 8px 0; font-size: 14px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${product.name}</h4>
                    <p class="rating" style="color: #f59e0b; margin: 4px 0; font-size: 13px;">⭐ ${product.rating}</p>
                    <p class="price" style="color: #00C9B0; font-weight: bold; margin: 4px 0; font-size: 15px;">${Number(product.price).toLocaleString('vi-VN')}đ</p>
                </div>
            </a>
        `;
        grid.appendChild(card);
    });
}

// ==================== PRICE FILTERS ====================
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPriceFilter = btn.dataset.filter;
            applyFilters();
        });
    });
});

// ==================== MAIN SEARCH BAR ====================
const mainSearchInput = document.getElementById('mainSearchInput');
const mainSearchResults = document.getElementById('mainSearchResults');

if (mainSearchInput) {
    mainSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const keyword = mainSearchInput.value.trim();
            if (keyword) {
                window.location.href = `/html/more-dishes.html?q=${encodeURIComponent(keyword)}`;
            }
        }
    });

    mainSearchInput.addEventListener('input', () => {
        const keyword = mainSearchInput.value.toLowerCase();

        if (keyword === '') {
            if (mainSearchResults) mainSearchResults.style.display = 'none';
            return;
        }

        const results = allProducts.filter(p =>
            p.name.toLowerCase().includes(keyword)
        ).slice(0, 5);

        renderMainSearchResults(results);
    });
}

function renderMainSearchResults(results) {
    if (!mainSearchResults) return;

    mainSearchResults.innerHTML = '';

    if (results.length === 0) {
        mainSearchResults.innerHTML = '<div class="search-item">Không tìm thấy sản phẩm</div>';
        mainSearchResults.style.display = 'block';
        return;
    }

    results.forEach(product => {
        const div = document.createElement('div');
        div.className = 'search-item';
        div.innerHTML = `
            <img src="${product.img}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
            <div class="search-info">
                <div class="search-name" style="font-weight: 500; color: #222;">${product.name}</div>
                <div class="search-price" style="color: #00C9B0; font-weight: bold;">${Number(product.price).toLocaleString('vi-VN')}đ</div>
            </div>
        `;
        div.onclick = () => {
            window.location.href = `/html/more-dishes.html?q=${encodeURIComponent(product.name)}`;
        };
        mainSearchResults.appendChild(div);
    });

    mainSearchResults.style.display = 'block';
}

// ==================== CART MANAGEMENT ====================
function updateCart() {
    const totalItems = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
    
    const cartCountEls = document.querySelectorAll('#cartCount');
    cartCountEls.forEach(el => el.textContent = totalItems);

    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');

    if (!cartItems) return;

    cartItems.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">Giỏ hàng trống</p>';
        if (cartTotal) cartTotal.textContent = '0đ';
        return;
    }

    cart.forEach((item, index) => {
        total += item.price * (item.qty || 1);
        const div = document.createElement('div');
        div.style.cssText = 'display: flex; gap: 12px; align-items: center; padding: 12px; border-bottom: 1px solid #f0f0f0;';
        div.innerHTML = `
            <img src="${item.img}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;">
            <div style="flex: 1;">
                <div style="font-size: 13px; font-weight: 500;">${item.name}</div>
                <div style="color: #00C9B0; font-weight: bold; font-size: 12px; margin-top: 4px;">${Number(item.price).toLocaleString('vi-VN')}đ</div>
            </div>
            <div style="display: flex; gap: 4px; align-items: center; border: 1px solid #ddd; border-radius: 4px; padding: 2px;">
                <button class="minus" data-index="${index}" style="width: 24px; height: 24px; border: none; background: white; color: #00C9B0; cursor: pointer; font-weight: bold;">−</button>
                <span style="min-width: 20px; text-align: center;">${item.qty || 1}</span>
                <button class="plus" data-index="${index}" style="width: 24px; height: 24px; border: none; background: white; color: #00C9B0; cursor: pointer; font-weight: bold;">+</button>
            </div>
            <button class="remove-item" data-index="${index}" style="background: none; border: none; color: #e74c3c; cursor: pointer;">✕</button>
        `;
        cartItems.appendChild(div);
    });

    if (cartTotal) cartTotal.textContent = Number(total).toLocaleString('vi-VN') + 'đ';
    localStorage.setItem('cart', JSON.stringify(cart));
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

// ==================== OPEN/CLOSE CART ====================
const openCartBtn = document.getElementById('openCartBtn');
const closeCartBtn = document.getElementById('closeCart');
const cartSidebar = document.getElementById('cartSidebar');

if (openCartBtn && cartSidebar) {
    openCartBtn.addEventListener('click', () => {
        cartSidebar.classList.toggle('open');
    });
}

if (closeCartBtn && cartSidebar) {
    closeCartBtn.addEventListener('click', () => {
        cartSidebar.classList.remove('open');
    });
}

// ==================== CHECKOUT ====================
const checkoutBtn = document.querySelector('.cart-total .btn-primary');
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) {
            alert("Vui lòng đăng nhập!");
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

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    loadAllProducts();
    updateCart();
    console.log('%c✅ Search page loaded!', 'color:#00C9B0; font-size:18px; font-weight:bold');
});