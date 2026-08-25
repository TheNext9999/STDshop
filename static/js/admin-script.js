// ============================================================
// 🔐 ADMIN SCRIPT - DTAFood
// Gọi API từ /api/admin/* thay vì dùng localStorage
// ============================================================

const API = 'http://localhost:3000/api';

// Inline SVG used as fallback when product images fail to load.
// Using a data URI avoids any external HTTP request (and the resulting
// infinite onerror loop that via.placeholder.com caused).
const FALLBACK_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Crect width='60' height='60' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' font-size='10' fill='%23999' text-anchor='middle' dominant-baseline='middle'%3ENo img%3C/text%3E%3C/svg%3E";

/**
 * Wrapper around fetch that:
 *  1. Throws a descriptive Error when the server returns a non-2xx status,
 *     so callers never accidentally process an error-body as real data.
 *  2. Returns the parsed JSON on success.
 */
async function fetchJSON(url, options) {
    const res = await fetch(url, options);
    if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const b = await res.json(); msg = b.error || b.message || msg; } catch (_) {}
        throw new Error(msg);
    }
    return res.json();
}

// ============================================================
// ✅ KIỂM TRA ĐĂNG NHẬP
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
    const adminName  = localStorage.getItem("currentAdmin");

    if (adminName) {
        document.getElementById("adminName").textContent = "Xin chào, " + adminName;
    }

    // ── Khởi tạo tất cả section khi load ──
    loadDashboard();
    loadItemsTable();
    loadPendingProducts();
    loadSellers();
    renderUsersTable();
    loadOrders();
    loadVouchers();
    loadAdmins();
    initTabSwitch();
    initSidebarNav();
});

// ============================================================
// 🚪 ĐĂNG XUẤT
// ============================================================
function logout() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("currentAdmin");
    window.location.href = "login-admin.html";
}

document.querySelector(".btn-primary[onclick]") &&
    document.querySelector(".btn-primary[onclick]").addEventListener("click", logout);

// ============================================================
// 📊 DASHBOARD - lấy số liệu thật từ API
// ============================================================
async function loadDashboard() {
    try {
        const data = await fetchJSON(`${API}/admin/dashboard`);

        // Cập nhật các card tổng quan
        setEl("stat-orders-today",    data.orders_today       ?? '--');
        setEl("stat-revenue",         formatCurrency(data.revenue_this_month ?? 0));
        setEl("stat-active-users",    data.active_users       ?? '--');
        setEl("stat-complaints",      data.pending_complaints ?? '--');
        setEl("stat-pending-products",data.pending_products   ?? '--');

    } catch (e) {
        console.warn("⚠️ [Dashboard] Không load được stats:", e.message);
    }

    // Top sản phẩm bán chạy
    try {
        const items = await fetchJSON(`${API}/admin/dashboard/top-products`);
        if (!Array.isArray(items)) { renderTopProducts([]); return; }
        renderTopProducts(items);
    } catch (e) {
        console.warn("⚠️ [Dashboard] Không load top products:", e.message);
    }

    // Chart doanh thu
    try {
        const months = await fetchJSON(`${API}/admin/dashboard/revenue`);
        if (!Array.isArray(months)) { console.warn("⚠️ [Dashboard] revenue data không phải array"); return; }
        renderRevenueChart(months);
    } catch (e) {
        console.warn("⚠️ [Dashboard] Không load revenue chart:", e.message);
    }

    // Top shops (giữ data tĩnh vì chưa có API shop riêng)
    renderTopShops();
}

function renderTopProducts(items) {
    const list = document.querySelector(".top-dishes-list");
    if (!list || !items.length) return;

    list.innerHTML = items.slice(0, 5).map(p => `
        <div class="top-dish-item">
            <img src="${p.img || FALLBACK_IMG}"
                 onerror="this.src=FALLBACK_IMG;this.onerror=null">
            <div class="top-dish-info">
                <p class="top-name">${p.name}</p>
                <p class="top-stat">${p.total_sold} đơn • ${formatCurrency(p.total_revenue)}</p>
            </div>
        </div>
    `).join('');
}

// Track chart instance to allow safe re-render
let _revenueChartInstance = null;

function renderRevenueChart(months) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    // Destroy previous chart instance before creating a new one
    if (_revenueChartInstance) {
        _revenueChartInstance.destroy();
        _revenueChartInstance = null;
    }

    const labels = months.map(m => `T${m.month}/${m.year}`).reverse();
    const data   = months.map(m => m.revenue).reverse();

    _revenueChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Doanh thu (VND)',
                data,
                borderColor: '#00C9B0',
                backgroundColor: 'rgba(0,201,176,0.15)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#00C9B0',
                borderWidth: 3,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: { responsive: true }
    });
}

const topShops = [
    { name: "Shop Sinh Viên 247",  revenue: 88000000, orders: 467, rating: 4.9 },
    { name: "TechZone Giá Rẻ",     revenue: 77000000, orders: 460, rating: 4.8 },
    { name: "Sneaker Campus",       revenue: 54000000, orders: 420, rating: 4.7 },
    { name: "Phụ Kiện Baseus VN",  revenue: 40000000, orders: 400, rating: 4.6 },
    { name: "Jeans Local Brand",    revenue: 35000000, orders: 380, rating: 4.5 }
];

function renderTopShops() {
    const table = document.getElementById("topShopsTable");
    if (!table) return;

    table.innerHTML = topShops.map((shop, i) => `
        <tr>
            <td>${getRankUI(i)}<br><strong>${shop.name}</strong></td>
            <td>${formatCurrency(shop.revenue)}</td>
            <td>${shop.orders}</td>
            <td>⭐ ${shop.rating}</td>
        </tr>
    `).join('');
}

function getRankUI(i) {
    if (i === 0) return `<span style="color:#FFD700;">🥇 Top 1</span>`;
    if (i === 1) return `<span style="color:#C0C0C0;">🥈 Top 2</span>`;
    if (i === 2) return `<span style="color:#CD7F32;">🥉 Top 3</span>`;
    return `<span>#${i + 1}</span>`;
}

// ============================================================
// 📦 BẢNG SẢN PHẨM ĐÃ DUYỆT (lấy từ /api/products)
// ============================================================
async function loadItemsTable() {
    const tbody = document.getElementById("itemsTableBody");
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center">⏳ Đang tải...</td></tr>`;

    try {
        const foods = await fetchJSON(`${API}/products`);
        if (!Array.isArray(foods)) throw new Error(`Expected array, got: ${JSON.stringify(foods)}`);

        if (!foods.length) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center">Chưa có sản phẩm nào</td></tr>`;
            return;
        }

        tbody.innerHTML = foods.map(food => `
            <tr>
                <td><input type="checkbox" value="${food.id}"></td>
                <td>
                    <img src="${food.img || FALLBACK_IMG}"
                         onerror="this.src=FALLBACK_IMG;this.onerror=null"
                         style="width:60px;height:60px;object-fit:cover;border-radius:8px">
                </td>
                <td>${food.name}</td>
                <td>${(food.price || 0).toLocaleString('vi-VN')}đ</td>
                <td>${food.seller || 'N/A'}</td>
                <td>${food.category || 'Khác'}</td>
                <td>⭐ ${food.rating || 4.5}</td>
                <td>
                    <span class="status ${food.status || 'active'}">
                        ${food.status === 'hidden' ? 'Đã ẩn' : 'Đang bán'}
                    </span>
                </td>
                <td>
                    <button onclick="deleteProduct(${food.id})" class="action-btn btn-reject">
                        <i class="fas fa-trash"></i> Xóa
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="9" style="color:red;text-align:center">❌ Lỗi tải sản phẩm</td></tr>`;
        console.error('❌ [Products]', e);
    }
}

async function deleteProduct(id) {
    if (!confirm("Xóa sản phẩm này?")) return;
    try {
        await fetch(`${API}/admin/products/${id}`, { method: 'DELETE' });
        alert("✅ Đã xóa sản phẩm!");
        loadItemsTable();
    } catch (e) {
        alert("❌ Lỗi xóa sản phẩm");
    }
}

// ============================================================
// ✅ DUYỆT SẢN PHẨM MỚI (lấy từ /api/admin/pending-products)
// ============================================================
async function loadPendingProducts() {
    const tbody = document.getElementById("approveTableBody");
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center">⏳ Đang tải...</td></tr>`;

    try {
        const pending = await fetchJSON(`${API}/admin/pending-products`);
        if (!Array.isArray(pending)) throw new Error(`Expected array, got: ${JSON.stringify(pending)}`);

        if (!pending.length) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center">✅ Không có sản phẩm chờ duyệt</td></tr>`;
            return;
        }

        tbody.innerHTML = pending.map(p => `
            <tr>
                <td><input type="checkbox" value="${p.id}"></td>
                <td>
                    <img src="${p.img || FALLBACK_IMG}"
                         onerror="this.src=FALLBACK_IMG;this.onerror=null"
                         style="width:60px;height:60px;object-fit:cover;border-radius:8px">
                </td>
                <td>${p.name}</td>
                <td>${p.seller_name || 'Người bán'}</td>
                <td>${p.description || 'N/A'}</td>
                <td>
                    <button class="action-btn btn-approve" onclick="approveDish(${p.id})">
                        <i class="fas fa-check"></i> Duyệt
                    </button>
                    <button class="action-btn btn-reject" onclick="rejectDish(${p.id})">
                        <i class="fas fa-times"></i> Từ chối
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="6" style="color:red;text-align:center">❌ Lỗi tải dữ liệu</td></tr>`;
        console.error('❌ [Pending Products]', e);
    }
}

async function approveDish(id) {
    try {
        const data = await fetchJSON(`${API}/admin/pending-products/${id}/approve`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_id: getAdminId() })
        });
        alert(data.message || "✅ Đã duyệt sản phẩm!");
        loadPendingProducts();
        loadItemsTable();
    } catch (e) {
        alert("❌ Lỗi duyệt sản phẩm");
    }
}

async function rejectDish(id) {
    if (!confirm("Từ chối sản phẩm này?")) return;
    try {
        const data = await fetchJSON(`${API}/admin/pending-products/${id}/reject`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_id: getAdminId(), reason: 'Không đạt yêu cầu' })
        });
        alert(data.message || "❌ Đã từ chối!");
        loadPendingProducts();
    } catch (e) {
        alert("❌ Lỗi từ chối sản phẩm");
    }
}

// ============================================================
// 👥 QUẢN LÝ USERS (lấy từ /api/admin/users)
// ============================================================
async function renderUsersTable() {
    const tbody = document.querySelector("#customersTab tbody");
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center">⏳ Đang tải...</td></tr>`;

    try {
        const users = await fetchJSON(`${API}/admin/users`);
        if (!Array.isArray(users)) throw new Error(`Expected array, got: ${JSON.stringify(users)}`);

        if (!users.length) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center">Chưa có khách hàng nào</td></tr>`;
            return;
        }

        tbody.innerHTML = users.map(user => `
            <tr>
                <td><input type="checkbox" value="${user.id}"></td>
                <td>
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&size=50&background=00C9B0&color=fff"
                         style="border-radius:50%;width:45px;height:45px;">
                </td>
                <td>${user.name}</td>
                <td>${user.email || ''} / ${user.phone || ''}</td>
                <td>${formatDate(user.created_at)}</td>
                <td>
                    <span class="status ${user.status === 'blocked' ? 'blocked' : 'active'}">
                        ${user.status === 'blocked' ? 'Bị khóa' : 'Hoạt động'}
                    </span>
                </td>
                <td>
                    <button onclick="toggleUserStatus(${user.id})"
                            class="action-btn ${user.status === 'blocked' ? 'btn-approve' : 'btn-reject'}">
                        ${user.status === 'blocked' ? '🔓 Mở khóa' : '🔒 Khóa'}
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="7" style="color:red;text-align:center">❌ Lỗi tải users</td></tr>`;
        console.error('❌ [Users]', e);
    }
}

async function toggleUserStatus(id) {
    try {
        const data = await fetchJSON(`${API}/admin/users/${id}/toggle-status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_id: getAdminId() })
        });
        alert(data.message);
        renderUsersTable();
    } catch (e) {
        alert("❌ Lỗi cập nhật trạng thái user");
    }
}

// ============================================================
// 🏪 QUẢN LÝ SELLERS (lấy từ /api/admin/sellers)
// ============================================================
async function loadSellers() {
    const table = document.getElementById("sellersTableBody");
    if (!table) return;

    table.innerHTML = `<tr><td colspan="7" style="text-align:center">⏳ Đang tải...</td></tr>`;

    try {
        const sellers = await fetchJSON(`${API}/admin/sellers`);
        if (!Array.isArray(sellers)) throw new Error(`Expected array, got: ${JSON.stringify(sellers)}`);

        if (!sellers.length) {
            table.innerHTML = `<tr><td colspan="7" style="text-align:center">Chưa có người bán nào</td></tr>`;
            return;
        }

        table.innerHTML = sellers.map(seller => `
            <tr>
                <td><input type="checkbox" value="${seller.id}"></td>
                <td>
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(seller.shop_name)}&size=50&background=0d9a80&color=fff"
                         style="border-radius:8px;width:50px;height:50px;">
                </td>
                <td>${seller.shop_name}</td>
                <td>${seller.email} / ${seller.phone || ''}</td>
                <td>${formatDate(seller.created_at)}</td>
                <td>
                    <span class="status status-${seller.status}">
                        ${{ pending:'Chờ duyệt', approved:'Đã duyệt', blocked:'Bị khóa', rejected:'Từ chối' }[seller.status] || seller.status}
                    </span>
                </td>
                <td class="action-cell">
                    ${seller.status === 'pending' ? `
                        <button class="action-btn btn-approve" onclick="approveSeller(${seller.id})">
                            <i class="fas fa-check"></i> Duyệt
                        </button>
                        <button class="action-btn btn-reject" onclick="rejectSeller(${seller.id})">
                            <i class="fas fa-times"></i> Từ chối
                        </button>
                    ` : `
                        <button class="action-btn btn-reject" onclick="toggleBlockSeller(${seller.id})">
                            ${seller.status === 'blocked' ? '🔓 Mở khóa' : '🔒 Khóa'}
                        </button>
                    `}
                </td>
            </tr>
        `).join('');

    } catch (e) {
        table.innerHTML = `<tr><td colspan="7" style="color:red;text-align:center">❌ Lỗi tải sellers</td></tr>`;
        console.error('❌ [Sellers]', e);
    }
}

async function approveSeller(id) {
    try {
        const data = await fetchJSON(`${API}/admin/sellers/${id}/approve`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_id: getAdminId() })
        });
        alert(data.message);
        loadSellers();
    } catch (e) {
        alert("❌ Lỗi duyệt seller");
    }
}

async function rejectSeller(id) {
    const reason = prompt("Lý do từ chối (tuỳ chọn):");
    if (reason === null) return; // bấm Cancel
    try {
        const data = await fetchJSON(`${API}/admin/sellers/${id}/reject`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_id: getAdminId(), reason })
        });
        alert(data.message);
        loadSellers();
    } catch (e) {
        alert("❌ Lỗi từ chối seller");
    }
}

async function toggleBlockSeller(id) {
    try {
        const data = await fetchJSON(`${API}/admin/sellers/${id}/toggle-block`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        });
        alert(data.message);
        loadSellers();
    } catch (e) {
        alert("❌ Lỗi cập nhật trạng thái seller");
    }
}

// ============================================================
// 🛒 QUẢN LÝ ĐƠN HÀNG (lấy từ /api/admin/orders)
// ============================================================
async function loadOrders(status = '', search = '') {
    const tbody = document.getElementById("orderTableBody");
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center">⏳ Đang tải...</td></tr>`;

    try {
        let url = `${API}/admin/orders?limit=50`;
        if (status) url += `&status=${status}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;

        const orders = await fetchJSON(url);
        if (!Array.isArray(orders)) throw new Error(`Expected array, got: ${JSON.stringify(orders)}`);

        if (!orders.length) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center">Chưa có đơn hàng nào</td></tr>`;
            return;
        }

        tbody.innerHTML = orders.map(o => `
            <tr>
                <td><input type="checkbox" value="${o.id}"></td>
                <td>#${o.order_code || o.id}</td>
                <td>${o.customer_name || o.user_name || 'N/A'}</td>
                <td>${o.customer_phone || o.user_phone || 'N/A'}</td>
                <td>${(o.total_price || 0).toLocaleString('vi-VN')}đ</td>
                <td>
                    <span class="badge ${o.status}">
                        ${getOrderStatusText(o.status)}
                    </span>
                </td>
                <td>${formatDate(o.created_at)}</td>
                <td>
                    <button class="action-btn btn-view" onclick="viewOrder(${o.id})">
                        <i class="fas fa-eye"></i> Xem
                    </button>
                    ${o.status === 'pending' ? `
                        <button class="action-btn btn-approve" onclick="updateOrderStatus(${o.id},'confirmed')">
                            Xác nhận
                        </button>
                    ` : ''}
                    ${['pending','confirmed'].includes(o.status) ? `
                        <button class="action-btn btn-reject" onclick="updateOrderStatus(${o.id},'cancelled')">
                            Hủy
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');

    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="8" style="color:red;text-align:center">❌ Lỗi tải đơn hàng</td></tr>`;
        console.error('❌ [Orders]', e);
    }
}

async function updateOrderStatus(id, status) {
    try {
        const data = await fetchJSON(`${API}/admin/orders/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, admin_id: getAdminId() })
        });
        alert(data.message);
        loadOrders();
    } catch (e) {
        alert("❌ Lỗi cập nhật đơn hàng");
    }
}

function getOrderStatusText(status) {
    const map = {
        pending:   'Chờ xác nhận',
        confirmed: 'Đã xác nhận',
        shipping:  'Đang giao',
        completed: 'Hoàn thành',
        cancelled: 'Đã hủy',
        returned:  'Hoàn trả'
    };
    return map[status] || status;
}

function viewOrder(id) {
    alert(`Xem chi tiết đơn hàng #${id}\n(Tích hợp modal chi tiết tại đây)`);
}

// ============================================================
// 🎫 QUẢN LÝ VOUCHERS (lấy từ /api/admin/vouchers)
// ============================================================
async function loadVouchers() {
    const tbody = document.getElementById("voucherTableBody");
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center">⏳ Đang tải...</td></tr>`;

    try {
        const vouchers = await fetchJSON(`${API}/admin/vouchers`);
        if (!Array.isArray(vouchers)) throw new Error(`Expected array, got: ${JSON.stringify(vouchers)}`);

        if (!vouchers.length) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center">Chưa có voucher nào</td></tr>`;
            return;
        }

        tbody.innerHTML = vouchers.map(v => `
            <tr>
                <td><input type="checkbox" value="${v.id}"></td>
                <td><strong>${v.code}</strong></td>
                <td>${v.type === 'percent' ? 'Giảm %' : 'Giảm VND'}</td>
                <td>${v.type === 'percent' ? v.value + '%' : v.value.toLocaleString('vi-VN') + 'đ'}</td>
                <td>${v.valid_from ? formatDate(v.valid_from) : '---'} → ${v.valid_to ? formatDate(v.valid_to) : '---'}</td>
                <td>${v.used_count || 0}</td>
                <td>${v.max_uses || '∞'}</td>
                <td>
                    <span class="badge ${v.status}">
                        ${{ active:'Hoạt động', expired:'Hết hạn', disabled:'Vô hiệu' }[v.status] || v.status}
                    </span>
                </td>
                <td>
                    ${v.status === 'active' ? `
                        <button class="action-btn btn-reject" onclick="disableVoucher(${v.id})">
                            <i class="fas fa-stop"></i> Vô hiệu
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');

    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="9" style="color:red;text-align:center">❌ Lỗi tải vouchers</td></tr>`;
        console.error('❌ [Vouchers]', e);
    }
}

async function disableVoucher(id) {
    if (!confirm("Vô hiệu hóa voucher này?")) return;
    try {
        const data = await fetchJSON(`${API}/admin/vouchers/${id}/disable`, { method: 'PUT' });
        alert(data.message);
        loadVouchers();
    } catch (e) {
        alert("❌ Lỗi vô hiệu hóa voucher");
    }
}

// Tạo voucher mới từ form modal
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("voucherForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const body = {
            code:       document.getElementById("voucherCode")?.value,
            type:       document.getElementById("voucherType")?.value,
            value:      parseInt(document.getElementById("voucherValue")?.value),
            max_uses:   parseInt(document.getElementById("voucherLimit")?.value) || 100,
            valid_from: document.getElementById("voucherStartDate")?.value,
            valid_to:   document.getElementById("voucherEndDate")?.value,
            admin_id:   getAdminId()
        };

        try {
            const data = await fetchJSON(`${API}/admin/vouchers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            alert(data.message);
            if (res.ok) {
                form.reset();
                document.getElementById("voucherModal")?.style && (document.getElementById("voucherModal").style.display = "none");
                loadVouchers();
            }
        } catch (e) {
            alert("❌ Lỗi tạo voucher");
        }
    });
});

// ============================================================
// 👑 QUẢN LÝ TÀI KHOẢN ADMIN (lấy từ /api/admin/admins)
// ============================================================
async function loadAdmins() {
    const tbody = document.getElementById("adminAccountsTableBody");
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center">⏳ Đang tải...</td></tr>`;

    try {
        const admins = await fetchJSON(`${API}/admin/admins`);
        if (!Array.isArray(admins)) throw new Error(`Expected array, got: ${JSON.stringify(admins)}`);

        // Cập nhật stat cards
        setEl("totalAdmins",   admins.length);
        setEl("pendingCount",  admins.filter(a => a.status === 'pending').length);
        setEl("approvedCount", admins.filter(a => a.status === 'active').length);
        setEl("rejectedCount", admins.filter(a => a.status === 'blocked').length);

        const noData = document.getElementById("noAdminData");
        if (!admins.length) {
            tbody.innerHTML = '';
            if (noData) noData.style.display = 'block';
            return;
        }
        if (noData) noData.style.display = 'none';

        tbody.innerHTML = admins.map(a => `
            <tr>
                <td>${a.id}</td>
                <td>${a.name}</td>
                <td>${a.email}</td>
                <td>${a.phone || 'N/A'}</td>
                <td>${formatDate(a.created_at)}</td>
                <td>
                    <span class="badge ${a.status === 'active' ? 'success' : a.status === 'pending' ? 'pending' : 'reject'}">
                        ${{ active:'Hoạt động', pending:'Chờ duyệt', blocked:'Bị khóa' }[a.status] || a.status}
                    </span>
                </td>
                <td>
                    ${a.status === 'pending' ? `
                        <button class="action-btn btn-approve" onclick="approveAdmin(${a.id})">
                            <i class="fas fa-check"></i> Duyệt
                        </button>
                    ` : ''}
                    ${a.status === 'active' ? `
                        <button class="action-btn btn-reject" onclick="blockAdmin(${a.id})">
                            <i class="fas fa-lock"></i> Khóa
                        </button>
                    ` : ''}
                    <button class="action-btn btn-view" onclick="viewAdminDetail(${a.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="7" style="color:red;text-align:center">❌ Lỗi tải danh sách admin</td></tr>`;
        console.error('❌ [Admins]', e);
    }
}

async function approveAdmin(id) {
    try {
        const data = await fetchJSON(`${API}/admin/admins/${id}/approve`, { method: 'PUT' });
        alert(data.message);
        loadAdmins();
    } catch (e) {
        alert("❌ Lỗi duyệt admin");
    }
}

async function blockAdmin(id) {
    if (!confirm("Khóa tài khoản Admin này?")) return;
    try {
        const data = await fetchJSON(`${API}/admin/admins/${id}/block`, { method: 'PUT' });
        alert(data.message);
        loadAdmins();
    } catch (e) {
        alert("❌ Lỗi khóa admin");
    }
}

function viewAdminDetail(id) {
    // Mở modal chi tiết (admin.html đã có #adminDetailModal)
    const modal = document.getElementById("adminDetailModal");
    if (modal) modal.style.display = "flex";
}

// ============================================================
// 🚨 KHIẾU NẠI (đã render trong admin.html - giữ logic cũ + API)
// ============================================================
async function loadComplaints() {
    try {
        const data = await fetchJSON(`${API}/admin/complaints`);
        // Ghi đè mảng complaints toàn cục để renderComplaints() dùng
        if (Array.isArray(data)) {
            complaints.length = 0;
            data.forEach(c => complaints.push({
                id:          c.id,
                productName: c.product_name || 'N/A',
                productImg:  c.product_img  || FALLBACK_IMG,
                shop:        c.shop_name    || 'N/A',
                user:        c.user_name    || 'N/A',
                reason:      c.reason       || '',
                time:        formatDate(c.created_at),
                status:      c.status
            }));
            renderComplaints();
        }
    } catch (e) {
        console.warn("⚠️ [Complaints] Dùng data tĩnh:", e.message);
        renderComplaints(); // fallback data tĩnh
    }
}

// ============================================================
// 🔄 SIDEBAR NAVIGATION
// ============================================================
function initSidebarNav() {
    const sectionReloaders = {
        'dashboard':     loadDashboard,
        'manage-items':  loadItemsTable,
        'approve-dishes':loadPendingProducts,
        'manage-users':  () => { renderUsersTable(); loadSellers(); },
        'orders':        loadOrders,
        'complaints':    loadComplaints,
        'vouchers':      loadVouchers,
        'manage-admins': loadAdmins
    };

    document.querySelectorAll('.sidebar-nav a').forEach(a => {
        a.addEventListener('click', function (e) {
            e.preventDefault();

            document.querySelectorAll('.sidebar-nav a').forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            document.querySelectorAll('.admin-section').forEach(sec => sec.style.display = 'none');

            const targetId = this.getAttribute('href').substring(1);
            const section  = document.getElementById(targetId);
            if (section) {
                section.style.display = 'block';
                document.getElementById('pageTitle').textContent = this.textContent.trim();
            }

            // Reload data khi chuyển tab
            if (sectionReloaders[targetId]) sectionReloaders[targetId]();
        });
    });
}

// ============================================================
// 🔄 TAB SWITCH (Khách hàng / Người bán)
// ============================================================
function initTabSwitch() {
    document.querySelectorAll('.user-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.user-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            document.querySelectorAll('.user-tab-content').forEach(c => c.style.display = 'none');

            const target = document.getElementById(tab.dataset.tab + 'Tab');
            if (target) target.style.display = 'block';
        });
    });
}

// ============================================================
// 🔧 HELPERS
// ============================================================
function formatCurrency(vnd) {
    if (!vnd) return '0đ';
    if (vnd >= 1_000_000_000) return (vnd / 1_000_000_000).toFixed(1) + ' tỷ';
    if (vnd >= 1_000_000)     return (vnd / 1_000_000).toFixed(1) + ' triệu';
    return vnd.toLocaleString('vi-VN') + 'đ';
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function setEl(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function getAdminId() {
    return parseInt(localStorage.getItem("adminId")) || 1;
}

// ============================================================
// 🗑️  MODAL CLOSE (tất cả modal dùng class .close-modal)
// ============================================================
document.addEventListener("click", (e) => {
    if (e.target.closest(".close-modal")) {
        const modal = e.target.closest(".modal");
        if (modal) modal.style.display = "none";
    }
});

console.log("✅ Admin script loaded");