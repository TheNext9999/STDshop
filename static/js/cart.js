// ==================== DỮ LIỆU TEST (bạn có thể thay bằng localStorage sau) ====================
let cart = [
    {
        id: 101,
        name: "Áo Hoodie Oversize Unisex",
        price: 189000,
        qty: 1,
        img: "https://down-vn.img.susercontent.com/file/vn-11134201-7r98o-lpja7tsxdp9xfe@resize_w900_nl.webp"
    },
];

// Render giỏ hàng
function renderCart() {
    const container = document.getElementById('cartItemsContainer');
    container.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = `<div style="padding:60px;text-align:center;color:#888;">Giỏ hàng trống</div>`;
        updateTotal();
        return;
    }

    cart.forEach((item, index) => {
        const html = `
            <div class="cart-item">
                <input type="checkbox" checked>
                
                <div class="product-col">
                    <img src="${item.img}" alt="${item.name}">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-shop">STDShop Official</div>
                    </div>
                </div>

                <div class="cart-price">${item.price.toLocaleString('vi-VN')}đ</div>

                <div class="quantity-control">
                    <button onclick="changeQty(${index}, -1)">−</button>
                    <span>${item.qty}</span>
                    <button onclick="changeQty(${index}, 1)">+</button>
                </div>

                <div class="total-price">${(item.price * item.qty).toLocaleString('vi-VN')}đ</div>

                <button onclick="removeItem(${index})" class="remove-btn">×</button>
            </div>
        `;
        container.innerHTML += html;
    });

    updateTotal();
}

function updateTotal() {
    let total = 0;
    let count = 0;
    cart.forEach(item => {
        total += item.price * item.qty;
        count += item.qty;
    });
    document.getElementById('totalPrice').textContent = total.toLocaleString('vi-VN') + 'đ';
    document.getElementById('totalItems').textContent = count;
}

window.changeQty = function(index, change) {
    cart[index].qty += change;
    if (cart[index].qty < 1) cart[index].qty = 1;
    renderCart();
};

window.removeItem = function(index) {
    cart.splice(index, 1);
    renderCart();
};

window.removeSelected = function() {
    if (confirm('Xóa tất cả sản phẩm?')) {
        cart = [];
        renderCart();
    }
};

window.checkout = function() {
    if (cart.length === 0) return alert("Giỏ hàng trống!");
    alert("✅ Chuyển đến thanh toán...");
};

// Khởi tạo
renderCart();

