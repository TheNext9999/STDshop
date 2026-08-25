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

// ============================================================
// SIDEBAR NAVIGATION
// ============================================================
function initNav() {
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.sidebar-nav a').forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            const targetId = this.getAttribute('href').substring(1);
            document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
            const target = document.getElementById(targetId);
            if (target) target.classList.add('active');

            document.getElementById('pageTitle').textContent = this.textContent.trim();
        });
    });
}

// ============================================================
// USER TABS (khách hàng / người bán)
// ============================================================
function initUserTabs() {
    document.querySelectorAll('.user-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.user-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.user-tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const target = document.getElementById(tab.dataset.tab + 'Tab');
            if (target) target.classList.add('active');
        });
    });
}

// ============================================================
// SUPPORT & COMPLAINTS TABS
// ============================================================
function initScTabs() {
    document.querySelectorAll('.sc-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.sc-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.sc-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const target = document.getElementById('sc-' + tab.dataset.sc);
            if (target) target.classList.add('active');
        });
    });
}

// ============================================================
// COMPLAINTS
// ============================================================
const complaints = [
    { id:"KN001", productName:"Áo Hoodie Oversize", productImg:"https://down-vn.img.susercontent.com/file/vn-11134201-7r98o-lpja7tsxdp9xfe", shop:"Shop Thời Trang SV", user:"Nguyễn Văn A", reason:"Hàng không giống mô tả", time:"08/04/2026", status:"pending" },
    { id:"KN002", productName:"Balo Sinh Viên", productImg:"https://sakos.vn/wp-content/uploads/2024/07/balo-chong-nuoc-Sakos-Oceanus-xam-1.png", shop:"Shop Balo Pro", user:"Trần Thị B", reason:"Sản phẩm lỗi", time:"07/04/2026", status:"success" },
    { id:"KN003", productName:"Giày Sneaker Trắng", productImg:"https://shopdonghai.com/cdn/shop/files/giay-sneaker-nu-zuciani-GRC08-den-1_7b71cbc3-ace4-40f1-a77f-d1aec945f302.jpg", shop:"Sneaker Campus", user:"Lê Văn C", reason:"Sai size đã đặt", time:"06/04/2026", status:"pending" }
];

function renderComplaints() {
    const tb = document.getElementById("complaintTable");
    if (!tb) return;
    tb.innerHTML = complaints.map(c => `
        <tr>
            <td><input type="checkbox" value="${c.id}"></td>
            <td>#${c.id}</td>
            <td>
                <div class="complaint-product">
                    <img src="${c.productImg}" onerror="this.src='https://via.placeholder.com/44'">
                    <span>${c.productName}</span>
                </div>
            </td>
            <td>${c.shop}</td>
            <td>${c.user}</td>
            <td>${c.reason}</td>
            <td>${c.time}</td>
            <td><span class="badge ${c.status}">${getComplaintStatusText(c.status)}</span></td>
            <td>
                <button class="action-btn btn-view" onclick="viewComplaint('${c.id}')">Xem</button>
                ${c.status === 'pending' ? `
                    <button class="action-btn btn-approve" onclick="updateStatus('${c.id}','success')">Duyệt</button>
                    <button class="action-btn btn-reject" onclick="updateStatus('${c.id}','reject')">Từ chối</button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

function getComplaintStatusText(s) {
    return { pending:'Chờ xử lý', success:'Đã xử lý', reject:'Từ chối' }[s] || s;
}

function updateStatus(id, newStatus) {
    const item = complaints.find(c => c.id === id);
    if (item) { item.status = newStatus; renderComplaints(); }
}

function viewComplaint(id) {
    document.getElementById("complaintModal").classList.add('open');
}

function closeComplaintModal() {
    document.getElementById("complaintModal").classList.remove('open');
}

// ============================================================
// VOUCHER MODAL
// ============================================================
function initVoucherModal() {
    const addBtn = document.querySelector('.add-voucher-btn');
    if (addBtn) addBtn.addEventListener('click', () => {
        document.getElementById('voucherModal').classList.add('open');
    });
}

// ============================================================
// CLOSE MODALS
// ============================================================
document.addEventListener('click', e => {
    if (e.target.closest('.close-modal')) {
        const modal = e.target.closest('.modal');
        if (modal) modal.classList.remove('open');
    }
    // Click backdrop
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('open');
    }
});

// ============================================================
// AUTH
// ============================================================
function logout() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("currentAdmin");
    window.location.href = "login-admin.html";
}

// ============================================================
// CHARTS
// ============================================================
function initCharts() {
    // Line chart - doanh thu
    const ctx1 = document.getElementById('revenueChart');
    if (ctx1) new Chart(ctx1, {
        type: 'line',
        data: {
            labels: ['T11','T12','T1','T2','T3','T4'],
            datasets: [{ label:'Doanh thu (triệu)', data:[180,220,195,260,240,280],
                borderColor:'#00C9B0', backgroundColor:'rgba(0,201,176,0.08)',
                tension:0.4, fill:true, pointBackgroundColor:'#00C9B0',
                pointRadius:5, borderWidth:3 }]
        },
        options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } },
            scales:{ x:{ grid:{ display:false }, ticks:{ color:'#94a3b8', font:{ size:11 } } },
                     y:{ grid:{ color:'#f1f5f9' }, ticks:{ color:'#94a3b8', font:{ size:11 }, callback:v=>v+'M' } } } }
    });

    // Donut chart - trạng thái đơn
    const ctx2 = document.getElementById('orderStatusChart');
    if (ctx2) new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: ['Hoàn thành','Đang giao','Chờ xử lý','Đã hủy'],
            datasets: [{ data:[58,22,13,7],
                backgroundColor:['#00C9B0','#3b82f6','#f59e0b','#ef4444'],
                borderColor:'#fff', borderWidth:3, hoverOffset:8 }]
        },
        options: { responsive:true, maintainAspectRatio:false, cutout:'68%',
            plugins:{ legend:{ position:'bottom', labels:{ color:'#64748b', font:{ size:11 }, padding:12, usePointStyle:true, pointStyleWidth:8 } } } }
    });

    // Report charts
    const ctx3 = document.getElementById('revenueChartReport');
    if (ctx3) new Chart(ctx3, {
        type: 'line',
        data: { labels:['T1','T2','T3','T4','T5','T6'],
            datasets:[{ label:'Doanh thu', data:[120,190,150,280,220,310],
                borderColor:'#00C9B0', backgroundColor:'rgba(0,201,176,0.08)',
                tension:0.4, fill:true, pointBackgroundColor:'#00C9B0', borderWidth:3 }] },
        options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } } }
    });

    const ctx4 = document.getElementById('orderBarChart');
    if (ctx4) new Chart(ctx4, {
        type: 'bar',
        data: { labels:['Hoàn thành','Đang giao','Chờ xử lý','Đã hủy','Trả hàng'],
            datasets:[{ label:'Đơn', data:[35120,8450,1200,1660,800],
                backgroundColor:['#00C9B0','#3b82f6','#f59e0b','#ef4444','#8b5cf6'],
                borderRadius:8 }] },
        options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } } }
    });
}

// ============================================================
// TOP SHOPS
// ============================================================
function renderTopShops() {
    const tb = document.getElementById('topShopsTable');
    if (!tb) return;
    const shops = [
        { name:'Shop Sinh Viên 247', revenue:88000000, orders:467, rating:4.9 },
        { name:'TechZone Giá Rẻ',    revenue:77000000, orders:460, rating:4.8 },
        { name:'Sneaker Campus',      revenue:54000000, orders:420, rating:4.7 },
        { name:'Phụ Kiện Baseus VN', revenue:40000000, orders:400, rating:4.6 },
        { name:'Jeans Local Brand',   revenue:35000000, orders:380, rating:4.5 }
    ];
    const rank = ['🥇','🥈','🥉','4.','5.'];
    tb.innerHTML = shops.map((s,i) => `
        <tr>
            <td>${rank[i]} <strong>${s.name}</strong></td>
            <td style="color:var(--primary);font-weight:600;">${s.revenue.toLocaleString('vi-VN')}đ</td>
            <td>${s.orders}</td>
            <td>⭐ ${s.rating}</td>
        </tr>
    `).join('');
}

// ============================================================
// ADMIN INFO
// ============================================================
function loadAdminInfo() {
    const name = localStorage.getItem("currentAdmin") || "Admin";
    const adminName = document.getElementById("adminName");
    const adminAvatar = document.getElementById("adminAvatar");
    if (adminName) adminName.textContent = "Xin chào, " + name;
    if (adminAvatar) adminAvatar.textContent = name.charAt(0).toUpperCase();
}

// ============================================================
// CHART PERIOD SWITCH
// ============================================================
document.querySelectorAll('.chart-periods span').forEach(btn => {
    btn.addEventListener('click', function() {
        this.closest('.chart-periods').querySelectorAll('span').forEach(s => s.classList.remove('active'));
        this.classList.add('active');
    });
});

// ============================================================
// INIT ALL
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    loadAdminInfo();
    initNav();
    initUserTabs();
    initScTabs();
    initVoucherModal();
    initCharts();
    renderComplaints();
    renderTopShops();
});

// ================================================================
// ADMIN – Quản lý Thanh lý (listings)
// ================================================================
 
let currentListingStatus = '';
let currentListingPage   = 1;
let listingSearchTimer   = null;
let selectedListingIds   = [];
const ADMIN_ID = JSON.parse(localStorage.getItem('adminInfo') || '{}').id || 1;
 
// ── Khởi động khi chuyển sang tab "manage-listings" ──────────────
document.addEventListener('DOMContentLoaded', () => {
    // Hook vào hệ thống điều hướng sidebar hiện có
    const listingsLink = document.querySelector('a[href="#manage-listings"]');
    if (listingsLink) {
        listingsLink.addEventListener('click', () => {
            initListingsSection();
        });
    }
});
 
function initListingsSection() {
    loadListingsStats();
    loadListings('');
    loadListingReportsBadge();
}
 
// ── Lấy thống kê ────────────────────────────────────────────────
async function loadListingsStats() {
    try {
        const res = await fetch('/api/admin/dashboard/listings-stats');
        const data = await res.json();
        document.getElementById('lstPending').textContent   = (data.pending_listings || 0).toLocaleString();
        document.getElementById('lstApproved').textContent  = (data.approved_listings || 0).toLocaleString();
        document.getElementById('lstSold').textContent      = (data.sold_listings || 0).toLocaleString();
        document.getElementById('lstRejected').textContent  = (data.rejected_listings || 0).toLocaleString();
        document.getElementById('lstRevenue').textContent   = formatVND(data.listing_revenue_total || 0);
 
        // Badge sidebar
        const badge = document.getElementById('sidebarListingBadge');
        if (badge && data.pending_listings > 0) {
            badge.textContent = data.pending_listings;
            badge.style.display = 'inline';
        }
 
        // Tab counts
        document.getElementById('tabCntPending').textContent  = data.pending_listings || 0;
        document.getElementById('tabCntApproved').textContent = data.approved_listings || 0;
        document.getElementById('tabCntSold').textContent     = data.sold_listings || 0;
        document.getElementById('tabCntReports').textContent  = data.pending_reports || 0;
    } catch (e) { console.error(e); }
}
 
// ── Load danh sách listings ──────────────────────────────────────
async function loadListings(status, page = 1) {
    currentListingStatus = status;
    currentListingPage   = page;
 
    // Cập nhật tab active
    document.querySelectorAll('.listing-filter-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.status === status);
    });
 
    // Ẩn/hiện panel
    document.getElementById('listingsTableWrap').style.display  = '';
    document.getElementById('listingsReportsWrap').style.display = 'none';
    document.getElementById('listingsFilterBar').style.display  = '';
 
    const search   = document.getElementById('listingSearch')?.value || '';
    const category = document.getElementById('listingCategoryFilter')?.value || '';
    const params   = new URLSearchParams({ page, limit: 20 });
    if (status)   params.set('status', status);
    if (search)   params.set('search', search);
    if (category) params.set('category', category);
 
    const tbody = document.getElementById('listingsTableBody');
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:40px;">
        <i class="fas fa-spinner fa-spin"></i> Đang tải...</td></tr>`;
 
    try {
        const res  = await fetch('/api/admin/listings?' + params);
        const data = await res.json();
        renderListingsTable(data.listings || []);
        renderListingsPagination(data.total || 0, page);
        document.getElementById('tabCntAll').textContent = data.total || 0;
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#ef4444;padding:32px;">
            ❌ Lỗi tải dữ liệu</td></tr>`;
    }
}
 
function renderListingsTable(listings) {
    const tbody = document.getElementById('listingsTableBody');
    if (!listings.length) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:48px;color:var(--muted);">
            <i class="fas fa-inbox" style="font-size:2rem;margin-bottom:12px;display:block;"></i>
            Không có sản phẩm nào</td></tr>`;
        return;
    }
 
    tbody.innerHTML = listings.map(l => {
        const thumb = l.thumb
            ? `<img src="${escHtml(l.thumb)}" class="listing-thumb" onerror="this.style.display='none'">`
            : `<div class="listing-thumb-placeholder">📦</div>`;
 
        const statusBadge = {
            pending:  '<span class="listing-badge badge-pending">⏳ Chờ duyệt</span>',
            approved: '<span class="listing-badge badge-approved">✅ Đã duyệt</span>',
            sold:     '<span class="listing-badge badge-sold">🤝 Đã bán</span>',
            rejected: '<span class="listing-badge badge-rejected">❌ Từ chối</span>',
            draft:    '<span class="listing-badge badge-draft">📝 Nháp</span>',
        }[l.status] || l.status;
 
        const flashBtn = l.status === 'approved'
            ? `<button title="${l.flash ? 'Tắt Flash' : 'Bật Flash'}" onclick="toggleListingFlash(${l.id})"
                style="background:${l.flash ? '#f59e0b' : '#e2e8f0'};color:${l.flash ? '#fff' : '#64748b'};
                border:none;border-radius:6px;padding:5px 8px;cursor:pointer;">
                <i class="fas fa-bolt"></i></button>`
            : '';
 
        return `
        <tr>
            <td><input type="checkbox" class="listing-cb" value="${l.id}" onchange="onListingCheck()"></td>
            <td>${thumb}</td>
            <td>
                <div style="font-weight:600;font-size:.88rem;max-width:200px;
                            white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"
                     title="${escHtml(l.title)}">${escHtml(l.title)}</div>
                <div style="font-size:.75rem;color:var(--muted);">${escHtml(l.category || '')} · ${l.views || 0} lượt xem</div>
            </td>
            <td>
                <div style="font-weight:600;font-size:.85rem;">${escHtml(l.seller_name || '–')}</div>
                <div style="font-size:.75rem;color:var(--muted);">${escHtml(l.seller_phone || '')}</div>
            </td>
            <td>
                <div style="font-weight:700;color:var(--primary);">${formatVND(l.price)}</div>
                ${l.old_price ? `<div style="font-size:.75rem;text-decoration:line-through;color:var(--muted);">${formatVND(l.old_price)}</div>` : ''}
            </td>
            <td style="font-size:.82rem;">${escHtml(l.condition_label || l.condition_val || '–')}</td>
            <td>${statusBadge}</td>
            <td style="font-size:.8rem;color:var(--muted);">${formatDate(l.created_at)}</td>
            <td>
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    <button title="Xem chi tiết" onclick="openListingDetail(${l.id})"
                        style="background:var(--blue-soft);color:#1e3a8a;border:none;
                               border-radius:6px;padding:5px 8px;cursor:pointer;">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${l.status === 'pending' ? `
                    <button title="Duyệt" onclick="approveListing(${l.id})"
                        style="background:var(--green-soft);color:#14532d;border:none;
                               border-radius:6px;padding:5px 9px;cursor:pointer;">
                        <i class="fas fa-check"></i>
                    </button>
                    <button title="Từ chối" onclick="rejectListing(${l.id}, '${escHtml(l.title)}')"
                        style="background:var(--red-soft);color:#7f1d1d;border:none;
                               border-radius:6px;padding:5px 8px;cursor:pointer;">
                        <i class="fas fa-times"></i>
                    </button>` : ''}
                    ${flashBtn}
                    <button title="Xóa" onclick="deleteListing(${l.id}, '${escHtml(l.title)}')"
                        style="background:#fee2e2;color:#ef4444;border:none;
                               border-radius:6px;padding:5px 8px;cursor:pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');
}
 
function renderListingsPagination(total, page) {
    const totalPages = Math.ceil(total / 20);
    const el = document.getElementById('listingsPagination');
    if (!el || totalPages <= 1) { if (el) el.innerHTML = ''; return; }
 
    el.innerHTML = `
        <button class="page-btn" ${page <= 1 ? 'disabled' : ''} onclick="loadListings('${currentListingStatus}', ${page - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>
        <span>Trang ${page} / ${totalPages} (${total} mục)</span>
        <button class="page-btn" ${page >= totalPages ? 'disabled' : ''} onclick="loadListings('${currentListingStatus}', ${page + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>`;
}
 
// ── Duyệt / Từ chối / Xóa ────────────────────────────────────────
async function approveListing(id) {
    if (!confirm('Duyệt sản phẩm này?')) return;
    try {
        const res = await fetch(`/api/admin/listings/${id}/approve`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_id: ADMIN_ID })
        });
        const data = await res.json();
        showToast(data.message, res.ok ? 'success' : 'error');
        if (res.ok) { loadListings(currentListingStatus, currentListingPage); loadListingsStats(); }
    } catch (e) { showToast('❌ Lỗi kết nối', 'error'); }
}
 
async function rejectListing(id, title) {
    const reason = prompt(`Lý do từ chối sản phẩm:\n"${title}"`, '');
    if (reason === null) return;
    try {
        const res = await fetch(`/api/admin/listings/${id}/reject`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_id: ADMIN_ID, reason })
        });
        const data = await res.json();
        showToast(data.message, res.ok ? 'success' : 'error');
        if (res.ok) { loadListings(currentListingStatus, currentListingPage); loadListingsStats(); }
    } catch (e) { showToast('❌ Lỗi kết nối', 'error'); }
}
 
async function deleteListing(id, title) {
    if (!confirm(`Xóa vĩnh viễn sản phẩm:\n"${title}"?\n\nHành động này không thể hoàn tác!`)) return;
    try {
        const res = await fetch(`/api/admin/listings/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_id: ADMIN_ID })
        });
        const data = await res.json();
        showToast(data.message, res.ok ? 'success' : 'error');
        if (res.ok) { loadListings(currentListingStatus, currentListingPage); loadListingsStats(); }
    } catch (e) { showToast('❌ Lỗi kết nối', 'error'); }
}
 
async function toggleListingFlash(id) {
    try {
        const res = await fetch(`/api/admin/listings/${id}/toggle-flash`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_id: ADMIN_ID })
        });
        const data = await res.json();
        showToast(data.message, 'success');
        loadListings(currentListingStatus, currentListingPage);
    } catch (e) { showToast('❌ Lỗi kết nối', 'error'); }
}
 
// ── Bulk action ──────────────────────────────────────────────────
function onListingCheck() {
    selectedListingIds = [...document.querySelectorAll('.listing-cb:checked')].map(el => Number(el.value));
}
 
function toggleAllListings(masterCb) {
    document.querySelectorAll('.listing-cb').forEach(cb => { cb.checked = masterCb.checked; });
    onListingCheck();
}
 
async function listingsBulkAction(action) {
    if (!selectedListingIds.length) { showToast('⚠️ Chưa chọn sản phẩm nào', 'warning'); return; }
    const label = action === 'approve' ? 'duyệt' : 'từ chối';
    if (!confirm(`${label.charAt(0).toUpperCase() + label.slice(1)} ${selectedListingIds.length} sản phẩm đã chọn?`)) return;
 
    let reason = '';
    if (action === 'reject') { reason = prompt('Lý do từ chối:', '') || ''; }
 
    try {
        const res = await fetch('/api/admin/listings/bulk-action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: selectedListingIds, action, admin_id: ADMIN_ID, reason })
        });
        const data = await res.json();
        showToast(data.message, res.ok ? 'success' : 'error');
        if (res.ok) { selectedListingIds = []; loadListings(currentListingStatus, currentListingPage); loadListingsStats(); }
    } catch (e) { showToast('❌ Lỗi kết nối', 'error'); }
}
 
// ── Chi tiết listing (modal) ─────────────────────────────────────
async function openListingDetail(id) {
    const modal = document.getElementById('listingDetailModal');
    const body  = document.getElementById('listingDetailBody');
    const acts  = document.getElementById('listingDetailActions');
    body.innerHTML = `<div style="text-align:center;padding:40px;">
        <i class="fas fa-spinner fa-spin" style="font-size:2rem;color:var(--primary);"></i></div>`;
    modal.style.display = 'flex';
 
    try {
        const res     = await fetch(`/api/admin/listings/${id}`);
        const listing = await res.json();
 
        const imgs = (listing.images || []).length
            ? `<div class="detail-imgs">${listing.images.map(u =>
                `<img src="${escHtml(u)}" style="width:100%;border-radius:8px;object-fit:cover;height:120px;"
                      onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Crect fill=\'%23f1f5f9\' width=\'100\' height=\'100\'/%3E%3C/svg%3E'">`
              ).join('')}</div>`
            : `<div style="text-align:center;padding:24px;background:#f8fafc;border-radius:8px;margin-bottom:16px;color:var(--muted);">
                <i class="fas fa-image" style="font-size:2rem;"></i><p>Không có ảnh</p></div>`;
 
        body.innerHTML = `
            ${imgs}
            <h3 style="font-size:1.05rem;font-weight:700;margin-bottom:16px;">${escHtml(listing.title)}</h3>
            <div class="detail-row"><span class="detail-label">Người đăng</span>
                <span class="detail-val">${escHtml(listing.seller_name || '–')}</span></div>
            <div class="detail-row"><span class="detail-label">SĐT</span>
                <span class="detail-val">${escHtml(listing.seller_phone || '–')}</span></div>
            <div class="detail-row"><span class="detail-label">Giá bán</span>
                <span class="detail-val" style="color:var(--primary);">${formatVND(listing.price)}</span></div>
            ${listing.old_price ? `<div class="detail-row"><span class="detail-label">Giá gốc</span>
                <span class="detail-val">${formatVND(listing.old_price)} (-${listing.discount}%)</span></div>` : ''}
            <div class="detail-row"><span class="detail-label">Tình trạng</span>
                <span class="detail-val">${escHtml(listing.condition_label || listing.condition_val)}</span></div>
            <div class="detail-row"><span class="detail-label">Danh mục</span>
                <span class="detail-val">${escHtml(listing.category || '–')}</span></div>
            <div class="detail-row"><span class="detail-label">Vị trí</span>
                <span class="detail-val">${escHtml(listing.location || '–')}</span></div>
            <div class="detail-row"><span class="detail-label">Cho ship</span>
                <span class="detail-val">${listing.allow_ship ? '✅ Có' : '❌ Không'}</span></div>
            <div class="detail-row"><span class="detail-label">Lượt xem</span>
                <span class="detail-val">${(listing.views || 0).toLocaleString()}</span></div>
            <div class="detail-row"><span class="detail-label">Trạng thái</span>
                <span class="detail-val">${listing.status}</span></div>
            <div class="detail-row"><span class="detail-label">Ngày đăng</span>
                <span class="detail-val">${formatDate(listing.created_at)}</span></div>
            ${listing.description ? `
            <div style="margin-top:16px;">
                <p style="font-weight:600;margin-bottom:8px;">Mô tả:</p>
                <p style="font-size:.88rem;color:var(--text);line-height:1.6;white-space:pre-wrap;">${escHtml(listing.description)}</p>
            </div>` : ''}
            ${(listing.orders || []).length ? `
            <div style="margin-top:20px;">
                <p style="font-weight:600;margin-bottom:10px;">Đơn hàng liên quan (${listing.orders.length}):</p>
                ${listing.orders.map(o => `
                <div style="background:#f8fafc;border-radius:8px;padding:10px 12px;margin-bottom:8px;font-size:.82rem;">
                    <b>${escHtml(o.order_code)}</b> · ${escHtml(o.buyer_name)} · ${formatVND(o.price)}
                    · <span style="color:${o.status==='completed'?'var(--green)':o.status==='cancelled'?'#ef4444':'var(--yellow)'};">${o.status}</span>
                </div>`).join('')}
            </div>` : ''}`;
 
        // Action buttons
        acts.innerHTML = '';
        if (listing.status === 'pending') {
            acts.innerHTML = `
                <button onclick="approveListing(${id}); closeListingModal();"
                    style="background:var(--primary);color:#fff;border:none;border-radius:8px;
                           padding:10px 22px;font-weight:600;cursor:pointer;">
                    <i class="fas fa-check"></i> Duyệt
                </button>
                <button onclick="rejectListing(${id},'${escHtml(listing.title)}'); closeListingModal();"
                    style="background:#ef4444;color:#fff;border:none;border-radius:8px;
                           padding:10px 22px;font-weight:600;cursor:pointer;">
                    <i class="fas fa-times"></i> Từ chối
                </button>`;
        }
        acts.innerHTML += `
            <button onclick="closeListingModal()"
                style="background:#f1f5f9;color:var(--text);border:none;border-radius:8px;
                       padding:10px 22px;font-weight:600;cursor:pointer;">
                Đóng
            </button>`;
    } catch (e) {
        body.innerHTML = '<p style="text-align:center;color:#ef4444;">❌ Lỗi tải dữ liệu</p>';
    }
}
 
function closeListingModal() {
    document.getElementById('listingDetailModal').style.display = 'none';
}
 
// ── Báo cáo vi phạm ─────────────────────────────────────────────
async function loadListingReportsBadge() {
    try {
        const res  = await fetch('/api/admin/listing-reports?status=pending');
        const data = await res.json();
        document.getElementById('tabCntReports').textContent = data.length || 0;
    } catch (e) {}
}
 
async function loadListingReports() {
    currentListingStatus = 'reports';
    document.querySelectorAll('.listing-filter-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.status === 'reports');
    });
    document.getElementById('listingsTableWrap').style.display  = 'none';
    document.getElementById('listingsReportsWrap').style.display = '';
    document.getElementById('listingsFilterBar').style.display  = 'none';
 
    const tbody = document.getElementById('listingReportsTableBody');
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;">
        <i class="fas fa-spinner fa-spin"></i> Đang tải...</td></tr>`;
 
    try {
        const res  = await fetch('/api/admin/listing-reports?status=pending');
        const data = await res.json();
 
        if (!data.length) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--muted);">
                🎉 Không có báo cáo vi phạm nào chờ xử lý</td></tr>`;
            return;
        }
 
        tbody.innerHTML = data.map(r => `
            <tr>
                <td>#${r.id}</td>
                <td>
                    <div style="font-weight:600;font-size:.85rem;">${escHtml(r.listing_title)}</div>
                    <div style="font-size:.75rem;color:var(--muted);">Người đăng: ${escHtml(r.listing_owner_name)}</div>
                </td>
                <td>
                    <div style="font-weight:600;">${escHtml(r.reporter_name)}</div>
                    <div style="font-size:.75rem;color:var(--muted);">${escHtml(r.reporter_phone || '')}</div>
                </td>
                <td><span style="font-size:.82rem;background:#fee2e2;color:#7f1d1d;border-radius:6px;padding:3px 8px;">${escHtml(r.reason)}</span></td>
                <td style="font-size:.82rem;max-width:180px;">${escHtml(r.detail || '–')}</td>
                <td style="font-size:.8rem;color:var(--muted);">${formatDate(r.created_at)}</td>
                <td>
                    <div style="display:flex;gap:6px;">
                        <button title="Xử lý vi phạm (reject listing)" onclick="resolveListingReport(${r.id},'resolved')"
                            style="background:#ef4444;color:#fff;border:none;border-radius:6px;padding:5px 10px;cursor:pointer;font-size:.8rem;">
                            <i class="fas fa-ban"></i> Xử lý
                        </button>
                        <button title="Bỏ qua báo cáo" onclick="resolveListingReport(${r.id},'dismissed')"
                            style="background:#f1f5f9;color:var(--muted);border:none;border-radius:6px;padding:5px 10px;cursor:pointer;font-size:.8rem;">
                            <i class="fas fa-eye-slash"></i> Bỏ qua
                        </button>
                    </div>
                </td>
            </tr>`).join('');
    } catch (e) { tbody.innerHTML = `<tr><td colspan="7" style="color:#ef4444;text-align:center;padding:24px;">❌ Lỗi tải dữ liệu</td></tr>`; }
}
 
async function resolveListingReport(id, action) {
    const label = action === 'resolved' ? 'xử lý vi phạm (sẽ reject listing)' : 'bỏ qua báo cáo này';
    if (!confirm(`Bạn chắc chắn muốn ${label}?`)) return;
    try {
        const res  = await fetch(`/api/admin/listing-reports/${id}/resolve`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, admin_id: ADMIN_ID })
        });
        const data = await res.json();
        showToast(data.message, res.ok ? 'success' : 'error');
        if (res.ok) { loadListingReports(); loadListingReportsBadge(); loadListingsStats(); }
    } catch (e) { showToast('❌ Lỗi kết nối', 'error'); }
}
 
// ── Debounce search ──────────────────────────────────────────────
function debounceListingSearch() {
    clearTimeout(listingSearchTimer);
    listingSearchTimer = setTimeout(() => loadListings(currentListingStatus), 450);
}
 
// ── Helpers ──────────────────────────────────────────────────────
function formatVND(n) {
    if (!n) return '0₫';
    return Number(n).toLocaleString('vi-VN') + '₫';
}
function formatDate(d) {
    if (!d) return '–';
    return new Date(d).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}
function escHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
 
// Sử dụng hàm showToast có sẵn trong admin.html
// Nếu chưa có, dùng fallback:
if (typeof showToast === 'undefined') {
    window.showToast = (msg, type = 'success') => {
        const el = document.createElement('div');
        el.textContent = msg;
        Object.assign(el.style, {
            position:'fixed', bottom:'24px', right:'24px', zIndex:'99999',
            background: type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#f59e0b',
            color:'#fff', padding:'12px 20px', borderRadius:'10px',
            fontWeight:'600', fontSize:'.9rem', boxShadow:'0 4px 20px rgba(0,0,0,.15)'
        });
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 3200);
    };
}
