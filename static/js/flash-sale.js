// Dữ liệu Flash Sale
const products = {
    "Top sản phẩm nổi bật": [
    { name: "Áo Hoodie Oversize Unisex", price: 189000, oldPrice: 279000, discount: 42, img: "https://down-vn.img.susercontent.com/file/vn-11134201-7r98o-lpja7tsxdp9xfe", sold: "1.2k" },
    { name: "Balo Sinh Viên Chống Nước", price: 245000, oldPrice: 359000, discount: 36, img: "https://sakos.vn/wp-content/uploads/2024/07/balo-chong-nuoc-Sakos-Oceanus-xam-1.png", sold: "845" },
    { name: "Vở Ghi Chép B5 Dot Grid 200 trang", price: 45000, oldPrice: 65000, discount: 31, img: "https://klong.com.vn/image/cache/catalog/So%20ruot%20cham/960%20combo-800x800.jpg", sold: "1.1k" },
    { name: "Bình Giữ Nhiệt Lock&Lock 500ml", price: 135000, oldPrice: 199000, discount: 32, img: "https://down-vn.img.susercontent.com/file/82aae631338a31e639d9626a5cc16b11", sold: "760" },
    { name: "Giày Thể Thao Sneaker Nam/Nữ", price: 289000, oldPrice: 420000, discount: 31, img: "https://shopdonghai.com/cdn/shop/files/giay-sneaker-nu-zuciani-GRC08-den-1_7b71cbc3-ace4-40f1-a77f-d1aec945f302.jpg?crop=center&height=1663&v=1692267141&width=1280", sold: "672" },
    { name: "Đèn Bàn Học LED Chống Cận", price: 165000, oldPrice: 220000, discount: 25, img: "https://cdn.hstatic.net/products/200000661969/3_b60babf064754a339e970be5cf3c8c68_1024x1024.png", sold: "523" },
    { name: "Chuột Không Dây Logitech", price: 199000, oldPrice: 299000, discount: 33, img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/c/h/chuot-gaming-logitech-pro-x-superlight-2-lightspeed-2.png", sold: "410" },
    { name: "Túi Đeo Chéo Canvas Sinh Viên", price: 95000, oldPrice: 150000, discount: 37, img: "https://product.hstatic.net/1000238555/product/dcffggg_cba3a2ae4da2473d8e56ade28f1fdb60.jpg", sold: "888" },
    { name: "Mũ Lưỡi Trai Unisex", price: 65000, oldPrice: 99000, discount: 34, img: "https://file.hstatic.net/1000362402/file/4e5735095d67391837333b38624078f777ed3_bc76a7ea9d704f07b4c5962aee2af117.jpg", sold: "560" },
    { name: "Kem Dưỡng Da The Ordinary", price: 180000, oldPrice: 260000, discount: 31, img: "https://ordinary.com.vn/wp-content/uploads/2020/09/The-Ordinary-Natural-Moisturizing-Factor-HA-30ml.jpg", sold: "320" },
    { name: "Bút Bi Thiên Long 0.5mm - Hộp 12 cây", price: 35000, oldPrice: 55000, discount: 36, img: "https://dungcuhocsinh.vn/wp-content/uploads/2020/12/079-xanh.jpg", sold: "1k" },
    { name: "Áo Thun In Hình Trendy", price: 129000, oldPrice: 199000, discount: 35, img: "https://down-vn.img.susercontent.com/file/vn-11134207-7ra0g-m9xyjnezf8fi44", sold: "940" },
    { name: "Quần Jeans Nam/Nữ Ống Suông", price: 259000, oldPrice: 399000, discount: 35, img: "https://static.oreka.vn/800-800_5978fb47-3be9-4587-b952-05ee6a2e68d9", sold: "523" },
    { name: "Áo Thun Polo Nam Basic", price: 135000, oldPrice: 199000, discount: 32, img: "https://polomanor.vn/cdn/shop/files/ao-polo-nam-basic-classic-0.webp?v=1769054583", sold: "410" },
    { name: "Túi Tote Canvas Đa Năng", price: 89000, oldPrice: 140000, discount: 36, img: "https://head-fully.com/wp-content/uploads/2024/01/Tui-canvas-Tho-Bay-Mau-3.jpg", sold: "780" },
    { name: "Sổ Tay Planner 2026", price: 65000, oldPrice: 99000, discount: 34, img: "https://down-vn.img.susercontent.com/file/sg-11134201-824ji-mf855dham4uj08@resize_w450_nl.webp", sold: "620" },
    { name: "Máy Tính Casio FX-570ES Plus", price: 420000, oldPrice: 550000, discount: 24, img: "https://product.hstatic.net/1000330808/product/fx-570es_plus-2_cy-844a_f_copy_f7d417f2dec0473fa0cb8e4a436753a0.png", sold: "1.3k" },
    { name: "Quần Short Thể Thao Nam", price: 95000, oldPrice: 150000, discount: 37, img: "https://img.lazcdn.com/g/p/651dccd9638cc0bb20d37f5f13405d3d.jpg_720x720q80.jpg", sold: "530" }
],
    "Thời trang & phụ kiện": [
    { name: "Giày Sneaker Nam Nữ Trắng", price: 289000, oldPrice: 420000, discount: 31, img: "https://shopdonghai.com/cdn/shop/files/giay-sneaker-nu-zuciani-GRC08-den-1_7b71cbc3-ace4-40f1-a77f-d1aec945f302.jpg", sold: "672" },
    { name: "Sạc Dự Phòng Baseus 20000mAh", price: 390000, oldPrice: 520000, discount: 27, img: "https://smartones.com.vn/wp-content/uploads/2022/09/663200127a-7.jpg", sold: "1.4k" },
    { name: "Đèn Bàn Học LED Chống Cận", price: 165000, oldPrice: 220000, discount: 25, img: "https://cdn.hstatic.net/products/200000661969/3_b60babf064754a339e970be5cf3c8c68_1024x1024.png", sold: "523" },
    { name: "Túi Đeo Chéo Canvas Sinh Viên", price: 95000, oldPrice: 150000, discount: 37, img: "https://product.hstatic.net/1000238555/product/dcffggg_cba3a2ae4da2473d8e56ade28f1fdb60.jpg", sold: "888" },
    { name: "Áo Hoodie Oversize Unisex", price: 189000, oldPrice: 279000, discount: 42, img: "https://down-vn.img.susercontent.com/file/vn-11134201-7r98o-lpja7tsxdp9xfe", sold: "1.2k" },
    { name: "Balo Sinh Viên Chống Nước", price: 245000, oldPrice: 359000, discount: 36, img: "https://sakos.vn/wp-content/uploads/2024/07/balo-chong-nuoc-Sakos-Oceanus-xam-1.png", sold: "845" },
    { name: "Mũ Lưỡi Trai Unisex", price: 65000, oldPrice: 99000, discount: 34, img: "https://file.hstatic.net/1000362402/file/4e5735095d67391837333b38624078f777ed3_bc76a7ea9d704f07b4c5962aee2af117.jpg", sold: "560" },
    { name: "Áo Thun In Hình Trendy", price: 129000, oldPrice: 199000, discount: 35, img: "https://down-vn.img.susercontent.com/file/vn-11134207-7ra0g-m9xyjnezf8fi44", sold: "940" },
    { name: "Áo Thun Polo Nam Basic", price: 135000, oldPrice: 199000, discount: 32, img: "https://polomanor.vn/cdn/shop/files/ao-polo-nam-basic-classic-0.webp?v=1769054583", sold: "410" },
    { name: "Túi Tote Canvas Đa Năng", price: 89000, oldPrice: 140000, discount: 36, img: "https://head-fully.com/wp-content/uploads/2024/01/Tui-canvas-Tho-Bay-Mau-3.jpg", sold: "780" },

],
    "Shopee siêu rẻ": [
    { name: "Quần Jeans Ống Suông Nam", price: 259000, oldPrice: 399000, discount: 35, img: "https://static.oreka.vn/800-800_5978fb47-3be9-4587-b952-05ee6a2e68d9", sold: "523" },
    { name: "Đèn Bàn Học LED Chống Cận", price: 165000, oldPrice: 180000, discount: 35, img: "https://cdn.hstatic.net/products/200000661969/3_b60babf064754a339e970be5cf3c8c68_1024x1024.png", sold: "523" },
    { name: "Vở Ghi Chép B5 Dot Grid 200 trang", price: 45000, oldPrice: 65000, discount: 31, img: "https://klong.com.vn/image/cache/catalog/So%20ruot%20cham/960%20combo-800x800.jpg", sold: "1.1k" },
]
};



// Khởi tạo
document.addEventListener('DOMContentLoaded', () => {
    renderFlashSale();
    
    // Countdown timer
    let timeLeft = 15*60 + 59; // 15 phút 59 giây
    const countdownEl = document.getElementById('countdown');

    setInterval(() => {
        if (timeLeft <= 0) return;
        timeLeft--;
        const hours = Math.floor(timeLeft / 3600);
        const minutes = Math.floor((timeLeft % 3600) / 60);
        const seconds = timeLeft % 60;
        
        document.getElementById('hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
    }, 1000);
});
function renderFlashSale(category) {
    const container = document.getElementById('flashSaleGrid');
    container.innerHTML = '';

    const data = products[category] || [];

    data.forEach(product => {
        const card = document.createElement('div');
        card.className = 'flash-card';
        card.innerHTML = `
            <div style="position:relative;">
                <img src="${product.img}" alt="${product.name}">
                <div class="discount-badge">-${product.discount}%</div>
            </div>
            <div class="flash-info">
                <div class="product-name">${product.name}</div>

                <div class="price-row">
    <span class="flash-old-price">${product.oldPrice.toLocaleString('vi-VN')}đ</span>
    <span class="flash-price">${product.price.toLocaleString('vi-VN')}đ</span>
</div>
<div class="product-rating">
        ${renderStars(product.rating || 4.5)}
        <span>${product.rating || 4.5}</span>
    </div>
                <div class="sold-badge">ĐANG BÁN CHẠY • ${product.sold}</div>
            </div>
        `;
        container.appendChild(card);
    });
}
const tabs = document.querySelectorAll(".tab");
const productList = document.getElementById("productList");

tabs.forEach(tab => {
    tab.onclick = () => {
        document.querySelector(".tab.active").classList.remove("active");
        tab.classList.add("active");

        renderFlashSale(tab.textContent); // 👈 FIX CHÍNH
    }
});



document.addEventListener('DOMContentLoaded', () => {
    renderFlashSale("Top sản phẩm nổi bật");
});

function renderStars(rating) {
    let stars = "";
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;

    for (let i = 0; i < full; i++) {
        stars += '<i class="fas fa-star"></i>';
    }

    if (half) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }

    const empty = 5 - Math.ceil(rating);
    for (let i = 0; i < empty; i++) {
        stars += '<i class="far fa-star"></i>';
    }

    return stars;
}

