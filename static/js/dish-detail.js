// Dữ liệu mẫu 
const product = { 
    id: 101, 
    name: "Áo Hoodie Oversize Unisex", 
    price: 189000, oldPrice: 229000, 
    seller: "Shop Sinh Viên HPU", 
    image: "https://down-vn.img.susercontent.com/file/vn-11134201-7r98o-lpja7tsxdp9xfe@resize_w900_nl.webp", 

    rating: "4.8", reviews: [ { avatar: "https://picsum.photos/id/64/80/80", 
    name: "Nguyễn Thị Lan", 
    rating: "★★★★★", 
    comment: "Áo chất lượng rất tốt, dày dặn, mặc ấm. Giao hàng nhanh, đóng gói cẩn thận.", 
    time: "2 ngày trước" }, { avatar: "https://picsum.photos/id/201/80/80", 
    name: "Trần Minh Quân", rating: "★★★★☆", 
    comment: "Form rộng thoải mái, màu đẹp. Chỉ hơi dài tay một chút nhưng vẫn rất ưng.", 
    time: "5 ngày trước" } ] };

// Render dữ liệu
function renderProduct() {
    document.getElementById('productName').textContent = product.name;
    document.getElementById('price').textContent = product.price.toLocaleString('vi-VN') + 'đ';
    document.getElementById('oldPrice').textContent = product.oldPrice.toLocaleString('vi-VN') + 'đ';
    document.getElementById('sellerName').textContent = product.seller;
    document.getElementById('mainImage').src = product.image;
    document.getElementById('rating').innerHTML = `${product.rating} ★★★★☆`;

const container = document.getElementById('reviewsContainer');

product.reviews.forEach(review => {
    const div = document.createElement('div');
    div.className = 'review-item';

    div.innerHTML = `
        <div class="review-avatar">
            <img src="${review.avatar}">
        </div>
        <div class="review-content">
            <strong>${review.name}</strong>
            <div class="stars">${review.rating}</div>
            <span style="color:#888; font-size:0.85rem;">${review.time}</span>
            <p>${review.comment}</p>
        </div>
    `;

    container.appendChild(div);
});
}

// Các hàm cũ của bạn
let quantity = 1;
function changeQuantity(change) {
    quantity = Math.max(1, quantity + change);
    document.getElementById('quantity').textContent = quantity;
}
let cart = [];

function addToCart() {
    // Lấy thông tin biến thể đang chọn (màu/size)
    const activeColor = document.querySelector('.color-item.active span')?.textContent || "Mặc định";
    const activeSize = document.querySelector('.size-item.active')?.textContent || "Mặc định";

    const item = {
        name: product.name,
        price: product.price,
        image: document.getElementById('mainImage').src, // Lấy ảnh hiện tại đang xem
        qty: quantity,
        variant: `${activeColor}, ${activeSize}`
    };

    cart.push(item);
    updateCartUI();

    // Hiệu ứng rung icon giỏ hàng
    const cartBtn = document.getElementById('cartBtn');
    cartBtn.classList.add('shake');
    setTimeout(() => cartBtn.classList.remove('shake'), 300);
}

function updateCartUI() {
    // 1. Cập nhật số lượng trên badge
    document.getElementById('cartCount').textContent = cart.length;
    document.getElementById('cartStatusText').textContent = `${cart.length} sản phẩm mới thêm`;

    // 2. Render danh sách vào dropdown
    const listContainer = document.getElementById('cartItemsList');
    if (cart.length === 0) {
        listContainer.innerHTML = `<p class="empty-cart-msg">Chưa có sản phẩm</p>`;
        return;
    }

    // Hiển thị 5 sản phẩm mới nhất (giống Shopee)
    const displayItems = [...cart].reverse().slice(0, 5);
    
    listContainer.innerHTML = displayItems.map(item => `
        <div class="cart-mini-item">
            <img src="${item.image}">
            <div class="cart-mini-info">
                <p class="cart-mini-name">${item.name}</p>
                <small style="color: #888;">Phân loại: ${item.variant}</small>
            </div>
            <span class="cart-mini-price">${item.price.toLocaleString()}đ</span>
        </div>
    `).join('');
}
// Khởi tạo
renderProduct();
const comboProducts = [
    { name: "Áo khoác Jeans unisex", price: 319000, old: 490000, img: "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lofcah3jdgj78b" },
    { name: "Quần jean ống suông", price: 320000, old: 430000, img: "https://static.oreka.vn/800-800_5978fb47-3be9-4587-b952-05ee6a2e68d9" },
    { name: "Áo bomber Unisex", price: 1305000, old: 1450000, img: "https://down-vn.img.susercontent.com/file/0a642f1c32371417f77d9a1c96aa030b" }
];

function renderCombo() {
    const container = document.getElementById("comboList");
    let total = 0;
    let oldTotal = 0;

    comboProducts.forEach(p => {
        total += p.price;
        oldTotal += p.old;

        container.innerHTML += `
            <div class="combo-item">
                <img src="${p.img}">
                <p>${p.name}</p>
                <p class="price">${p.price.toLocaleString()}đ</p>
            </div>
        `;
    });

    document.getElementById("comboTotal").innerText = total.toLocaleString() + "đ";
    document.getElementById("comboSave").innerText = (oldTotal - total).toLocaleString() + "đ";
}

renderCombo();
document.addEventListener("DOMContentLoaded", () => {

    const mainImage = document.getElementById("mainImage");

    // CHỌN MÀU + ĐỔI ẢNH
    document.querySelectorAll('.color-item').forEach(item => {
        item.addEventListener('click', () => {

            // bỏ active cũ
            document.querySelectorAll('.color-item').forEach(i => i.classList.remove('active'));

            // thêm active mới
            item.classList.add('active');

            // đổi ảnh theo data-image
            const newImg = item.getAttribute("data-image");
            if (newImg) {
                mainImage.src = newImg;
            }
        });
    });

    // CHỌN SIZE
    document.querySelectorAll('.size-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.size-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

});
//đổi ảnh
const mainImage = document.getElementById("mainImage");

document.querySelectorAll('.color-item').forEach(item => {
    item.addEventListener('click', function () {

        // đổi viền
        document.querySelectorAll('.color-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');

        // đổi ảnh
        const img = this.getAttribute("data-image");
        mainImage.src = img;
    });
});

const productImages = [
    "https://down-vn.img.susercontent.com/file/vn-11134201-7r98o-lpja7tsxdp9xfe",
    "https://down-vn.img.susercontent.com/file/vn-11134201-7r98o-lpja7vmyp2d1f9.webp",
    "https://down-vn.img.susercontent.com/file/vn-11134201-7r98o-lpja7umw5ulx2c.webp",
    "https://down-vn.img.susercontent.com/file/vn-11134201-7r98o-lpja7zt2le0f98.webp",
    "https://down-vn.img.susercontent.com/file/vn-11134201-7r98o-lpja7y0f808l44@resize_w450_nl.webp",
    "https://down-vn.img.susercontent.com/file/vn-11134201-7r98o-lpja80sb5u0lc0.webp",
    "https://down-vn.img.susercontent.com/file/vn-11134201-7r98o-lpja7z89fuph71@resize_w450_nl.webp"
];

function renderGallery() {
    const thumbnails = document.getElementById("thumbnailList");
    thumbnails.innerHTML = "";

    // set ảnh đầu
    document.getElementById("mainImage").src = productImages[0];

    productImages.forEach((img, index) => {
        const div = document.createElement("div");
        div.className = "thumbnail";

        if (index === 0) div.classList.add("active");

        div.innerHTML = `<img src="${img}">`;

        div.onclick = () => {
            document.getElementById("mainImage").src = img;

            document.querySelectorAll(".thumbnail").forEach(t => t.classList.remove("active"));
            div.classList.add("active");
        };

        thumbnails.appendChild(div);
    });
}

renderGallery();

// Dữ liệu gợi ý sản phẩm
const recommendedProducts = [
    {
        id: 201,
        name: "Áo Thun Nam Oversize Cotton",
        price: 129000,
        oldPrice: 199000,
        img: "https://down-vn.img.susercontent.com/file/sg-11134201-22120-tqp6klf7cykv08",
        rating: 4.8,
        sold: "1.2k"
    },
    {
        id: 202,
        name: "Balo Sinh Viên Chống Nước 17 Inch",
        price: 245000,
        oldPrice: 320000,
        img: "https://sakos.vn/wp-content/uploads/2024/07/balo-chong-nuoc-Sakos-Oceanus-xam-1.png",
        rating: 4.9,
        sold: "845"
    },
    {
        id: 203,
        name: "Sạc Dự Phòng Baseus 20000mAh",
        price: 390000,
        oldPrice: 520000,
        img: "https://smartones.com.vn/wp-content/uploads/2022/09/663200127a-7.jpg",
        rating: 4.7,
        sold: "3.4k"
    },
    {
        id: 204,
        name: "Giày Sneaker Nam Nữ Trắng",
        price: 289000,
        oldPrice: 450000,
        img: "https://shopdonghai.com/cdn/shop/files/giay-sneaker-nu-zuciani-GRC08-den-1_7b71cbc3-ace4-40f1-a77f-d1aec945f302.jpg",
        rating: 4.6,
        sold: "672"
    },
    {
        id: 205,
        name: "Quần Jeans Ống Suông Nam",
        price: 259000,
        oldPrice: 399000,
        img: "https://static.oreka.vn/800-800_5978fb47-3be9-4587-b952-05ee6a2e68d9",
        rating: 4.8,
        sold: "1.1k"
    }
];

function renderRecommended() {
    const grid = document.getElementById('recommendedGrid');
    grid.innerHTML = '';

    recommendedProducts.forEach(product => {
        const card = document.createElement('div');
        card.className = 'recommended-card';
        card.innerHTML = `
            <img src="${product.img}" alt="${product.name}">
            <div class="recommended-info">
                <div class="recommended-name">${product.name}</div>
                <div>
                    <span class="recommended-price">${product.price.toLocaleString('vi-VN')}đ</span>
                    ${product.oldPrice ? `<span class="old-price">${product.oldPrice.toLocaleString('vi-VN')}đ</span>` : ''}
                </div>
                <div class="recommended-meta">
                    <span class="rating">⭐ ${product.rating}</span>
                    <span class="sold">Đã bán ${product.sold}</span>
                </div>
            </div>
        `;
        
        // Click chuyển đến trang chi tiết (nếu có)
        card.onclick = () => {
            window.location.href = `product-detail.html?id=${product.id}`;
        };
        
        grid.appendChild(card);
    });
}

// Gọi hàm render khi trang load
document.addEventListener('DOMContentLoaded', () => {
    renderRecommended();  // hàm mới
    renderGallery();

});

