// Dữ liệu mẫu đơn hàng
        let orders = [
            {
                id: "STD240403001",
                date: "03/04/2026",
                status: "waiting",
                statusText: "Chờ vận chuyển",
                total: 189000,
                address: "Phương Canh, Nam Từ Liêm",
                products: [{ name: "Áo Hoodie Oversize Unisex", qty: 1, img: "https://down-vn.img.susercontent.com/file/vn-11134201-7r98o-lpja7tsxdp9xfe" }]
            },
            {
                id: "STD240401012",
                date: "01/04/2026",
                status: "waiting",
                statusText: "Chờ vận chuyển",
                total: 245000,
                products: [{ name: "Sạc Dự Phòng Baseus", qty: 1, img: "https://smartones.com.vn/wp-content/uploads/2022/09/663200127a-7.jpg" }]
            },
            {
                id: "STD240402005",
                date: "02/04/2026",
                status: "shipping",
                statusText: "Đang vận chuyển",
                total: 520000,
                products: [{ name: "Balo Sinh Viên Chống Nước", qty: 2, img: "https://sakos.vn/wp-content/uploads/2024/07/balo-chong-nuoc-Sakos-Oceanus-xam-1.png" }]
            },
            // === THÊM 10 ĐƠN HÀNG HOÀN THÀNH ===
{
    id: "STD240401012",
    date: "01/04/2026",
    status: "shipping",
    statusText: "Đang vận chuyển",
    total: 245000,
    products: [{ name: "Sạc Dự Phòng Baseus 20000mAh", qty: 1, img: "https://smartones.com.vn/wp-content/uploads/2022/09/663200127a-7.jpg" }]
},
{
    id: "STD240330015",
    date: "30/03/2026",
    status: "completed",
    statusText: "Hoàn thành",
    total: 650000,
    products: [{ name: "Giày Sneaker Nam Nữ Trắng", qty: 1, img: "https://shopdonghai.com/cdn/shop/files/giay-sneaker-nu-zuciani-GRC08-den-1_7b71cbc3-ace4-40f1-a77f-d1aec945f302.jpg" }]
},
{
    id: "STD240329007",
    date: "29/03/2026",
    status: "completed",
    statusText: "Hoàn thành",
    total: 320000,
    products: [{ name: "Quần Jeans Ống Suông Nam", qty: 1, img: "https://static.oreka.vn/800-800_5978fb47-3be9-4587-b952-05ee6a2e68d9" }]
},
{
    id: "STD240328022",
    date: "28/03/2026",
    status: "completed",
    statusText: "Hoàn thành",
    total: 450000,
    products: [{ name: "Balo Sinh Viên Chống Nước 17 Inch", qty: 1, img: "https://sakos.vn/wp-content/uploads/2024/07/balo-chong-nuoc-Sakos-Oceanus-xam-1.png" }]
},
{
    id: "STD240327011",
    date: "27/03/2026",
    status: "completed",
    statusText: "Hoàn thành",
    total: 135000,
    products: [{ name: "Bình Giữ Nhiệt Lock&Lock 500ml", qty: 2, img: "https://down-vn.img.susercontent.com/file/82aae631338a31e639d9626a5cc16b11" }]
},
{
    id: "STD240326019",
    date: "26/03/2026",
    status: "completed",
    statusText: "Hoàn thành",
    total: 890000,
    products: [{ name: "Áo Bomber Unisex Cao Cấp", qty: 1, img: "https://down-vn.img.susercontent.com/file/0a642f1c32371417f77d9a1c96aa030b" }]
},
{
    id: "STD240325014",
    date: "25/03/2026",
    status: "completed",
    statusText: "Hoàn thành",
    total: 129000,
    products: [{ name: "Áo Thun In Hình Trendy", qty: 3, img: "https://down-vn.img.susercontent.com/file/vn-11134207-7ra0g-m9xyjnezf8fi44" }]
},
{
    id: "STD240324009",
    date: "24/03/2026",
    status: "completed",
    statusText: "Hoàn thành",
    total: 550000,
    products: [{ name: "Tai Nghe Bluetooth AirPods Style", qty: 1, img: "https://cdn.tgdd.vn/Products/Images/54/315014/tai-nghe-bluetooth-airpods-pro-2nd-gen-usb-c-charge-apple-1-750x500.jpg" }]
},
{
    id: "STD240323018",
    date: "23/03/2026",
    status: "cancelled",
    statusText: "Đã hủy",
    total: 165000,
    products: [{ name: "Đèn Bàn Học LED Chống Cận", qty: 1, img: "https://cdn.hstatic.net/products/200000661969/3_b60babf064754a339e970be5cf3c8c68_1024x1024.png" }]
}

        ];

        function getStatusClass(status) {
            if (status === "shipping") return "status-shipping";
            if (status === "completed") return "status-completed";
            if (status === "cancelled") return "status-cancelled";
            if (status === "return") return "status-return";
            if (status === "waiting") return "status-waiting";
            return "";
        }

        function renderOrders(filteredOrders) {
            const container = document.getElementById('orderList');
            container.innerHTML = '';

            filteredOrders.forEach(order => {
                let productHTML = order.products.map(p => `
                    <div class="product-row">
                        <img src="${p.img}" alt="${p.name}">
                        <div>
                            <strong>${p.name}</strong><br>
                            <small>Số lượng: ${p.qty}</small>
                        </div>
                    </div>
                `).join('');

                container.innerHTML += `
<div class="order-card">

    <div class="order-header">
        <div>
            <strong>Mã đơn: ${order.id}</strong><br>
            <small>Ngày: ${order.date}</small>
        </div>
        <span class="order-status ${getStatusClass(order.status)}">
            ${order.statusText}
        </span>
    </div>

    <div class="order-extra">
        <div>📍 ${order.address || "Nam Từ Liêm"}</div>
        <div>💳 ${order.payment || "Đã thanh toán"}</div>
    </div>

    ${productHTML}

    <div class="action-buttons">

    <button class="btn-primary" onclick='showOrderDetail(${JSON.stringify(order)})'>
        <i class="fas fa-eye"></i>
        Chi tiết
    </button>

    ${order.status === "waiting" ? `
        <button class="btn-outline btn-danger">
            Hủy đơn
        </button>` : ''}

    ${order.status === "shipping" ? `
        <button class="btn-outline">
            Theo dõi
        </button>` : ''}

    ${order.status === "completed" ? `
        <button class="btn-outline">
            Đánh giá
        </button>` : ''}

</div>
`;
            });
        }

        // Xử lý click tab
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const status = tab.dataset.status;
                let filtered = orders;

                if (status !== "all") {
                    filtered = orders.filter(o => o.status === status);
                }

                renderOrders(filtered);
            });
        });

        // Khởi tạo
        renderOrders(orders);

        function showOrderDetail(order) {
    const modal = document.getElementById('orderModal');
    const body = document.getElementById('modalBody');

    body.innerHTML = `
        <div class="modal-header">Chi tiết đơn hàng</div>

        <div class="modal-info"><b>Mã:</b> ${order.id}</div>
        <div class="modal-info"><b>Ngày:</b> ${order.date}</div>
        <div class="modal-info"><b>Trạng thái:</b> ${order.statusText}</div>

        <hr>

        ${order.products.map(p => `
            <div class="modal-product">
                <img src="${p.img}">
                <div>
                    <div class="modal-product-name">${p.name}</div>
                    <div class="modal-product-qty">Số lượng: ${p.qty}</div>
                </div>
            </div>
        `).join('')}

        <div class="modal-total">
            Tổng: ${order.total.toLocaleString('vi-VN')}đ
        </div>
    `;

    modal.style.display = "block";
}

// Đóng modal khi bấm X
document.getElementById('closeModal').onclick = () => {
    document.getElementById('orderModal').style.display = "none";
};

// Đóng khi click ra ngoài
window.onclick = (e) => {
    const modal = document.getElementById('orderModal');
    if (e.target === modal) {
        modal.style.display = "none";
    }
};

