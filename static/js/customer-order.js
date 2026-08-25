const searchInput = document.getElementById('searchInput');
    const searchWrapper = document.querySelector('.search-wrapper');

    if (searchInput && searchWrapper) {
        searchInput.addEventListener('input', function() {
            if (this.value.trim().length > 0) {
                searchWrapper.classList.add('has-text');
            } else {
                searchWrapper.classList.remove('has-text');
            }
        });

        // Khi focus hoặc blur cũng kiểm tra
        searchInput.addEventListener('focus', function() {
            if (this.value.trim().length > 0) {
                searchWrapper.classList.add('has-text');
            }
        });

        searchInput.addEventListener('blur', function() {
            if (this.value.trim().length === 0) {
                searchWrapper.classList.remove('has-text');
            }
        });
    }

    
    
    
    
    // Dữ liệu Flash Sale
const flashSaleProducts = [
    { name: "Áo Hoodie Oversize Unisex", price: 189000, oldPrice: 279000, discount: 42, img: "https://down-vn.img.susercontent.com/file/vn-11134201-7r98o-lpja7tsxdp9xfe", sold: "1.2k" }
];

// ==================== DỮ LIỆU SẢN PHẨM ====================
const allProducts = [
    {
        id: 1,
        name: "Laptop Dell Inspiron 15 3000 – Core i5, RAM 8GB, SSD 256GB",
        price: 8990000, oldPrice: 14500000, discount: 38,
        rating: 4.8, ratingCount: 312, sold: 1240,
        img: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80",
        hot: true, category: "laptop"
    }
];

// ==================== HÀM TẠO CARD ====================
function formatPrice(n) {
    return n.toLocaleString('vi-VN') + 'đ';
}

function renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

function createProductCard(product) {
    const soldPercent = Math.min(Math.round((product.sold / 6000) * 100), 95);
    const soldDisplay = product.sold >= 1000
        ? (product.sold / 1000).toFixed(1).replace('.0','') + 'k'
        : product.sold;

    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
        <div class="product-card__img-wrap">
            <img src="${product.img}" alt="${product.name}" loading="lazy">
            <span class="product-card__discount">-${product.discount}%</span>
            ${product.hot ? '<span class="product-card__hot">🔥 Bán chạy</span>' : ''}
        </div>
        <div class="product-card__body">
            <div class="product-card__name">${product.name}</div>

            <div class="product-card__rating">
                <span class="product-card__stars">${renderStars(product.rating)}</span>
                <span class="product-card__rating-score">${product.rating}</span>
                <span class="product-card__rating-divider">|</span>
                <span class="product-card__sold">Đã bán ${soldDisplay}</span>
            </div>

            <div class="product-card__price-row">
                <span class="product-card__price">${formatPrice(product.price)}</span>
                <span class="product-card__price-original">${formatPrice(product.oldPrice)}</span>
            </div>
        </div>
    `;
    return card;
}

function addToCart(name, price) {
    const count = document.getElementById('cartCount');
    if (count) count.textContent = parseInt(count.textContent || '0') + 1;
}

// ==================== RENDER ====================
function renderFlashSale() {
    const container = document.getElementById('flashSaleGrid');
    if (!container) return;
    container.innerHTML = '';
    flashSaleProducts.forEach(product => {
        const card = document.createElement('div');
        card.className = 'flash-card';
        card.innerHTML = `
            <div style="position:relative;">
                <img src="${product.img}" alt="${product.name}">
                <div class="discount-badge">-${product.discount}%</div>
            </div>
            <div class="flash-info">
                <div class="flash-name" style="font-size:.82rem;font-weight:600;color:#222;margin-bottom:4px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${product.name}</div>
                <div class="flash-price">${product.price.toLocaleString('vi-VN')}đ</div>
                <div class="flash-old-price">${product.oldPrice.toLocaleString('vi-VN')}đ</div>
                <div class="sold-badge">BÁN CHẠY • ${product.sold}</div>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderTrending() {
    const container = document.getElementById('trendingGrid');
    if (!container) return;
    container.innerHTML = '';
    // Lấy 4 sản phẩm hot nhất
    const trending = allProducts.filter(p => p.hot).slice(0, 4);
    trending.forEach(p => container.appendChild(createProductCard(p)));
}

function renderAllProducts() {
    const container = document.getElementById('dishGrid');
    if (!container) return;
    container.innerHTML = '';
    allProducts.forEach(p => container.appendChild(createProductCard(p)));
}

// Khởi tạo
document.addEventListener('DOMContentLoaded', () => {
    renderFlashSale();
    renderTrending();
    renderAllProducts();

    // Countdown timer
    let timeLeft = 15 * 60 + 59;
    setInterval(() => {
        if (timeLeft <= 0) return;
        timeLeft--;
        const hours   = Math.floor(timeLeft / 3600);
        const minutes = Math.floor((timeLeft % 3600) / 60);
        const seconds = timeLeft % 60;
        const hEl = document.getElementById('hours');
        const mEl = document.getElementById('minutes');
        const sEl = document.getElementById('seconds');
        if (hEl) hEl.textContent = String(hours).padStart(2, '0');
        if (mEl) mEl.textContent = String(minutes).padStart(2, '0');
        if (sEl) sEl.textContent = String(seconds).padStart(2, '0');
    }, 1000);
});

// Điều khiển nút Flash Sale
document.getElementById('flashLeft').addEventListener('click', () => {
    document.getElementById('flashSaleGrid').scrollBy({ left: -220, behavior: 'smooth' });
});
document.getElementById('flashRight').addEventListener('click', () => {
    document.getElementById('flashSaleGrid').scrollBy({ left: 220, behavior: 'smooth' });
});

const slides = document.querySelectorAll('.hero-slide');
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

        // Tự động chuyển slide
        let autoSlide = setInterval(nextSlide, slideInterval);

        // Nút manual
        document.getElementById('heroRight').addEventListener('click', () => {
            clearInterval(autoSlide);
            nextSlide();
            autoSlide = setInterval(nextSlide, slideInterval);
        });

        document.getElementById('heroLeft').addEventListener('click', () => {
            clearInterval(autoSlide);
            prevSlide();
            autoSlide = setInterval(nextSlide, slideInterval);
        });

        // Khởi tạo
        showSlide(0);

