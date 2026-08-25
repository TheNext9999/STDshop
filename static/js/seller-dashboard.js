document.querySelectorAll('.sidebar-nav a').forEach(a => {
            a.addEventListener('click', e => {
                e.preventDefault();
                document.querySelectorAll('.sidebar-nav a').forEach(link => link.classList.remove('active'));
                a.classList.add('active');

                document.querySelectorAll('.seller-section').forEach(sec => sec.classList.remove('active'));
                const target = document.querySelector(a.getAttribute('href'));
                if (target) target.classList.add('active');

                document.getElementById('pageTitle').textContent = a.textContent.trim();
            });
        });

let revenueChart;
        let ordersChart;
        let currentChartType = 'line';

        // ===== DỮ LIỆU MẪU FALLBACK (khi API lỗi) =====
        const fallbackData = {
            "7": {
                labels: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
                revenue: [1250000, 980000, 1450000, 1670000, 890000, 2100000, 1780000],
                orders: [8, 6, 12, 15, 5, 18, 14]
            },
            "30": {
                labels: ["01", "05", "10", "15", "20", "25", "30"],
                revenue: [3200000, 4150000, 2890000, 3670000, 4520000, 3980000, 5210000],
                orders: [20, 28, 18, 25, 35, 30, 42]
            },
            "month": {
                labels: ["Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4"],
                revenue: [8750000, 12400000, 9800000, 15600000],
                orders: [55, 78, 62, 90]
            },
            "12": {
                labels: ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"],
                revenue: [32000000, 28500000, 41000000, 38000000, 45000000, 51000000, 47000000, 53000000, 49000000, 62000000, 58000000, 71000000],
                orders: [210, 185, 270, 250, 305, 340, 315, 360, 330, 410, 390, 480]
            }
        };

        // ===== HÀM TẠO BIỂU ĐỒ DOANH THU =====
        function createRevenueChart(period = "month", type = currentChartType) {
            const ctx = document.getElementById('revenueChart');
            if (!ctx) return;
            if (revenueChart) revenueChart.destroy();

            const d = fallbackData[period] || fallbackData["month"];
            const total = d.revenue.reduce((a, b) => a + b, 0);

            // Hiển thị tổng
            const totalEl = document.getElementById('totalRevenueDisplay');
            if (totalEl) totalEl.textContent = total.toLocaleString('vi-VN') + 'đ';

            const isBar = type === 'bar';

            revenueChart = new Chart(ctx, {
                type: type,
                data: {
                    labels: d.labels,
                    datasets: [{
                        label: 'Doanh thu (VND)',
                        data: d.revenue,
                        borderColor: '#00C9B0',
                        backgroundColor: isBar
                            ? 'rgba(0, 201, 176, 0.75)'
                            : 'rgba(0, 201, 176, 0.12)',
                        borderWidth: isBar ? 0 : 3,
                        tension: 0.4,
                        fill: !isBar,
                        pointBackgroundColor: '#00C9B0',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: isBar ? 0 : 5,
                        pointHoverRadius: 8,
                        borderRadius: isBar ? 8 : 0,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            padding: 12,
                            cornerRadius: 10,
                            callbacks: {
                                label: function (ctx) {
                                    return '💰 ' + ctx.raw.toLocaleString('vi-VN') + 'đ';
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0,0,0,0.04)' },
                            ticks: {
                                callback: function (val) {
                                    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'tr';
                                    if (val >= 1000) return (val / 1000) + 'k';
                                    return val;
                                }
                            }
                        },
                        x: { grid: { display: false } }
                    },
                    animation: { duration: 600, easing: 'easeInOutQuart' }
                }
            });
        }

        // ===== HÀM TẠO BIỂU ĐỒ ĐƠN HÀNG =====
        function createOrdersChart(period = "7") {
            const ctx = document.getElementById('ordersBarChart');
            if (!ctx) return;
            if (ordersChart) ordersChart.destroy();

            const d = fallbackData[period] || fallbackData["7"];
            const total = d.orders.reduce((a, b) => a + b, 0);

            const totalEl = document.getElementById('totalOrdersDisplay');
            if (totalEl) totalEl.textContent = total + ' đơn';

            ordersChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: d.labels,
                    datasets: [{
                        label: 'Số đơn hàng',
                        data: d.orders,
                        backgroundColor: function (ctx) {
                            const max = Math.max(...d.orders);
                            const val = ctx.dataset.data[ctx.dataIndex];
                            const alpha = 0.35 + 0.65 * (val / max);
                            return `rgba(0, 201, 176, ${alpha})`;
                        },
                        borderColor: '#00C9B0',
                        borderWidth: 0,
                        borderRadius: 7,
                        borderSkipped: false,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            padding: 10,
                            cornerRadius: 10,
                            callbacks: {
                                label: function (ctx) {
                                    return '📦 ' + ctx.raw + ' đơn hàng';
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0,0,0,0.04)' },
                            ticks: { stepSize: 5 }
                        },
                        x: { grid: { display: false } }
                    },
                    animation: { duration: 500 }
                }
            });
        }

        // ===== TẢI DỮ LIỆU TỪ API (nếu có), FALLBACK về mẫu =====
        async function refreshRevenueChart(period = "month") {
            try {
                const res = await fetch(`http://localhost:3000/api/seller/revenue?period=${period}`);
                if (!res.ok) throw new Error('API error');
                const data = await res.json();

                if (data.labels && data.labels.length > 0) {
                    const total = (data.values || []).reduce((a, b) => a + b, 0);
                    const totalEl = document.getElementById('totalRevenueDisplay');
                    if (totalEl) totalEl.textContent = total.toLocaleString('vi-VN') + 'đ';

                    revenueChart.data.labels = data.labels;
                    revenueChart.data.datasets[0].data = data.values;
                    revenueChart.update();
                }
            } catch (err) {
                // Dùng fallback data – không cần làm gì thêm vì đã tạo chart từ fallback
            }
        }

        // ===== TOGGLE LOẠI BIỂU ĐỒ =====
        document.addEventListener('DOMContentLoaded', () => {
            const period = document.getElementById('timeRange').value;
            createRevenueChart(period, 'line');
            createOrdersChart('7');

            // Chart type buttons
            document.querySelectorAll('.chart-type-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    document.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    currentChartType = this.dataset.type;
                    createRevenueChart(document.getElementById('timeRange').value, currentChartType);
                });
            });

            // Revenue time range
            document.getElementById('timeRange').addEventListener('change', function () {
                createRevenueChart(this.value, currentChartType);
            });

            // Orders time range
            document.getElementById('orderTimeRange').addEventListener('change', function () {
                createOrdersChart(this.value);
            });
        });

const incomeCtx = document.getElementById('incomeChart').getContext('2d');
        new Chart(incomeCtx, {
            type: 'bar',
            data: {
                labels: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',],
                datasets: [{
                    label: 'Thu nhập (triệu VND)',
                    data: [4.2, 5.8, 4.9, 0.9],
                    backgroundColor: 'rgba(0, 201, 176, 0.7)',
                    borderColor: '#00C9B0',
                    borderWidth: 2,
                    borderRadius: 8,
                    barThickness: 40,              // Cột nhỏ hơn (giảm độ dày)
                    categoryPercentage: 0.7,       // Tăng khoảng cách giữa các nhóm cột
                    barPercentage: 0.8             // Cột hẹp hơn trong nhóm
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, position: 'top' },
                    tooltip: { mode: 'index', intersect: false },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Thu nhập (triệu VND)' },
                        ticks: { stepSize: 2 }
                    },
                    x: {
                        title: { display: true, text: 'Tháng' },
                        grid: { display: false }   // Ẩn lưới ngang để sạch sẽ
                    }
                }
            }
        });

// ============================================================
        // DỮ LIỆU MẪU ANALYTICS (fallback khi API chưa có)
        // ============================================================
        const anaFallback = {
            "7": {
                labels: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
                revenue: [1250000, 980000, 1450000, 1670000, 890000, 2100000, 1780000],
                orders: [8, 6, 12, 15, 5, 18, 14],
                kpi: { revenue: "10.1 triệu", orders: 78, rating: "4.8★", aov: "189.000đ" }
            },
            "30": {
                labels: ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12", "T13", "T14", "T15", "T16", "T17", "T18", "T19", "T20", "T21", "T22", "T23", "T24", "T25", "T26", "T27", "T28", "T29", "T30"],
                revenue: [800000, 1200000, 950000, 1400000, 1100000, 2000000, 1700000, 900000, 1300000, 1050000, 1500000, 1200000, 1900000, 1600000, 850000, 1250000, 980000, 1450000, 1670000, 890000, 2100000, 1780000, 1100000, 1400000, 1050000, 1800000, 1550000, 950000, 1300000, 1000000],
                orders: [5, 8, 6, 10, 7, 15, 13, 6, 9, 7, 11, 8, 14, 12, 5, 9, 6, 12, 15, 5, 18, 14, 8, 11, 7, 13, 11, 6, 9, 7],
                kpi: { revenue: "37.5 triệu", orders: 285, rating: "4.8★", aov: "189.000đ" }
            },
            "month": {
                labels: ["Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4"],
                revenue: [8750000, 12400000, 9800000, 15600000],
                orders: [55, 78, 62, 90],
                kpi: { revenue: "46.5 triệu", orders: 285, rating: "4.8★", aov: "189.000đ" }
            },
            "12": {
                labels: ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"],
                revenue: [32000000, 28500000, 41000000, 38000000, 45000000, 51000000, 47000000, 53000000, 49000000, 62000000, 58000000, 71000000],
                orders: [210, 185, 270, 250, 305, 340, 315, 360, 330, 410, 390, 480],
                kpi: { revenue: "575 triệu", orders: 3845, rating: "4.8★", aov: "189.000đ" }
            }
        };

        const topProducts = [
            { name: "Áo Hoodie Oversize Unisex", orders: 320, revenue: "22.4 triệu", pct: 100 },
            { name: "Áo Hoodie Basic Oversize Cotton", orders: 280, revenue: "15.4 triệu", pct: 87 },
            { name: "Áo Hoodie Zip Jacket Unisex", orders: 210, revenue: "11.8 triệu", pct: 65 },
            { name: "Áo Hoodie In Hình Stussy Style", orders: 165, revenue: "9.2 triệu", pct: 52 },
            { name: "Áo Hoodie Vintage Wash", orders: 120, revenue: "6.7 triệu", pct: 38 },
        ];

        const starDistribution = { 5: 68, 4: 18, 3: 8, 2: 4, 1: 2 };

        let anaCurrentPeriod = "month";
        let anaRevOrderChart, anaStatusChart, anaCategoryChart, anaHourlyChart;

        // ============================================================
        // SPARKLINE (mini chart trong KPI card)
        // ============================================================
        function drawSparkline(canvasId, data, color) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;
            new Chart(canvas, {
                type: 'line',
                data: {
                    labels: data.map((_, i) => i),
                    datasets: [{
                        data, borderColor: color, borderWidth: 2, fill: true,
                        backgroundColor: color + '22', tension: 0.4,
                        pointRadius: 0
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: { enabled: false } },
                    scales: { x: { display: false }, y: { display: false } },
                    animation: false
                }
            });
        }

        // ============================================================
        // CẬP NHẬT KPI CARDS
        // ============================================================
        function updateKPICards(period) {
            const d = anaFallback[period] || anaFallback["month"];
            document.getElementById('ana-revenue').textContent = d.kpi.revenue;
            document.getElementById('ana-orders').textContent = d.kpi.orders;
            document.getElementById('ana-rating').textContent = d.kpi.rating;
            document.getElementById('ana-aov').textContent = d.kpi.aov;
        }

        // ============================================================
        // BIỂU ĐỒ KẾT HỢP: DOANH THU (LINE) + ĐƠN HÀNG (BAR)
        // ============================================================
        function buildRevenueOrderChart(period) {
            const ctx = document.getElementById('anaRevenueOrderChart');
            if (!ctx) return;
            if (anaRevOrderChart) anaRevOrderChart.destroy();
            const d = anaFallback[period] || anaFallback["month"];

            anaRevOrderChart = new Chart(ctx, {
                data: {
                    labels: d.labels,
                    datasets: [
                        {
                            type: 'bar',
                            label: 'Đơn hàng',
                            data: d.orders,
                            backgroundColor: 'rgba(0,168,255,0.18)',
                            borderColor: 'rgba(0,168,255,0.6)',
                            borderWidth: 1,
                            borderRadius: 5,
                            yAxisID: 'yOrders',
                            order: 2
                        },
                        {
                            type: 'line',
                            label: 'Doanh thu',
                            data: d.revenue,
                            borderColor: '#00C9B0',
                            backgroundColor: 'rgba(0,201,176,0.08)',
                            borderWidth: 2.5,
                            tension: 0.4,
                            fill: true,
                            pointBackgroundColor: '#00C9B0',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 4,
                            pointHoverRadius: 7,
                            yAxisID: 'yRevenue',
                            order: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: {
                            display: true, position: 'top',
                            labels: { usePointStyle: true, padding: 16, font: { size: 12 } }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.82)',
                            padding: 12, cornerRadius: 10,
                            callbacks: {
                                label: ctx => {
                                    if (ctx.dataset.yAxisID === 'yRevenue')
                                        return '💰 ' + ctx.raw.toLocaleString('vi-VN') + 'đ';
                                    return '📦 ' + ctx.raw + ' đơn';
                                }
                            }
                        }
                    },
                    scales: {
                        yRevenue: {
                            type: 'linear', position: 'left',
                            beginAtZero: true,
                            grid: { color: 'rgba(0,0,0,0.04)' },
                            ticks: {
                                callback: v => v >= 1000000 ? (v / 1000000).toFixed(1) + 'tr' : v >= 1000 ? (v / 1000) + 'k' : v,
                                color: '#00C9B0', font: { size: 11 }
                            }
                        },
                        yOrders: {
                            type: 'linear', position: 'right',
                            beginAtZero: true,
                            grid: { display: false },
                            ticks: { color: '#00a8ff', font: { size: 11 } }
                        },
                        x: { grid: { display: false } }
                    },
                    animation: { duration: 600 }
                }
            });
        }

        // ============================================================
        // BIỂU ĐỒ TRÒN: CƠ CẤU TRẠNG THÁI ĐƠN HÀNG
        // ============================================================
        function buildOrderStatusChart() {
            const ctx = document.getElementById('anaOrderStatusChart');
            if (!ctx) return;
            if (anaStatusChart) anaStatusChart.destroy();

            const labels = ['Hoàn thành', 'Đang giao', 'Chờ xử lý', 'Đã hủy'];
            const data = [185, 45, 35, 20];
            const colors = ['#00C9B0', '#00a8ff', '#ffc107', '#dc3545'];

            anaStatusChart = new Chart(ctx, {
                type: 'doughnut',
                data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 6 }] },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    cutout: '68%',
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: ctx => ` ${ctx.label}: ${ctx.raw} đơn (${Math.round(ctx.raw / 285 * 100)}%)`
                            }
                        }
                    },
                    animation: { duration: 700 }
                }
            });

            // Render legend
            const legendEl = document.getElementById('orderStatusLegend');
            if (legendEl) {
                legendEl.innerHTML = labels.map((l, i) =>
                    `<div class="legend-item">
                    <span class="legend-dot" style="background:${colors[i]}"></span>
                    <span>${l}</span>
                    <span class="legend-val">${data[i]}</span>
                </div>`
                ).join('');
            }
        }

        // ============================================================
        // TOP 5 SẢN PHẨM (progress bars)
        // ============================================================
        function renderTopProducts() {
            const container = document.getElementById('topProductsList');
            if (!container) return;
            const rankClasses = ['rank-1', 'rank-2', 'rank-3', 'rank-other', 'rank-other'];
            container.innerHTML = topProducts.map((p, i) => `
            <div class="top-product-item">
                <span class="top-rank ${rankClasses[i]}">${i + 1}</span>
                <div class="top-product-info">
                    <div class="top-product-name">${p.name}</div>
                    <div class="top-product-bar-wrap">
                        <div class="top-product-bar" style="width:${p.pct}%"></div>
                    </div>
                    <div class="top-product-stat">${p.orders} đơn</div>
                </div>
                <span class="top-product-revenue">${p.revenue}</span>
            </div>
        `).join('');
        }

        // ============================================================
        // BIỂU ĐỒ NGANG: DOANH THU THEO DANH MỤC
        // ============================================================
        function buildCategoryChart() {
            const ctx = document.getElementById('anaCategoryChart');
            if (!ctx) return;
            if (anaCategoryChart) anaCategoryChart.destroy();
            const labels = ['Thời trang nam', 'Thời trang nữ', 'Giày & Dép', 'Phụ kiện', 'Khác'];
            const data = [48, 29, 12, 7, 4];
            const colors = ['#00C9B0', '#00a8ff', '#ffc107', '#f06292', '#bdbdbd'];

            anaCategoryChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: '% doanh thu',
                        data,
                        backgroundColor: colors,
                        borderRadius: 6,
                        borderWidth: 0
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { callbacks: { label: ctx => ` ${ctx.raw}% doanh thu` } }
                    },
                    scales: {
                        x: {
                            beginAtZero: true, max: 60,
                            grid: { color: 'rgba(0,0,0,0.04)' },
                            ticks: { callback: v => v + '%' }
                        },
                        y: { grid: { display: false } }
                    },
                    animation: { duration: 600 }
                }
            });
        }

        // ============================================================
        // BIỂU ĐỒ ĐƯỜNG: ĐƠN HÀNG THEO KHUNG GIỜ
        // ============================================================
        function buildHourlyChart() {
            const ctx = document.getElementById('anaHourlyChart');
            if (!ctx) return;
            if (anaHourlyChart) anaHourlyChart.destroy();

            const hours = ['6h', '7h', '8h', '9h', '10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h', '19h', '20h', '21h', '22h'];
            const data = [2, 5, 12, 18, 22, 30, 45, 28, 20, 25, 30, 38, 52, 48, 35, 22, 10];

            anaHourlyChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: hours,
                    datasets: [{
                        label: 'Số đơn',
                        data,
                        borderColor: '#f39c12',
                        backgroundColor: 'rgba(243,156,18,0.10)',
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.45,
                        pointBackgroundColor: data.map(v => v === Math.max(...data) ? '#f39c12' : 'transparent'),
                        pointBorderColor: data.map(v => v === Math.max(...data) ? '#f39c12' : 'transparent'),
                        pointRadius: data.map(v => v === Math.max(...data) ? 7 : 2),
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.82)',
                            callbacks: { label: ctx => ` ${ctx.raw} đơn hàng` }
                        }
                    },
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } },
                        x: { grid: { display: false } }
                    },
                    animation: { duration: 600 }
                }
            });
        }

        // ============================================================
        // STAR BARS (phân phối đánh giá)
        // ============================================================
        function renderStarBars() {
            const container = document.getElementById('starBarsContainer');
            if (!container) return;
            container.innerHTML = [5, 4, 3, 2, 1].map(star => {
                const pct = starDistribution[star];
                return `<div class="star-bar-row">
                <span class="star-bar-label">${star}</span>
                <div class="star-bar-track"><div class="star-bar-fill" style="width:${pct}%"></div></div>
                <span class="star-bar-count">${pct}%</span>
            </div>`;
            }).join('');
        }

        // ============================================================
        // XUẤT CSV
        // ============================================================
        function exportAnalyticsCSV() {
            const d = anaFallback[anaCurrentPeriod] || anaFallback["month"];
            let csv = 'Kỳ,Doanh thu (VND),Số đơn hàng\n';
            d.labels.forEach((l, i) => {
                csv += `${l},${d.revenue[i]},${d.orders[i]}\n`;
            });
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `bao-cao-${anaCurrentPeriod}-${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`;
            a.click();
        }

        // ============================================================
        // PERIOD TABS – gắn sự kiện
        // ============================================================
        document.addEventListener('DOMContentLoaded', () => {
            // Vẽ tất cả chart
            updateKPICards(anaCurrentPeriod);
            buildRevenueOrderChart(anaCurrentPeriod);
            buildOrderStatusChart();
            renderTopProducts();
            buildCategoryChart();
            buildHourlyChart();
            renderStarBars();

            // Sparklines
            drawSparkline('sparkRevenue', [8.7, 9.2, 8.1, 10.5, 12.4, 11.8, 12.4].map(v => v * 1e6), '#00C9B0');
            drawSparkline('sparkOrders', [55, 62, 48, 72, 85, 78, 90], '#28a745');
            drawSparkline('sparkRating', [4.6, 4.7, 4.8, 4.7, 4.8, 4.9, 4.8], '#f39c12');
            drawSparkline('sparkAOV', [175, 182, 188, 185, 190, 186, 189].map(v => v * 1000), '#00a8ff');

            // Period tab click
            document.querySelectorAll('.period-tab').forEach(btn => {
                btn.addEventListener('click', function () {
                    document.querySelectorAll('.period-tab').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    anaCurrentPeriod = this.dataset.period;
                    updateKPICards(anaCurrentPeriod);
                    buildRevenueOrderChart(anaCurrentPeriod);
                });
            });
        });

// ==================== HIỂN THỊ TÊN NGƯỜI BÁN ====================

        const currentSeller = JSON.parse(localStorage.getItem("currentSeller") || "null");
        const sellerName = document.getElementById("sellerName");

        if (sellerName && currentSeller) {
            const name = currentSeller.shopName || currentSeller.ownerName || "Người bán";
            sellerName.textContent = "Xin chào, " + name;
        }
        function logoutSeller() {
            localStorage.removeItem("currentSeller");
            window.location.href = "login.html";
        }

// ==================== DASHBOARD STATS & AUTO-REFRESH ====================

        // Hàm đếm số animation
        function animateCount(el, target, isPrice = false, suffix = '') {
            const start = 0;
            const duration = 800;
            const startTime = performance.now();

            function step(now) {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = Math.round(start + (target - start) * eased);
                el.textContent = isPrice
                    ? current.toLocaleString('vi-VN') + 'đ'
                    : current + suffix;
                if (progress < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
        }

        async function loadDashboardStats() {
            // Hiện refresh indicator
            const indicator = document.getElementById('refreshIndicator');
            if (indicator) { indicator.classList.add('show'); }

            try {
                const res = await fetch("http://localhost:3000/api/seller/dashboard-stats");
                const data = await res.json();

                const revEl = document.getElementById("revenueToday");
                const ordEl = document.getElementById("ordersToday");
                const penEl = document.getElementById("pendingOrders");
                const ratEl = document.getElementById("averageRating");

                if (revEl) animateCount(revEl, data.revenueToday, true);
                if (ordEl) animateCount(ordEl, data.ordersToday);
                if (penEl) animateCount(penEl, data.pendingOrders);
                if (ratEl) ratEl.textContent = data.ratingAvg + '★';

                // Cập nhật footer
                const pendingFooter = document.getElementById('pendingFooter');
                if (pendingFooter && data.pendingOrders > 0) {
                    pendingFooter.textContent = `⚠️ Có ${data.pendingOrders} đơn cần xử lý ngay`;
                    pendingFooter.style.color = '#e6a800';
                }

                const ratingFooter = document.getElementById('ratingFooter');
                if (ratingFooter && data.totalReviews) {
                    ratingFooter.textContent = `Tổng lượt đánh giá: ${data.totalReviews}`;
                }

            } catch (err) {
                console.error("Dashboard stats error:", err);
                // Hiển thị dữ liệu mẫu khi API lỗi
                const samples = { revenueToday: 2850000, ordersToday: 45, pendingOrders: 8, ratingAvg: 4.8 };
                const revEl = document.getElementById("revenueToday");
                const ordEl = document.getElementById("ordersToday");
                const penEl = document.getElementById("pendingOrders");
                const ratEl = document.getElementById("averageRating");
                if (revEl) animateCount(revEl, samples.revenueToday, true);
                if (ordEl) animateCount(ordEl, samples.ordersToday);
                if (penEl) animateCount(penEl, samples.pendingOrders);
                if (ratEl) ratEl.textContent = samples.ratingAvg + '★';
            } finally {
                if (indicator) {
                    setTimeout(() => indicator.classList.remove('show'), 800);
                }
            }
        }

        document.addEventListener("DOMContentLoaded", loadDashboardStats);


        // ==================== BIỂU ĐỒ DOANH THU & ĐƠN HÀNG & AUTO-REFRESH ====================
        async function refreshRevenueChart(period = "month") {
            try {
                const res = await fetch(
                    `http://localhost:3000/api/seller/revenue?period=${period}`
                );

                const data = await res.json();

                revenueChart.data.labels = data.labels;
                revenueChart.data.datasets[0].data = data.values;
                revenueChart.update();

            } catch (err) {
                console.error("Chart error:", err);
            }
        }

        // ==================== ĐƠN HÀNG GẦN ĐÂY & AUTO-REFRESH ====================
        async function loadRecentOrders() {
            try {
                const res = await fetch("http://localhost:3000/api/seller/recent-orders");
                const orders = await res.json();

                const tbody = document.querySelector(".recent-orders table tbody");
                tbody.innerHTML = "";

                orders.forEach(o => {
                    tbody.innerHTML += `
                <tr>
                    <td>#${o.id}</td>
                    <td>${o.customerName}</td>
                    <td>${o.total.toLocaleString()}đ</td>
                    <td>
                        <span class="status ${o.status}">
                            ${o.statusText}
                        </span>
                    </td>
                    <td>${o.time}</td>
                </tr>
            `;
                });

            } catch (err) {
                console.error(err);
            }
        }

        document.addEventListener("DOMContentLoaded", loadRecentOrders);



        // ================= KIỂM TRA ĐƠN HÀNG MỚI & HIỂN THỊ BADGE =================
        async function checkNewOrders() {
            const res = await fetch("http://localhost:3000/api/seller/new-orders-count");
            const data = await res.json();

            const badge = document.querySelector(".chat-badge");

            if (data.count > 0) {
                badge.style.display = "flex";
                badge.innerText = data.count;
            } else {
                badge.style.display = "none";
            }
        }

        // mỗi 10s check
        setInterval(checkNewOrders, 10000);

        function autoRefreshDashboard() {
            loadDashboardStats();
            loadRecentOrders();
            const period = document.getElementById('timeRange') ? document.getElementById('timeRange').value : 'month';
            refreshRevenueChart(period);
            checkNewOrders();
        }

        setInterval(autoRefreshDashboard, 30000);

(function () {
            // ── CONFIG ──────────────────────────────────────────────────────
            const BASE = 'http://localhost:3000/api/seller';
            const SELLER = (() => {
                try {
                    const s = JSON.parse(localStorage.getItem('currentSeller'));
                    return s?.shopname || s?.shopName || '';
                } catch { return ''; }
            })();
            function sp(u) { return u + (u.includes('?') ? '&' : '?') + 'seller=' + encodeURIComponent(SELLER); }

            async function get(url, fallback) {
                try {
                    const r = await fetch(sp(url));
                    if (!r.ok) throw 0;
                    return await r.json();
                } catch { return fallback; }
            }

            function fmt(v) {
                v = Number(v) || 0;
                if (v >= 1e9) return (v / 1e9).toFixed(1) + ' tỷ';
                if (v >= 1e6) return (v / 1e6).toFixed(1) + ' triệu';
                if (v >= 1e3) return Math.round(v / 1e3) + 'k';
                return v.toLocaleString('vi-VN') + 'đ';
            }

            function countUp(el, target, isPrice) {
                if (!el) return;
                const dur = 800, t0 = performance.now();
                function step(now) {
                    const p = Math.min((now - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3), v = Math.round(target * e);
                    el.textContent = isPrice ? v.toLocaleString('vi-VN') + 'đ' : v;
                    if (p < 1) requestAnimationFrame(step);
                }
                requestAnimationFrame(step);
            }

            const STATUS_MAP = {
                pending: 'Chờ xử lý', processing: 'Đang chuẩn bị',
                shipping: 'Đang giao', completed: 'Hoàn thành', cancelled: 'Đã hủy'
            };
            const STATUS_CLS = {
                pending: 'pending', processing: 'processing',
                shipping: 'processing', completed: 'completed', cancelled: 'cancelled'
            };

            // ── 1. HIỂN THỊ TÊN SELLER ──────────────────────────────────────
            if (SELLER) {
                const el = document.getElementById('sellerName');
                if (el) el.textContent = 'Xin chào, ' + SELLER;
            }
            window.logoutSeller = function () {
                localStorage.removeItem('currentSeller');
                window.location.href = 'login.html';
            };

            // ── 2. DASHBOARD STATS ──────────────────────────────────────────
            async function loadDashboardStats() {
                const ind = document.getElementById('refreshIndicator');
                if (ind) ind.classList.add('show');

                const d = await get(BASE + '/dashboard-stats', {
                    revenueToday: 0, ordersToday: 0, pendingOrders: 0,
                    ratingAvg: 0, totalReviews: 0, revenueChangePct: null, ordersChangePct: null
                });

                countUp(document.getElementById('revenueToday'), d.revenueToday || 0, true);
                countUp(document.getElementById('ordersToday'), d.ordersToday || 0, false);
                countUp(document.getElementById('pendingOrders'), d.pendingOrders || 0, false);
                const ratEl = document.getElementById('averageRating');
                if (ratEl) ratEl.textContent = (d.ratingAvg || 0) + '★';

                // Trend badges
                const setTrend = (id, pct) => {
                    const el = document.getElementById(id); if (!el || pct === null) return;
                    el.className = 'stat-trend ' + (pct >= 0 ? 'up' : 'down');
                    el.innerHTML = `<i class="fas fa-arrow-${pct >= 0 ? 'up' : 'down'}"></i> ${pct >= 0 ? '+' : ''}${pct}%`;
                };
                setTrend('revenueTrend', d.revenueChangePct);
                setTrend('ordersTrend', d.ordersChangePct);

                const pf = document.getElementById('pendingFooter');
                if (pf) pf.textContent = d.pendingOrders > 0 ? `⚠️ Có ${d.pendingOrders} đơn cần xử lý` : 'Không có đơn chờ';
                const rf = document.getElementById('ratingFooter');
                if (rf) rf.textContent = `Tổng lượt đánh giá: ${d.totalReviews || 0}`;

                if (ind) setTimeout(() => ind.classList.remove('show'), 800);
            }

            // ── 3. BIỂU ĐỒ DOANH THU (Dashboard) – ghi đè hàm cũ ──────────
            async function loadRevenueChartReal(period, type) {
                const d = await get(BASE + '/revenue?period=' + period, null);
                if (!d || !d.labels) return; // giữ fallback cũ

                const labels = d.labels;
                const revenue = d.revenue || d.values || [];
                const total = revenue.reduce((a, b) => a + b, 0);

                const totalEl = document.getElementById('totalRevenueDisplay');
                if (totalEl) totalEl.textContent = fmt(total);

                // Nếu chart đã tạo từ code cũ thì update luôn
                if (window.revenueChart) {
                    window.revenueChart.data.labels = labels;
                    window.revenueChart.data.datasets[0].data = revenue;
                    window.revenueChart.update();
                }
            }

            // ── 4. BIỂU ĐỒ ĐƠN HÀNG (Dashboard) – update sau khi chart cũ tạo
            async function loadOrdersChartReal(period) {
                const d = await get(BASE + '/revenue?period=' + period, null);
                if (!d) return;
                const orders = d.orderCounts || [];
                const total = orders.reduce((a, b) => a + b, 0);
                const el = document.getElementById('totalOrdersDisplay');
                if (el) el.textContent = total + ' đơn';
                if (window.ordersChart) {
                    window.ordersChart.data.labels = d.labels || [];
                    window.ordersChart.data.datasets[0].data = orders;
                    window.ordersChart.update();
                }
            }

            // ── 5. ĐƠN HÀNG GẦN ĐÂY ────────────────────────────────────────
            async function loadRecentOrders() {
                const orders = await get(BASE + '/recent-orders', []);
                const tbody = document.querySelector('.recent-orders table tbody');
                if (!tbody || !orders.length) return;
                tbody.innerHTML = orders.map(o => `
            <tr>
                <td>${o.orderCode || '#' + o.id}</td>
                <td>${o.customerName || 'Ẩn'}</td>
                <td>${Number(o.total).toLocaleString('vi-VN')}đ</td>
                <td><span class="status ${STATUS_CLS[o.status] || ''}">${STATUS_MAP[o.status] || o.status}</span></td>
                <td>${o.time}</td>
            </tr>`).join('');
            }

            // ── 6. TOP SẢN PHẨM BÁN CHẠY TUẦN (Dashboard) ──────────────────
            async function loadTopWeek() {
                const data = await get(BASE + '/top-products-week', []);
                const container = document.querySelector('.top-list');
                if (!container || !data.length) return;
                container.innerHTML = data.map((p, i) => `
            <div class="top-item">
                <span class="rank" style="color:white;">${i + 1}</span>
                <div class="top-info">
                    <p class="name">${p.name}</p>
                    <p class="stat">${p.totalQty || 0} đơn • ${fmt(p.totalRevenue)}</p>
                </div>
            </div>`).join('');
            }

            // ── 7. BADGE ĐƠN MỚI ────────────────────────────────────────────
            async function checkBadge() {
                const d = await get(BASE + '/new-orders-count', { count: 0 });
                const badge = document.querySelector('.chat-badge');
                if (!badge) return;
                if ((d.count || 0) > 0) { badge.style.display = 'flex'; badge.innerText = d.count; }
                else badge.style.display = 'none';
            }

            // ── 8. QUẢN LÝ SẢN PHẨM ────────────────────────────────────────
            let _productPage = 1;
            async function loadProducts(page) {
                _productPage = page || 1;
                const search = document.getElementById('productSearch')?.value || '';
                const d = await get(`${BASE}/products?page=${_productPage}&search=${encodeURIComponent(search)}`,
                    { products: [], total: 0, pages: 1, page: 1 });
                const tbody = document.querySelector('#menu-management .menu-table tbody');
                if (!tbody) return;
                if (!d.products.length) {
                    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:#aaa">Chưa có sản phẩm</td></tr>';
                    return;
                }
                tbody.innerHTML = d.products.map(p => {
                    const stock = p.stock || 0;
                    const cls = stock > 5 ? 'active' : stock > 0 ? 'pending' : 'cancelled';
                    const lbl = stock > 5 ? 'Đang bán' : stock > 0 ? 'Sắp hết' : 'Hết hàng';
                    return `<tr style="cursor:pointer">
                <td><img src="${p.img || 'https://via.placeholder.com/60'}"
                    class="menu-thumb" style="width:60px;height:60px;object-fit:cover;border-radius:8px;"></td>
                <td>${p.name}</td>
                <td>${Number(p.price).toLocaleString('vi-VN')}đ</td>
                <td>${p.category || '—'}</td>
                <td><span class="status ${cls}">${lbl}</span></td>
                <td>
                    <a href="/html/edit-product.html?id=${p.id}">
                        <button class="btn-edit"><i class="fas fa-edit"></i> Sửa</button>
                    </a>
                    <button class="btn-disable" onclick="toggleProduct(${p.id},this)">
                        <i class="fas fa-power-off"></i> Gỡ
                    </button>
                </td>
            </tr>`;
                }).join('');
                // Phân trang
                const pgSpan = document.querySelector('#menu-management .pagination span');
                if (pgSpan) pgSpan.textContent = `Trang ${d.page} / ${d.pages || 1}`;
                const [prevBtn, nextBtn] = document.querySelectorAll('#menu-management .page-btn');
                if (prevBtn) prevBtn.onclick = () => { if (_productPage > 1) loadProducts(_productPage - 1); };
                if (nextBtn) nextBtn.onclick = () => { if (_productPage < (d.pages || 1)) loadProducts(_productPage + 1); };
            }

            window.toggleProduct = async function (id, btn) {
                if (!confirm('Xác nhận gỡ sản phẩm này?')) return;
                // Không có API gỡ → chỉ thông báo (có thể mở rộng sau)
                btn.closest('tr').style.opacity = '0.4';
                alert('Chức năng tạm thời chưa khả dụng');
            };

            // ── 9. TỒN KHO ──────────────────────────────────────────────────
            async function loadInventory() {
                const [stats, prods] = await Promise.all([
                    get(BASE + '/inventory', { totalProducts: 0, lowStock: 0, outOfStock: 0 }),
                    get(BASE + '/products?limit=100', { products: [] })
                ]);
                // Stats cards
                const cards = document.querySelectorAll('#inventory .stats-grid .stat-card');
                if (cards[0]) cards[0].querySelector('h3').textContent = stats.totalProducts || 0;
                if (cards[1]) cards[1].querySelector('h3').textContent = stats.lowStock || 0;
                if (cards[2]) cards[2].querySelector('h3').textContent = stats.outOfStock || 0;

                // Bảng tồn kho
                const tbody = document.querySelector('#inventory .admin-table tbody');
                if (!tbody || !prods.products.length) return;
                tbody.innerHTML = prods.products.map(p => {
                    const s = p.stock || 0;
                    const cls = s > 5 ? 'active' : s > 0 ? 'pending' : 'cancelled';
                    const lbl = s > 5 ? 'Còn hàng' : s > 0 ? 'Sắp hết' : 'Hết hàng';
                    const col = s === 0 ? '#dc3545' : s <= 5 ? '#e6a800' : '#222';
                    return `<tr>
                <td><img src="${p.img || 'https://via.placeholder.com/60'}"
                    style="width:60px;border-radius:8px;object-fit:cover;"></td>
                <td>${p.name}</td>
                <td><strong style="color:${col}">${s}</strong></td>
                <td id="sold_${p.id}">—</td>
                <td><span class="status ${cls}">${lbl}</span></td>
                <td>
                    <input type="number" value="${s}" min="0" id="stock_${p.id}"
                           style="width:70px;padding:5px;border:1px solid #ddd;border-radius:6px;">
                    <button class="btn-primary" style="padding:6px 10px;"
                            onclick="saveStock(${p.id})">Lưu</button>
                </td>
            </tr>`;
                }).join('');
            }

            window.saveStock = async function (id) {
                const input = document.getElementById('stock_' + id);
                const stock = parseInt(input?.value);
                if (isNaN(stock) || stock < 0) return alert('Số lượng không hợp lệ');
                try {
                    const r = await fetch(BASE + '/products/' + id + '/stock', {
                        method: 'PUT', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ stock })
                    });
                    const d = await r.json();
                    alert(d.message || 'Đã cập nhật');
                    loadInventory();
                } catch { alert('Lỗi kết nối server'); }
            };

            // ── 10. QUẢN LÝ ĐƠN HÀNG ───────────────────────────────────────
            let _orderPage = 1, _orderStatus = '', _orderSearch = '';

            async function loadOrders(page, status, search) {
                _orderPage = page || _orderPage;
                _orderStatus = status !== undefined ? status : _orderStatus;
                _orderSearch = search !== undefined ? search : _orderSearch;

                const d = await get(
                    `${BASE}/orders?page=${_orderPage}&status=${_orderStatus}&search=${encodeURIComponent(_orderSearch)}`,
                    { orders: [], total: 0, pages: 1, page: 1, statusCounts: {} }
                );

                // Cập nhật stat cards đơn hàng
                const sc = d.statusCounts || {};
                const statCards = document.querySelectorAll('#order-processing .order-stats-grid .stat-card');
                if (statCards[0]) statCards[0].querySelector('h3').textContent = sc.pending || 0;
                if (statCards[1]) statCards[1].querySelector('h3').textContent = sc.processing || 0;
                if (statCards[2]) statCards[2].querySelector('h3').textContent = sc.shipping || 0;
                if (statCards[3]) statCards[3].querySelector('h3').textContent = sc.completed || 0;
                if (statCards[4]) statCards[4].querySelector('h3').textContent = sc.cancelled || 0;

                // Bảng
                const tbody = document.querySelector('#order-processing .order-table tbody');
                if (!tbody) return;
                if (!d.orders.length) {
                    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:30px;color:#aaa">Không có đơn hàng nào</td></tr>';
                } else {
                    tbody.innerHTML = d.orders.map(o => `
                <tr>
                    <td><input type="checkbox"></td>
                    <td>${o.order_code || '#' + o.id}</td>
                    <td>${o.customer_name || 'Ẩn'}</td>
                    <td>${o.customer_phone || '—'}</td>
                    <td>${Number(o.total_price).toLocaleString('vi-VN')}đ</td>
                    <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${o.productNames || '—'}</td>
                    <td><span class="status ${STATUS_CLS[o.status] || ''}">${STATUS_MAP[o.status] || o.status}</span></td>
                    <td>${o.time}</td>
                    <td class="action-buttons">
                        <button class="btn-cancel" onclick="cancelOrder(${o.id})"><i class="fas fa-times"></i> Hủy</button>
                        <button class="btn-detail" onclick="viewOrder(${o.id})"><i class="fas fa-eye"></i> Chi tiết</button>
                        <button class="btn-contact" onclick="window.location.href='tel:${o.customer_phone}'">
                            <i class="fas fa-phone"></i> Liên hệ</button>
                    </td>
                </tr>`).join('');
                }

                // Phân trang
                const pgSpan = document.querySelector('#order-processing .pagination span');
                if (pgSpan) pgSpan.textContent = `Trang ${d.page} / ${d.pages || 1}`;
                const [prev, next] = document.querySelectorAll('#order-processing .page-btn');
                if (prev) prev.onclick = () => { if (_orderPage > 1) loadOrders(_orderPage - 1); };
                if (next) next.onclick = () => { if (_orderPage < (d.pages || 1)) loadOrders(_orderPage + 1); };
            }

            window.viewOrder = async function (id) {
                const d = await get(BASE + '/orders/' + id + '/detail', null);
                if (!d) return alert('Không tải được chi tiết đơn');
                const o = d.order, items = d.items || [];
                const info = [
                    `Đơn: ${o.order_code || '#' + o.id}`,
                    `Khách: ${o.customer_name} — ${o.customer_phone}`,
                    `Địa chỉ: ${o.shipping_address}`,
                    `Sản phẩm:
`+ items.map(i => `  • ${i.name} x${i.quantity} = ${Number(i.price * i.quantity).toLocaleString('vi-VN')}đ`).join(''),
                    `Tổng: ${Number(o.total_price).toLocaleString('vi-VN')}đ`,
                    `Trạng thái: ${STATUS_MAP[o.status] || o.status}`,
                    `Thanh toán: ${o.payment_method} — ${o.payment_status}`
                ].join('');
                alert(info);
            };

            window.cancelOrder = async function (id) {
                if (!confirm('Xác nhận hủy đơn #' + id + '?')) return;
                try {
                    const r = await fetch(BASE + '/orders/' + id + '/status', {
                        method: 'PUT', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'cancelled' })
                    });
                    const d = await r.json();
                    alert(d.message || 'Đã hủy đơn');
                    loadOrders(_orderPage);
                } catch { alert('Lỗi kết nối'); }
            };

            // Bộ lọc & tìm kiếm đơn hàng
            function bindOrderFilters() {
                const filterSelect = document.querySelector('#order-processing .filter-toolbar select');
                const searchInput = document.querySelector('#order-processing .filter-toolbar input');
                const filterBtn = document.querySelector('#order-processing .filter-toolbar .btn-primary');
                const resetBtn = document.querySelector('#order-processing .filter-toolbar .btn-secondary');
                const statusValMap = {
                    'Tất cả trạng thái': '', 'Đơn mới': 'pending', 'Đang chuẩn bị': 'processing',
                    'Đang giao': 'shipping', 'Hoàn thành': 'completed', 'Hủy': 'cancelled'
                };
                if (filterBtn) filterBtn.addEventListener('click', () => {
                    const status = statusValMap[filterSelect?.value || ''] ?? '';
                    const search = searchInput?.value || '';
                    loadOrders(1, status, search);
                });
                if (resetBtn) resetBtn.addEventListener('click', () => {
                    if (filterSelect) filterSelect.selectedIndex = 0;
                    if (searchInput) searchInput.value = '';
                    loadOrders(1, '', '');
                });
            }

            // ── 11. TÀI CHÍNH ───────────────────────────────────────────────
            async function loadFinance() {
                const year = new Date().getFullYear();
                const [fin, txn] = await Promise.all([
                    get(BASE + '/finance?year=' + year, { monthly: [], thisMonth: { thisMonthRevenue: 0 } }),
                    get(BASE + '/transactions?page=1', { transactions: [], total: 0, pages: 1 })
                ]);

                // Stat cards tài chính
                const cards = document.querySelectorAll('#finance .wallet-overview .stats-grid .stat-card');
                if (cards[0]) cards[0].querySelector('h3').textContent = fmt(fin.thisMonth?.thisMonthRevenue || 0);

                // Cập nhật số dư ví (tổng hoàn thành - phí 10%)
                const walletBalance = Math.round((fin.thisMonth?.thisMonthRevenue || 0) * 0.9);
                const wb = document.querySelector('.wallet-balance');
                if (wb) wb.textContent = walletBalance.toLocaleString('vi-VN') + 'đ';
                const avail = document.querySelector('.wallet-info .info-item:first-child .value');
                if (avail) avail.textContent = Math.round(walletBalance * 0.985).toLocaleString('vi-VN') + 'đ';

                // Cập nhật biểu đồ thu nhập hiện có (incomeChart)
                const monthly = fin.monthly || [];
                if (window.incomeChart && monthly.length) {
                    // Lấy 4 tháng gần nhất hiển thị
                    const recent4 = monthly.filter(m => m.revenue > 0).slice(-4);
                    if (recent4.length) {
                        window.incomeChart.data.labels = recent4.map(m => m.label);
                        window.incomeChart.data.datasets[0].data = recent4.map(m => m.revenue / 1e6);
                        window.incomeChart.update();
                    }
                }

                // Bảng lịch sử giao dịch
                const tbody = document.querySelector('#finance .transaction-history .admin-table tbody');
                if (!tbody || !txn.transactions.length) return;
                tbody.innerHTML = txn.transactions.map(t => `
            <tr>
                <td>${t.date}</td>
                <td><span class="trans-type income">Thu</span></td>
                <td class="amount positive">+${Number(t.amount).toLocaleString('vi-VN')}đ</td>
                <td>${t.note}</td>
                <td><span class="status success">Hoàn tất</span></td>
            </tr>`).join('');

                const pgSpan = document.querySelector('#finance .transaction-history .pagination span');
                if (pgSpan) pgSpan.textContent = `Trang 1 / ${txn.pages || 1}`;
            }

            // ── 12. CẤU HÌNH GIAN HÀNG ─────────────────────────────────────
            async function loadStoreProfile() {
                if (!SELLER) return;
                const d = await get(BASE + '/profile', null);
                if (!d) return;
                // Map dữ liệu vào các input có sẵn bằng label text
                const form = document.querySelector('#store-profile .profile-form');
                if (!form) return;
                const labelMap = {
                    'Tên gian hàng': d.shopname, 'Tên chủ': d.fullname,
                    'Số điện thoại': d.phone, 'Email': d.email, 'Địa chỉ': d.address
                };
                form.querySelectorAll('.form-group').forEach(fg => {
                    const label = fg.querySelector('label')?.textContent || '';
                    const input = fg.querySelector('input,textarea');
                    if (!input) return;
                    Object.entries(labelMap).forEach(([k, v]) => {
                        if (label.includes(k) && v) { input.value = v; input.dataset.sellerId = d.id; }
                    });
                });
                // Gắn sự kiện lưu
                document.querySelectorAll('.save-all-btn').forEach(btn => {
                    btn.onclick = async () => {
                        const inputs = form.querySelectorAll('input[data-seller-id]');
                        const id = inputs[0]?.dataset.sellerId;
                        if (!id) return;
                        const payload = {};
                        form.querySelectorAll('.form-group').forEach(fg => {
                            const label = fg.querySelector('label')?.textContent || '';
                            const inp = fg.querySelector('input,textarea');
                            if (!inp) return;
                            if (label.includes('Tên gian hàng')) payload.shopname = inp.value;
                            if (label.includes('Tên chủ')) payload.fullname = inp.value;
                            if (label.includes('Số điện thoại')) payload.phone = inp.value;
                            if (label.includes('Email')) payload.email = inp.value;
                            if (label.includes('Địa chỉ')) payload.address = inp.value;
                            if (label.includes('Mô tả')) payload.description = inp.value;
                        });
                        try {
                            const r = await fetch(BASE + '/profile/' + id, {
                                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(payload)
                            });
                            const res = await r.json();
                            const alertEl = document.querySelector('#store-profile .alert-success');
                            if (alertEl) { alertEl.style.display = 'block'; setTimeout(() => alertEl.style.display = 'none', 3000); }
                            else alert(res.message || 'Đã lưu');
                        } catch { alert('Lỗi kết nối'); }
                    };
                });
            }

            // ── 13. ANALYTICS – ghi đè hàm tĩnh cũ ─────────────────────────
            const ANA_COLORS = ['#00C9B0', '#00a8ff', '#ffc107', '#dc3545', '#7c3aed', '#ff7043', '#4caf50', '#e91e63'];
            const SC = { completed: '#00C9B0', shipping: '#00a8ff', processing: '#7c3aed', pending: '#ffc107', cancelled: '#dc3545' };

            function sparkline(id, data, color) {
                const c = document.getElementById(id); if (!c) return;
                new Chart(c, {
                    type: 'line', data: {
                        labels: data.map((_, i) => i),
                        datasets: [{
                            data, borderColor: color, borderWidth: 2, fill: true,
                            backgroundColor: color + '22', tension: 0.4, pointRadius: 0
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { display: false }, tooltip: { enabled: false } },
                        scales: { x: { display: false }, y: { display: false } }, animation: false
                    }
                });
            }

            async function loadAnaKPI(period) {
                const d = await get(`${BASE}/analytics/kpi?period=${period}`,
                    {
                        revenue: { value: 0, changePct: null }, orders: { value: 0, changePct: null },
                        rating: { value: 0, totalReviews: 0 }, aov: { value: 0, changePct: null }
                    });
                const setKPI = (id, val, pct, isP) => {
                    const el = document.getElementById(id); if (el) el.textContent = isP ? fmt(val) : val;
                    const badge = el?.closest('.kpi-card')?.querySelector('.kpi-badge');
                    if (badge && pct !== null) {
                        badge.innerHTML = `<i class="fas fa-arrow-${pct >= 0 ? 'up' : 'down'}"></i> ${pct >= 0 ? '+' : ''}${pct}%`;
                        badge.className = 'kpi-badge ' + (pct >= 0 ? 'up' : 'down');
                    }
                };
                setKPI('ana-revenue', d.revenue.value, d.revenue.changePct, true);
                setKPI('ana-orders', d.orders.value, d.orders.changePct, false);
                const re = document.getElementById('ana-rating'); if (re) re.textContent = (d.rating.value || 0) + '★';
                setKPI('ana-aov', d.aov.value, d.aov.changePct, true);
                const rv = d.revenue.value || 1, od = d.orders.value || 1;
                sparkline('sparkRevenue', [0.7, 0.9, 0.8, 1, 1.1, 0.95, 1].map(f => Math.round(rv * f)), '#00C9B0');
                sparkline('sparkOrders', [0.7, 0.8, 0.75, 0.9, 1, 0.85, 1].map(f => Math.round(od * f)), '#28a745');
                sparkline('sparkRating', [4.5, 4.6, 4.7, 4.6, 4.8, 4.7, d.rating.value || 4.8], '#f39c12');
                sparkline('sparkAOV', [0.9, 0.95, 0.88, 1, 1.02, 0.98, 1].map(f => Math.round((d.aov.value || 1) * f)), '#00a8ff');
            }

            async function loadAnaRevOrder(period) {
                const d = await get(BASE + '/revenue?period=' + period, null);
                if (!d) return;
                if (window.anaRevOrderChart) window.anaRevOrderChart.destroy();
                const ctx = document.getElementById('anaRevenueOrderChart'); if (!ctx) return;
                window.anaRevOrderChart = new Chart(ctx, {
                    data: {
                        labels: d.labels || [], datasets: [
                            {
                                type: 'bar', label: 'Đơn hàng', data: d.orderCounts || [],
                                backgroundColor: 'rgba(0,168,255,0.18)', borderColor: 'rgba(0,168,255,0.6)',
                                borderWidth: 1, borderRadius: 5, yAxisID: 'yOrders', order: 2
                            },
                            {
                                type: 'line', label: 'Doanh thu', data: d.revenue || [],
                                borderColor: '#00C9B0', backgroundColor: 'rgba(0,201,176,0.08)', borderWidth: 2.5,
                                tension: 0.4, fill: true, pointBackgroundColor: '#00C9B0', pointBorderColor: '#fff',
                                pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 7, yAxisID: 'yRevenue', order: 1
                            }
                        ]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
                        plugins: {
                            legend: { display: true, position: 'top', labels: { usePointStyle: true, padding: 16, font: { size: 12 } } },
                            tooltip: {
                                backgroundColor: 'rgba(0,0,0,0.82)', padding: 12, cornerRadius: 10,
                                callbacks: {
                                    label: c => c.dataset.yAxisID === 'yRevenue' ?
                                        '💰 ' + Number(c.raw).toLocaleString('vi-VN') + 'đ' : '📦 ' + c.raw + ' đơn'
                                }
                            }
                        },
                        scales: {
                            yRevenue: {
                                type: 'linear', position: 'left', beginAtZero: true,
                                grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { callback: v => fmt(v), color: '#00C9B0', font: { size: 11 } }
                            },
                            yOrders: {
                                type: 'linear', position: 'right', beginAtZero: true, grid: { display: false },
                                ticks: { color: '#00a8ff', font: { size: 11 } }
                            }, x: { grid: { display: false } }
                        }, animation: { duration: 600 }
                    }
                });
            }

            async function loadAnaStatus(period) {
                const raw = await get(`${BASE}/analytics/order-status?period=${period}`,
                    [{ status: 'completed', label: 'Hoàn thành', count: 0 }]);
                if (window.anaStatusChart) window.anaStatusChart.destroy();
                const ctx = document.getElementById('anaOrderStatusChart'); if (!ctx) return;
                const labels = raw.map(r => r.label), values = raw.map(r => r.count);
                const colors = raw.map(r => SC[r.status] || '#bdbdbd');
                const total = values.reduce((a, b) => a + b, 0) || 1;
                window.anaStatusChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0, hoverOffset: 6 }] },
                    options: {
                        responsive: true, maintainAspectRatio: false, cutout: '68%',
                        plugins: {
                            legend: { display: false }, tooltip: {
                                callbacks: {
                                    label: c =>
                                        `${c.label}: ${c.raw} đơn (${Math.round(c.raw / total * 100)}%)`
                                }
                            }
                        }, animation: { duration: 700 }
                    }
                });
                const lg = document.getElementById('orderStatusLegend');
                if (lg) lg.innerHTML = raw.map((r, i) =>
                    `<div class="legend-item"><span class="legend-dot" style="background:${colors[i]}"></span>
             <span>${r.label}</span><span class="legend-val">${r.count} (${Math.round(r.count / total * 100)}%)</span></div>`
                ).join('');
            }

            async function loadAnaTopProducts(period) {
                const raw = await get(`${BASE}/analytics/top-products?period=${period}`, []);
                const c = document.getElementById('topProductsList'); if (!c) return;
                if (!raw.length) { c.innerHTML = '<p style="color:#aaa;padding:20px">Chưa có dữ liệu</p>'; return; }
                const rankCls = ['rank-1', 'rank-2', 'rank-3', 'rank-other', 'rank-other'];
                c.innerHTML = raw.map((p, i) => `
            <div class="top-product-item">
                <span class="top-rank ${rankCls[i] || 'rank-other'}">${i + 1}</span>
                <div class="top-product-info">
                    <div class="top-product-name">${p.name}</div>
                    <div class="top-product-bar-wrap"><div class="top-product-bar" style="width:${p.pct}%"></div></div>
                    <div class="top-product-stat">${p.qty} đơn đã bán</div>
                </div>
                <span class="top-product-revenue">${fmt(p.revenue)}</span>
            </div>`).join('');
            }

            async function loadAnaCategory(period) {
                const raw = await get(`${BASE}/analytics/category?period=${period}`, []);
                if (window.anaCategoryChart) window.anaCategoryChart.destroy();
                const ctx = document.getElementById('anaCategoryChart'); if (!ctx) return;
                window.anaCategoryChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: raw.map(r => r.category), datasets: [{
                            label: '% doanh thu',
                            data: raw.map(r => r.pct), backgroundColor: raw.map((_, i) => ANA_COLORS[i % ANA_COLORS.length]),
                            borderRadius: 6, borderWidth: 0
                        }]
                    },
                    options: {
                        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.raw}% doanh thu` } } },
                        scales: {
                            x: { beginAtZero: true, max: 100, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { callback: v => v + '%' } },
                            y: { grid: { display: false } }
                        }, animation: { duration: 600 }
                    }
                });
            }

            async function loadAnaHourly(period) {
                const raw = await get(`${BASE}/analytics/hourly?period=${period}`,
                    Array.from({ length: 24 }, (_, h) => ({ hour: String(h).padStart(2, '0') + 'h', count: 0 })));
                if (window.anaHourlyChart) window.anaHourlyChart.destroy();
                const ctx = document.getElementById('anaHourlyChart'); if (!ctx) return;
                const filtered = raw.filter(r => parseInt(r.hour) >= 6);
                const counts = filtered.map(r => r.count), maxC = Math.max(...counts, 1);
                window.anaHourlyChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: filtered.map(r => r.hour), datasets: [{
                            label: 'Số đơn', data: counts,
                            borderColor: '#f39c12', backgroundColor: 'rgba(243,156,18,0.10)', borderWidth: 2.5,
                            fill: true, tension: 0.45,
                            pointBackgroundColor: counts.map(v => v === maxC ? '#f39c12' : 'transparent'),
                            pointBorderColor: counts.map(v => v === maxC ? '#fff' : 'transparent'),
                            pointBorderWidth: 2, pointRadius: counts.map(v => v === maxC ? 7 : 2)
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
                        plugins: {
                            legend: { display: false },
                            tooltip: { backgroundColor: 'rgba(0,0,0,0.82)', callbacks: { label: c => `${c.raw} đơn hàng` } }
                        },
                        scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } }, x: { grid: { display: false } } },
                        animation: { duration: 600 }
                    }
                });
            }

            async function loadAnaReviews() {
                const d = await get(BASE + '/analytics/reviews',
                    { avgRating: 0, totalReviews: 0, distribution: { 5: { pct: 0 }, 4: { pct: 0 }, 3: { pct: 0 }, 2: { pct: 0 }, 1: { pct: 0 } }, recent: [] });
                const bs = document.querySelector('.big-star'); if (bs) bs.textContent = (d.avgRating || 0) + '★';
                const sb = document.getElementById('starBarsContainer');
                if (sb) sb.innerHTML = [5, 4, 3, 2, 1].map(s => `
            <div class="star-bar-row">
                <span class="star-bar-label">${s}</span>
                <div class="star-bar-track"><div class="star-bar-fill" style="width:${d.distribution?.[s]?.pct || 0}%"></div></div>
                <span class="star-bar-count">${d.distribution?.[s]?.pct || 0}%</span>
            </div>`).join('');
                const rl = document.getElementById('reviewsList');
                if (rl && d.recent?.length) {
                    const starStr = n => '★'.repeat(n) + (n < 5 ? `<span style="color:#ddd">${'★'.repeat(5 - n)}</span>` : '');
                    const ac = ['#00C9B0', '#e67e22', '#8e44ad', '#e74c3c', '#2980b9'];
                    rl.innerHTML = d.recent.map((r, i) => `
                <div class="review-item">
                    <div class="review-header">
                        <div class="reviewer-info">
                            <span class="avatar-circle" style="background:${ac[i % ac.length]}">
                                ${r.avatar ? `<img src="${r.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">` : (r.name?.[0] || '?')}
                            </span>
                            <div><span class="reviewer-name">${r.name || 'Ẩn danh'}</span>
                                 <span class="review-product">${r.productName || ''}</span></div>
                        </div>
                        <div class="review-meta">
                            <span class="star-rating">${starStr(r.rating || 5)}</span>
                            <span class="review-time">${r.time}</span>
                        </div>
                    </div>
                    <p class="review-text">${r.comment || ''}</p>
                    <div class="review-reply-btn"><i class="fas fa-reply"></i> Phản hồi</div>
                </div>`).join('');
                }
            }

            async function loadAllAnalytics(period) {
                await Promise.all([
                    loadAnaKPI(period), loadAnaRevOrder(period), loadAnaStatus(period),
                    loadAnaTopProducts(period), loadAnaCategory(period), loadAnaHourly(period)
                ]);
                loadAnaReviews();
            }

            // Xuất CSV (override hàm cũ)
            window.exportAnalyticsCSV = async function () {
                const period = document.querySelector('.period-tab.active')?.dataset?.period || 'month';
                const d = await get(BASE + '/revenue?period=' + period, null);
                if (!d?.labels) return alert('Không có dữ liệu để xuất');
                let csv = 'Kỳ,Doanh thu (VND),Số đơn hàng';
                d.labels.forEach((l, i) => {
                    csv += `${l},${d.revenue[i] || 0},${d.orderCounts[i] || 0}
`;
                });
                const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
                a.download = `bao-cao-${period}-${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`;
                a.click();
            };

            // ── 14. KHỞI ĐỘNG – chờ code cũ chạy xong ──────────────────────
            window.addEventListener('load', async () => {
                // Đợi Chart.js cũ khởi tạo xong
                await new Promise(r => setTimeout(r, 500));

                // Dashboard
                await Promise.all([
                    loadDashboardStats(),
                    loadRecentOrders(),
                    loadTopWeek(),
                    checkBadge()
                ]);

                // Cập nhật biểu đồ doanh thu bằng dữ liệu thật
                const period = document.getElementById('timeRange')?.value || 'month';
                await loadRevenueChartReal(period, 'line');
                await loadOrdersChartReal(document.getElementById('orderTimeRange')?.value || '7');

                // Analytics section
                loadAllAnalytics('month');

                // Ghi đè event cho analytics period tabs
                document.querySelectorAll('.period-tab').forEach(btn => {
                    const newBtn = btn.cloneNode(true); // remove old listeners
                    btn.parentNode.replaceChild(newBtn, btn);
                    newBtn.addEventListener('click', function () {
                        document.querySelectorAll('.period-tab').forEach(b => b.classList.remove('active'));
                        this.classList.add('active');
                        loadAllAnalytics(this.dataset.period);
                    });
                });

                // Ghi đè event timeRange biểu đồ dashboard
                const tr = document.getElementById('timeRange');
                if (tr) {
                    const nt = tr.cloneNode(true); tr.parentNode.replaceChild(nt, tr);
                    nt.addEventListener('change', function () {
                        const t = document.querySelector('.chart-type-btn.active')?.dataset?.type || 'line';
                        loadRevenueChartReal(this.value, t);
                    });
                }
                const otr = document.getElementById('orderTimeRange');
                if (otr) {
                    const no = otr.cloneNode(true); otr.parentNode.replaceChild(no, otr);
                    no.addEventListener('change', function () { loadOrdersChartReal(this.value); });
                }

                // Sidebar click → load section đúng
                document.querySelectorAll('.sidebar-nav a').forEach(a => {
                    a.addEventListener('click', () => {
                        const h = a.getAttribute('href');
                        if (h === '#menu-management') setTimeout(() => loadProducts(1), 100);
                        if (h === '#order-processing') setTimeout(() => { loadOrders(1); bindOrderFilters(); }, 100);
                        if (h === '#inventory') setTimeout(() => loadInventory(), 100);
                        if (h === '#finance') setTimeout(() => loadFinance(), 200);
                        if (h === '#store-profile') setTimeout(() => loadStoreProfile(), 100);
                        if (h === '#analytics') setTimeout(() => loadAllAnalytics('month'), 100);
                    });
                });

                // Auto refresh dashboard mỗi 30s
                setInterval(async () => {
                    await Promise.all([loadDashboardStats(), loadRecentOrders(), checkBadge()]);
                    const p = document.getElementById('timeRange')?.value || 'month';
                    loadRevenueChartReal(p, 'line');
                }, 30000);
                setInterval(checkBadge, 10000);
            });

        })(); // IIFE – không leak biến ra global

(function () {
            const BASE = 'http://localhost:3000/api/seller';
            const SELLER = (() => {
                try {
                    const s = JSON.parse(localStorage.getItem('currentSeller'));
                    return s?.shopname || s?.shopName || '';
                } catch { return ''; }
            })();
            function sp(u) { return u + (u.includes('?') ? '&' : '?') + 'seller=' + encodeURIComponent(SELLER); }

            async function get(url, fb) {
                try { const r = await fetch(sp(url)); if (!r.ok) throw 0; return await r.json(); }
                catch { return fb; }
            }

            function fmtM(v) {
                v = Number(v) || 0;
                if (v >= 1e9) return (v / 1e9).toFixed(1) + ' tỷ';
                if (v >= 1e6) return (v / 1e6).toFixed(1) + ' triệu';
                if (v >= 1e3) return Math.round(v / 1e3) + 'k';
                return v.toLocaleString('vi-VN') + 'đ';
            }

            // ════════════════════════════════════════════════════════════
            // A. TÀI CHÍNH – SỐ DƯ VÍ
            // ════════════════════════════════════════════════════════════
            async function loadWallet() {
                const d = await get(BASE + '/finance/wallet',
                    { balance: 0, available: 0, pending: 0, totalFee: 0 });

                // Số dư ví hiện tại
                const walBal = document.querySelector('#finance .wallet-balance');
                if (walBal) walBal.textContent = fmtM(d.balance);

                // Số dư khả dụng
                const items = document.querySelectorAll('#finance .wallet-info .info-item');
                if (items[0]) items[0].querySelector('.value').textContent = fmtM(d.available);
                if (items[1]) items[1].querySelector('.value').textContent = fmtM(d.pending);
                // items[2] giữ nguyên phí rút tiền

                return d;
            }

            // ════════════════════════════════════════════════════════════
            // B. TÀI CHÍNH – BIỂU ĐỒ THU NHẬP THEO THÁNG
            // ════════════════════════════════════════════════════════════
            let _incomeChart = null;

            async function loadIncomeChart(year) {
                year = year || new Date().getFullYear();
                const d = await get(BASE + '/finance/income?year=' + year,
                    { months: [], summary: { thisMonth: 0, feeThisMonth: 0, changePct: null } });

                // ── Stat cards ──────────────────────────────────────────
                const cards = document.querySelectorAll('#finance .stats-grid .stat-card');
                if (cards[0]) {
                    cards[0].querySelector('h3').textContent = fmtM(d.summary?.thisMonth || 0);
                }
                if (cards[1]) {
                    cards[1].querySelector('h3').textContent = fmtM(d.summary?.feeThisMonth || 0);
                }
                // cards[2] = lần rút – giữ nguyên (không có trong schema)

                // Tiêu đề cập nhật năm
                const chartTitle = document.querySelector('#finance .chart-card .chart-header h3');
                if (chartTitle) chartTitle.textContent = `Thu nhập theo tháng (năm ${year})`;

                // ── Cập nhật / tạo incomeChart ──────────────────────────
                const ctx = document.getElementById('incomeChart');
                if (!ctx) return;

                const months = d.months || [];
                const labels = months.map(m => m.label);
                // Đổi sang triệu để khớp format chart cũ (data: [4.2, 5.8, ...])
                const values = months.map(m => Math.round((m.revenue / 1e6) * 10) / 10);

                // Nếu chart cũ đã tồn tại (tạo bởi script cũ) → update data
                // Chart.js lưu instance vào canvas.__chartjs__ (hoặc Chart.getChart)
                const existingChart = Chart.getChart ? Chart.getChart(ctx) : null;
                if (existingChart) {
                    existingChart.data.labels = labels;
                    existingChart.data.datasets[0].data = values;
                    existingChart.update('active');
                } else {
                    // Tạo mới nếu chưa có
                    if (_incomeChart) _incomeChart.destroy();
                    _incomeChart = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels,
                            datasets: [{
                                label: 'Thu nhập (triệu VND)',
                                data: values,
                                backgroundColor: 'rgba(0, 201, 176, 0.7)',
                                borderColor: '#00C9B0', borderWidth: 2,
                                borderRadius: 8, barThickness: 40,
                                categoryPercentage: 0.7, barPercentage: 0.8
                            }]
                        },
                        options: {
                            responsive: true, maintainAspectRatio: false,
                            plugins: {
                                legend: { display: true, position: 'top' },
                                tooltip: { callbacks: { label: c => fmtM(c.raw * 1e6) } }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    title: { display: true, text: 'Thu nhập (triệu VND)' },
                                    ticks: { stepSize: 2 }
                                },
                                x: {
                                    title: { display: true, text: 'Tháng' },
                                    grid: { display: false }
                                }
                            }
                        }
                    });
                }
            }

            // Gắn sự kiện đổi năm cho select trong chart-header
            function bindYearSelect() {
                const sel = document.querySelector('#finance .chart-card .chart-header select');
                if (!sel) return;
                sel.addEventListener('change', function () {
                    const yr = parseInt(this.value) || new Date().getFullYear();
                    loadIncomeChart(yr);
                });
            }

            // ════════════════════════════════════════════════════════════
            // C. LỊCH SỬ GIAO DỊCH – phân trang, load từ DB
            // ════════════════════════════════════════════════════════════
            let _txnPage = 1;

            async function loadTransactions(page) {
                _txnPage = page || 1;
                const d = await get(BASE + '/finance/transactions?page=' + _txnPage,
                    { transactions: [], pages: 1, page: 1 });

                const tbody = document.querySelector('#finance .transaction-history .admin-table tbody');
                if (!tbody) return;

                if (!d.transactions || !d.transactions.length) {
                    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:30px;color:#aaa">Chưa có giao dịch nào</td></tr>';
                } else {
                    tbody.innerHTML = d.transactions.map(t => `
                    <tr>
                        <td>${t.date}</td>
                        <td><span class="trans-type ${t.type}">${t.typeText}</span></td>
                        <td class="amount ${t.positive ? 'positive' : 'negative'}">${t.amount}</td>
                        <td>${t.note}</td>
                        <td><span class="status ${t.status}">${t.statusText}</span></td>
                    </tr>`).join('');
                }

                // Cập nhật phân trang
                const pgSpan = document.querySelector('#finance .transaction-history .pagination span');
                if (pgSpan) pgSpan.textContent = `Trang ${d.page} / ${d.pages || 1}`;

                // Gắn nút prev/next
                const [prevBtn, nextBtn] = document.querySelectorAll('#finance .transaction-history .page-btn');
                if (prevBtn) prevBtn.onclick = () => { if (_txnPage > 1) loadTransactions(_txnPage - 1); };
                if (nextBtn) nextBtn.onclick = () => { if (_txnPage < (d.pages || 1)) loadTransactions(_txnPage + 1); };
            }

            // ════════════════════════════════════════════════════════════
            // D. MARKETING – THỐNG KÊ & BẢNG SẢN PHẨM
            // ════════════════════════════════════════════════════════════
            async function loadMarketingStats() {
                const d = await get(BASE + '/marketing/stats',
                    {
                        totalOrders: 0, discountedOrders: 0, grossRevenue: 0,
                        netRevenue: 0, totalDiscount: 0, conversionRate: 0, topProducts: []
                    });

                // Stat cards trong promo-stats-grid
                const cards = document.querySelectorAll('#marketing .promo-stats-grid .stat-card');
                // card[0] = mã đang hoạt động (không có bảng coupons → hiển thị số đơn có giảm)
                if (cards[0]) {
                    cards[0].querySelector('h3').textContent = d.discountedOrders;
                    cards[0].querySelector('p').textContent = 'Đơn có áp dụng giảm giá';
                }
                // card[1] = lượt sử dụng → tổng đơn hàng tháng này
                if (cards[1]) {
                    cards[1].querySelector('h3').textContent = d.totalOrders;
                    cards[1].querySelector('p').textContent = 'Tổng đơn hàng năm nay';
                }
                // card[2] = doanh thu thuần
                if (cards[2]) {
                    cards[2].querySelector('h3').textContent = fmtM(d.netRevenue);
                    cards[2].querySelector('p').textContent = 'Doanh thu thực nhận (năm nay)';
                }
                // card[3] = tỷ lệ đơn có giảm giá
                if (cards[3]) {
                    cards[3].querySelector('h3').textContent = d.conversionRate + '%';
                    cards[3].querySelector('p').textContent = 'Tỷ lệ đơn có giảm giá';
                }
            }

            async function loadMarketingProducts() {
                const products = await get(BASE + '/marketing/products', []);

                const tbody = document.querySelector('#marketing .promo-table tbody');
                if (!tbody || !products.length) return;

                tbody.innerHTML = products.map(p => {
                    const hasDis = p.discountPct > 0;
                    const status = p.stock > 0 ? 'active' : 'expired';
                    const statusT = p.stock > 0 ? 'Đang bán' : 'Hết hàng';
                    return `<tr>
                    <td><strong>${p.name}</strong></td>
                    <td>${hasDis ? 'Giảm %' : '—'}</td>
                    <td>${hasDis ? p.discountPct + '%' : '—'}</td>
                    <td>${Number(p.price).toLocaleString('vi-VN')}đ</td>
                    <td>${p.ordersThisMonth || 0}</td>
                    <td>—</td>
                    <td><span class="status ${status}">${statusT}</span></td>
                    <td>
                        <a href="/html/edit-product.html?id=${p.id}">
                            <button class="btn-edit"><i class="fas fa-edit"></i> Sửa</button>
                        </a>
                    </td>
                </tr>`;
                }).join('');

                // Phân trang (1 trang, tối đa 20 sản phẩm)
                const pgSpan = document.querySelector('#marketing .promo-list-card .pagination span');
                if (pgSpan) pgSpan.textContent = `Trang 1 / 1`;
            }

            // ════════════════════════════════════════════════════════════
            // E. FORM TẠO MÃ GIẢM GIÁ – Thông báo (chưa có bảng coupons)
            // ════════════════════════════════════════════════════════════
            function bindPromoForm() {
                const form = document.querySelector('#marketing .promo-form');
                if (!form) return;
                form.addEventListener('submit', function (e) {
                    e.preventDefault();
                    // Hiển thị thông báo vì schema chưa có bảng coupons
                    alert('✅ Tính năng mã giảm giá sẽ khả dụng khi thêm bảng coupons vào database.\n\nHiện tại dữ liệu khuyến mãi được tính từ chênh lệch giá sản phẩm.');
                });
            }

            // ════════════════════════════════════════════════════════════
            // F. LOAD TẤT CẢ KHI CLICK SIDEBAR
            // ════════════════════════════════════════════════════════════
            async function loadFinanceSection() {
                await Promise.all([
                    loadWallet(),
                    loadIncomeChart(new Date().getFullYear()),
                    loadTransactions(1)
                ]);
                bindYearSelect();
            }

            async function loadMarketingSection() {
                await Promise.all([
                    loadMarketingStats(),
                    loadMarketingProducts()
                ]);
                bindPromoForm();
            }

            // Gắn vào sidebar click – dùng capture để chạy sau listener cũ
            document.querySelectorAll('.sidebar-nav a').forEach(a => {
                a.addEventListener('click', () => {
                    const h = a.getAttribute('href');
                    if (h === '#finance') setTimeout(loadFinanceSection, 150);
                    if (h === '#marketing') setTimeout(loadMarketingSection, 150);
                }, true); // capture = true, chạy trước listener cũ nếu cần
            });

            // Tự động load nếu section finance/marketing đang active khi trang mở
            window.addEventListener('load', () => {
                setTimeout(() => {
                    if (document.querySelector('#finance.active')) loadFinanceSection();
                    if (document.querySelector('#marketing.active')) loadMarketingSection();
                }, 600);
            });

        })();

(function () {
            const BASE = 'http://localhost:3000/api/seller';
            const SELLER = (() => {
                try {
                    const s = JSON.parse(localStorage.getItem('currentSeller'));
                    return s?.shopname || s?.shopName || '';
                } catch { return ''; }
            })();

            function apiUrl(path) {
                return BASE + path + (path.includes('?') ? '&' : '?') + 'seller=' + encodeURIComponent(SELLER);
            }

            async function getAPI(path) {
                try {
                    const r = await fetch(apiUrl(path));
                    if (!r.ok) throw new Error('HTTP ' + r.status);
                    return await r.json();
                } catch (e) {
                    console.warn('[FIX] API fail:', path, e.message);
                    return null;
                }
            }

            function fmtVND(v) {
                v = Number(v) || 0;
                if (v >= 1e9) return (v / 1e9).toFixed(1) + ' tỷ';
                if (v >= 1e6) return (v / 1e6).toFixed(1) + ' triệu';
                if (v >= 1e3) return Math.round(v / 1e3) + 'k';
                return v.toLocaleString('vi-VN') + 'đ';
            }

            // ── Cập nhật biểu đồ doanh thu + "Tổng kỳ này" từ API thật ──
            async function fixRevenueChart(period, chartType) {
                const data = await getAPI('/revenue?period=' + period);
                if (!data || !data.labels || !data.labels.length) return;

                // "Tổng kỳ này" — dùng field revenue (không phải values)
                const revenue = data.revenue || [];
                const total = revenue.reduce((a, b) => a + b, 0);
                const el = document.getElementById('totalRevenueDisplay');
                if (el) el.textContent = fmtVND(total);

                // Cập nhật revenueChart (đã được tạo bởi createRevenueChart)
                if (window.revenueChart) {
                    window.revenueChart.data.labels = data.labels;
                    window.revenueChart.data.datasets[0].data = revenue;
                    window.revenueChart.update('active');
                }
            }

            // ── Cập nhật biểu đồ đơn hàng + "Tổng đơn kỳ này" từ API thật ──
            async function fixOrdersChart(period) {
                const data = await getAPI('/revenue?period=' + period);
                if (!data) return;

                const orders = data.orderCounts || [];
                const total = orders.reduce((a, b) => a + b, 0);

                // "Tổng đơn kỳ này"
                const el = document.getElementById('totalOrdersDisplay');
                if (el) el.textContent = total + ' đơn';

                // Cập nhật ordersChart
                if (window.ordersChart) {
                    const maxVal = Math.max(...orders, 1);
                    window.ordersChart.data.labels = data.labels || [];
                    window.ordersChart.data.datasets[0].data = orders;
                    // Cập nhật màu gradient theo giá trị thật
                    window.ordersChart.data.datasets[0].backgroundColor = orders.map(v =>
                        `rgba(0, 201, 176, ${0.35 + 0.65 * (v / maxVal)})`
                    );
                    window.ordersChart.update('active');
                }
            }

            // ── Chờ code cũ khởi tạo chart xong, sau đó override ──────────
            // Code cũ chạy trong DOMContentLoaded, ta chạy sau bằng setTimeout
            window.addEventListener('DOMContentLoaded', function () {
                // Đợi code cũ tạo chart (~100ms là đủ vì đồng bộ)
                setTimeout(async function () {
                    const revPeriod = document.getElementById('timeRange')?.value || 'month';
                    const ordPeriod = document.getElementById('orderTimeRange')?.value || '7';
                    const chartType = document.querySelector('.chart-type-btn.active')?.dataset?.type || 'line';

                    await fixRevenueChart(revPeriod, chartType);
                    await fixOrdersChart(ordPeriod);

                    // ── Ghi đè sự kiện timeRange (clone để xóa listener cũ) ──
                    const trEl = document.getElementById('timeRange');
                    if (trEl) {
                        const newTr = trEl.cloneNode(true);
                        trEl.parentNode.replaceChild(newTr, trEl);
                        newTr.addEventListener('change', async function () {
                            // Gọi hàm cũ để rebuild chart với type đúng
                            const type = document.querySelector('.chart-type-btn.active')?.dataset?.type || 'line';
                            if (typeof createRevenueChart === 'function') {
                                createRevenueChart(this.value, type);
                            }
                            // Sau đó cập nhật data thật
                            await fixRevenueChart(this.value, type);
                        });
                    }

                    // ── Ghi đè sự kiện orderTimeRange ───────────────────────
                    const otrEl = document.getElementById('orderTimeRange');
                    if (otrEl) {
                        const newOtr = otrEl.cloneNode(true);
                        otrEl.parentNode.replaceChild(newOtr, otrEl);
                        newOtr.addEventListener('change', async function () {
                            if (typeof createOrdersChart === 'function') {
                                createOrdersChart(this.value);
                            }
                            await fixOrdersChart(this.value);
                        });
                    }

                    // ── Ghi đè sự kiện chart-type buttons ───────────────────
                    document.querySelectorAll('.chart-type-btn').forEach(btn => {
                        const newBtn = btn.cloneNode(true);
                        btn.parentNode.replaceChild(newBtn, btn);
                        newBtn.addEventListener('click', async function () {
                            document.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
                            this.classList.add('active');
                            const type = this.dataset.type;
                            const period = document.getElementById('timeRange')?.value || 'month';
                            if (typeof createRevenueChart === 'function') {
                                createRevenueChart(period, type);
                            }
                            await fixRevenueChart(period, type);
                        });
                    });

                }, 200); // đủ để DOMContentLoaded của code cũ chạy xong
            });

        })();

(function () {
            function buildFinanceOverride() {
                /* ── 1. INCOME CHART ── */
                const canvas = document.getElementById('incomeChart');
                if (!canvas) return;

                const existing = (typeof Chart !== 'undefined' && Chart.getChart) ? Chart.getChart(canvas) : null;
                if (existing) existing.destroy();

                const ctx = canvas.getContext('2d');

                /* Gradient đôi: line area fill */
                const grad = ctx.createLinearGradient(0, 0, 0, 280);
                grad.addColorStop(0, 'rgba(0,201,176,0.22)');
                grad.addColorStop(0.65, 'rgba(0,201,176,0.05)');
                grad.addColorStop(1, 'rgba(0,201,176,0)');

                const labels = ['Th.1', 'Th.2', 'Th.3', 'Th.4', 'Th.5', 'Th.6',
                    'Th.7', 'Th.8', 'Th.9', 'Th.10', 'Th.11', 'Th.12'];
                const data = [4.2, 5.8, 4.9, 6.3, 7.1, 8.4, 7.8, 9.2, 8.6, 10.1, 9.5, 12.4];

                window.incomeChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels,
                        datasets: [{
                            label: 'Thu nhập (triệu đ)',
                            data,
                            fill: true,
                            backgroundColor: grad,
                            borderColor: '#00C9B0',
                            borderWidth: 2.5,
                            pointBackgroundColor: '#fff',
                            pointBorderColor: '#00C9B0',
                            pointBorderWidth: 2.5,
                            pointRadius: 4,
                            pointHoverRadius: 7,
                            pointHoverBackgroundColor: '#00C9B0',
                            pointHoverBorderColor: '#fff',
                            pointHoverBorderWidth: 2.5,
                            tension: 0.42,
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: { mode: 'index', intersect: false },
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: '#111827',
                                titleColor: 'rgba(255,255,255,0.5)',
                                bodyColor: '#fff',
                                borderColor: 'rgba(255,255,255,0.08)',
                                borderWidth: 1,
                                padding: 13,
                                cornerRadius: 12,
                                displayColors: false,
                                callbacks: {
                                    title: i => i[0].label,
                                    label: i => `${i.raw.toFixed(1)} triệu đ`,
                                }
                            },
                        },
                        scales: {
                            x: {
                                grid: { display: false },
                                border: { display: false },
                                ticks: {
                                    color: '#9ca3af',
                                    font: { size: 11, weight: '600', family: "'Be Vietnam Pro',sans-serif" },
                                }
                            },
                            y: {
                                grid: { color: 'rgba(0,0,0,0.05)' },
                                border: { display: false, dash: [4, 4] },
                                ticks: {
                                    color: '#9ca3af',
                                    font: { size: 11, weight: '600', family: "'Be Vietnam Pro',sans-serif" },
                                    callback: v => v + ' tr',
                                    maxTicksLimit: 6,
                                },
                                beginAtZero: true,
                            }
                        }
                    }
                });

                /* ── 2. KPI bar ── */
                const card = canvas.closest('.chart-card');
                if (card && !card.querySelector('.fin-kpi-row')) {
                    const header = card.querySelector('.chart-header');
                    const bar = document.createElement('div');
                    bar.className = 'fin-kpi-row';
                    bar.innerHTML = `
                    <div class="fk-item">
                        <div class="fk-label">Tổng năm 2026</div>
                        <div class="fk-val">94.3 tr <span class="fk-badge up">↑ 18%</span></div>
                    </div>
                    <div class="fk-item">
                        <div class="fk-label">Tháng cao nhất</div>
                        <div class="fk-val">12.4 tr <span style="font-size:.75rem;color:#9ca3af;font-weight:500">Th.12</span></div>
                    </div>
                    <div class="fk-item">
                        <div class="fk-label">Trung bình / tháng</div>
                        <div class="fk-val">7.9 tr</div>
                    </div>
                `;
                    header.insertAdjacentElement('afterend', bar);
                }
            }

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => setTimeout(buildFinanceOverride, 400));
            } else {
                setTimeout(buildFinanceOverride, 400);
            }
        })();

(function () {
            function initPromoModal() {
                /* ── 1. Thêm nút mới vào header-actions ── */
                const headerActions = document.querySelector('#marketing .header-actions');
                if (!headerActions || headerActions.querySelector('.promo-btn-new')) return;

                const newBtn = document.createElement('button');
                newBtn.className = 'promo-btn-new';
                newBtn.innerHTML = `
                <span class="pbtn-icon"><i class="fas fa-plus"></i></span>
                Tạo mã giảm giá
            `;
                headerActions.prepend(newBtn);

                /* ── 2. Tạo modal DOM ── */
                const backdrop = document.createElement('div');
                backdrop.className = 'promo-modal-backdrop';
                backdrop.innerHTML = `
                <div class="promo-modal" role="dialog" aria-modal="true">

                    <!-- Header -->
                    <div class="promo-modal-head">
                        <div class="promo-modal-head-left">
                            <div class="promo-modal-icon"><i class="fas fa-ticket-alt"></i></div>
                            <div>
                                <p class="promo-modal-title">Tạo mã giảm giá mới</p>
                                <p class="promo-modal-sub">Điền thông tin bên dưới để tạo mã khuyến mãi</p>
                            </div>
                        </div>
                        <button class="promo-modal-close" id="promoModalClose" aria-label="Đóng">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="promo-modal-divider"></div>

                    <!-- Body -->
                    <div class="promo-modal-body">

                        <!-- Loại mã -->
                        <p class="promo-section-label">Loại giảm giá</p>
                        <div class="promo-type-toggle promo-field-row triple" style="margin-bottom:18px;">
                            <button type="button" class="promo-type-pill active" data-type="fixed">
                                <i class="fas fa-tag"></i> Cố định (đ)
                            </button>
                            <button type="button" class="promo-type-pill" data-type="percent">
                                <i class="fas fa-percent"></i> Phần trăm
                            </button>
                            <button type="button" class="promo-type-pill" data-type="freeship">
                                <i class="fas fa-truck"></i> Miễn ship
                            </button>
                        </div>

                        <!-- Thông tin cơ bản -->
                        <p class="promo-section-label">Thông tin mã</p>
                        <div class="promo-field-row">
                            <div class="promo-field">
                                <label>Mã giảm giá <span class="req">*</span></label>
                                <input type="text" id="pm_code" placeholder="VD: SALE50K" style="text-transform:uppercase;">
                            </div>
                            <div class="promo-field">
                                <label>Giá trị giảm <span class="req">*</span></label>
                                <div class="promo-input-wrap">
                                    <input type="number" id="pm_value" placeholder="50000" min="0">
                                    <span class="promo-input-suffix" id="pm_suffix">đ</span>
                                </div>
                            </div>
                        </div>
                        <div class="promo-field-row">
                            <div class="promo-field">
                                <label>Đơn tối thiểu (đ)</label>
                                <div class="promo-input-wrap">
                                    <input type="number" id="pm_minorder" placeholder="150000" min="0">
                                    <span class="promo-input-suffix">đ</span>
                                </div>
                            </div>
                            <div class="promo-field">
                                <label>Giới hạn lượt dùng</label>
                                <div class="promo-input-wrap">
                                    <input type="number" id="pm_limit" placeholder="Không giới hạn" min="1">
                                    <span class="promo-input-suffix">lượt</span>
                                </div>
                            </div>
                        </div>

                        <!-- Thời gian -->
                        <p class="promo-section-label">Thời gian áp dụng</p>
                        <div class="promo-field-row">
                            <div class="promo-field">
                                <label>Ngày bắt đầu</label>
                                <input type="date" id="pm_start">
                            </div>
                            <div class="promo-field">
                                <label>Ngày kết thúc</label>
                                <input type="date" id="pm_end">
                            </div>
                        </div>

                        <!-- Tùy chọn -->
                        <p class="promo-section-label">Tùy chọn thêm</p>
                        <div style="display:flex; flex-direction:column; gap:10px;">
                            <label class="promo-check-row">
                                <input type="checkbox" id="pm_firstorder">
                                <span>Chỉ áp dụng cho đơn hàng đầu tiên</span>
                            </label>
                            <label class="promo-check-row">
                                <input type="checkbox" id="pm_oneuse">
                                <span>Mỗi khách chỉ dùng một lần</span>
                            </label>
                        </div>

                        <!-- Footer -->
                        <div class="promo-modal-footer">
                            <button class="promo-footer-cancel" id="promoModalCancel">Hủy bỏ</button>
                            <button class="promo-footer-submit" id="promoModalSubmit">
                                <i class="fas fa-check"></i> Tạo mã giảm giá
                            </button>
                        </div>
                    </div>
                </div>
            `;
                document.body.appendChild(backdrop);

                /* ── 3. Open / Close ── */
                function openModal() {
                    backdrop.classList.add('open');
                    document.body.style.overflow = 'hidden';
                }
                function closeModal() {
                    backdrop.classList.remove('open');
                    document.body.style.overflow = '';
                }

                newBtn.addEventListener('click', openModal);
                backdrop.querySelector('#promoModalClose').addEventListener('click', closeModal);
                backdrop.querySelector('#promoModalCancel').addEventListener('click', closeModal);
                backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });
                document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

                /* ── 4. Type pills toggle ── */
                const pills = backdrop.querySelectorAll('.promo-type-pill');
                const suffix = backdrop.querySelector('#pm_suffix');
                pills.forEach(pill => {
                    pill.addEventListener('click', () => {
                        pills.forEach(p => p.classList.remove('active'));
                        pill.classList.add('active');
                        const t = pill.dataset.type;
                        if (suffix) suffix.textContent = t === 'percent' ? '%' : 'đ';
                    });
                });

                /* ── 5. Submit – gọi lại form gốc nếu muốn ── */
                backdrop.querySelector('#promoModalSubmit').addEventListener('click', () => {
                    const code = backdrop.querySelector('#pm_code').value.trim();
                    if (!code) {
                        backdrop.querySelector('#pm_code').focus();
                        backdrop.querySelector('#pm_code').style.borderColor = '#ef4444';
                        return;
                    }
                    // Trigger submit trên form gốc (để JS gốc xử lý)
                    const origForm = document.querySelector('#marketing .promo-form');
                    if (origForm) origForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                    else {
                        alert('✅ Mã giảm giá "' + code + '" đã được tạo thành công!');
                        closeModal();
                    }
                });
            }

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => setTimeout(initPromoModal, 200));
            } else {
                setTimeout(initPromoModal, 200);
            }
        })();

(function () {
        const SAMPLE = [
            { id:1, name:'Áo Hoodie Oversize Unisex', sku:'SKU-001', img:'https://down-vn.img.susercontent.com/file/vn-11134201-7r98o-lpja7tsxdp9xfe', stock:15, sold:120 },
            { id:2, name:'Áo Hoodie Basic Cotton',    sku:'SKU-002', img:'https://thoitrangbigsize.vn/wp-content/uploads/2025/01/BSX1518W.jpg',         stock:3,  sold:95  },
            { id:3, name:'Áo Hoodie Zip Jacket',      sku:'SKU-003', img:'https://via.placeholder.com/52',                                               stock:0,  sold:78  },
        ];

        const cls   = s => s===0?'out':s<=5?'low':'ok';
        const lbl   = s => s===0?'Hết hàng':s<=5?'Sắp hết':'Còn hàng';
        const col   = s => s===0?'#ef4444':s<=5?'#f59e0b':'#00C9B0';
        const pct   = (s,sold) => { const t=s+sold; return t?Math.round(s/t*100):0; };

        function renderRow(p) {
            return `<tr data-id="${p.id}" data-stock="${p.stock}" data-name="${p.name.toLowerCase()}">
                <td><div class="inv-prod-cell">
                    <img class="inv-prod-img" src="${p.img}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/52'">
                    <div><div class="inv-prod-name">${p.name}</div><div class="inv-prod-sku">${p.sku}</div></div>
                </div></td>
                <td><div class="inv-stock-cell">
                    <div class="inv-stock-num" style="color:${col(p.stock)}">${p.stock}</div>
                    <div class="inv-stock-bar-bg"><div class="inv-stock-bar-fill" style="width:${pct(p.stock,p.sold)}%;background:${col(p.stock)}"></div></div>
                </div></td>
                <td style="font-weight:600">${p.sold}</td>
                <td><span class="inv-badge ${cls(p.stock)}">${lbl(p.stock)}</span></td>
                <td><div class="inv-update-cell">
                    <input class="inv-qty-input" type="number" value="${p.stock}" min="0" id="inv_qty_${p.id}">
                    <button class="inv-save-btn" onclick="invSave(${p.id})"><i class="fas fa-check"></i> Lưu</button>
                </div></td>
            </tr>`;
        }

        function build() {
            const section = document.getElementById('inventory');
            if (!section || section.querySelector('.inv-root')) return;

            const root = document.createElement('div');
            root.className = 'inv-root';
            root.innerHTML = `
                <div class="inv-kpi-grid">
                    <div class="inv-kpi total"><div class="inv-kpi-icon"><i class="fas fa-boxes"></i></div><div class="inv-kpi-val" id="inv_total">120</div><div class="inv-kpi-label">Tổng sản phẩm</div><div class="inv-kpi-bar"></div></div>
                    <div class="inv-kpi new"><div class="inv-kpi-icon"><i class="fas fa-plus-circle"></i></div><div class="inv-kpi-val" id="inv_new">120</div><div class="inv-kpi-label">Sản phẩm mới nhập</div><div class="inv-kpi-bar"></div></div>
                    <div class="inv-kpi excess"><div class="inv-kpi-icon"><i class="fas fa-layer-group"></i></div><div class="inv-kpi-val" id="inv_excess">35</div><div class="inv-kpi-label">Tồn nhiều</div><div class="inv-kpi-bar"></div></div>
                    <div class="inv-kpi low"><div class="inv-kpi-icon"><i class="fas fa-exclamation-triangle"></i></div><div class="inv-kpi-val" id="inv_low">35</div><div class="inv-kpi-label">Sắp hết hàng</div><div class="inv-kpi-bar"></div></div>
                    <div class="inv-kpi out"><div class="inv-kpi-icon"><i class="fas fa-times-circle"></i></div><div class="inv-kpi-val" id="inv_out">12</div><div class="inv-kpi-label">Hết hàng</div><div class="inv-kpi-bar"></div></div>
                </div>
                <div class="inv-toolbar">
                    <div class="inv-search-wrap"><i class="fas fa-search"></i><input class="inv-search" id="inv_search" placeholder="Tìm sản phẩm..."></div>
                    <div class="inv-filter-pills">
                        <button class="inv-pill active" data-filter="all">Tất cả</button>
                        <button class="inv-pill" data-filter="ok">Còn hàng</button>
                        <button class="inv-pill" data-filter="low">Sắp hết</button>
                        <button class="inv-pill" data-filter="out">Hết hàng</button>
                    </div>
                    <span class="inv-count-badge" id="inv_count">3 sản phẩm</span>
                    <button class="inv-export-btn"><i class="fas fa-download"></i> Xuất Excel</button>
                </div>
                <div class="inv-table-card">
                    <table>
                        <thead><tr>
                            <th>Sản phẩm</th><th>Tồn kho</th><th>Đã bán</th><th>Trạng thái</th><th>Cập nhật tồn</th>
                        </tr></thead>
                        <tbody id="inv_tbody"></tbody>
                    </table>
                </div>`;

            section.prepend(root);

            const tbody = root.querySelector('#inv_tbody');
            tbody.innerHTML = SAMPLE.map(renderRow).join('');

            let curFilter = 'all';

            function filterTable(search, filter) {
                let visible = 0;
                tbody.querySelectorAll('tr').forEach(row => {
                    const matchS = !search || row.dataset.name.includes(search);
                    const matchF = filter==='all' || cls(parseInt(row.dataset.stock)||0)===filter;
                    row.style.display = (matchS && matchF) ? '' : 'none';
                    if (matchS && matchF) visible++;
                });
                root.querySelector('#inv_count').textContent = visible + ' sản phẩm';
            }

            root.querySelector('#inv_search').addEventListener('input', function() {
                filterTable(this.value.trim().toLowerCase(), curFilter);
            });
            root.querySelectorAll('.inv-pill').forEach(pill => {
                pill.addEventListener('click', () => {
                    root.querySelectorAll('.inv-pill').forEach(p => p.classList.remove('active'));
                    pill.classList.add('active');
                    curFilter = pill.dataset.filter;
                    filterTable(root.querySelector('#inv_search').value.trim().toLowerCase(), curFilter);
                });
            });

            /* Sync stats từ code gốc */
            const origGrid = section.querySelector('.stats-grid');
            if (origGrid) {
                new MutationObserver(() => {
                    const h3s = origGrid.querySelectorAll('.stat-card h3');
                    if (h3s[0]) root.querySelector('#inv_total').textContent = h3s[0].textContent;
                    if (h3s[1]) root.querySelector('#inv_low').textContent   = h3s[1].textContent;
                    if (h3s[2]) root.querySelector('#inv_out').textContent   = h3s[2].textContent;
                }).observe(origGrid, { subtree:true, childList:true, characterData:true });
            }

            /* Sync rows từ code gốc */
            const origTbody = section.querySelector('.admin-table tbody');
            if (origTbody) {
                new MutationObserver(() => {
                    const rows = [];
                    origTbody.querySelectorAll('tr').forEach(tr => {
                        const tds = tr.querySelectorAll('td');
                        if (!tds.length) return;
                        const input = tr.querySelector('input[type=number]');
                        const btn   = tr.querySelector('button');
                        const id    = btn?.getAttribute('onclick')?.match(/\d+/)?.[0] || Date.now();
                        rows.push({ id, name: tds[1]?.textContent?.trim()||'', sku:'SKU-'+String(id).padStart(3,'0'),
                            img: tds[0]?.querySelector('img')?.src||'https://via.placeholder.com/52',
                            stock: parseInt(input?.value)||0, sold: parseInt(tds[3]?.textContent)||0 });
                    });
                    if (rows.length) {
                        tbody.innerHTML = rows.map(renderRow).join('');
                        root.querySelector('#inv_count').textContent = rows.length + ' sản phẩm';
                    }
                }).observe(origTbody, { subtree:true, childList:true });
            }
        }

        window.invSave = function(id) {
            const input = document.getElementById('inv_qty_' + id);
            const val = parseInt(input?.value);
            if (isNaN(val)||val<0) { if(input) input.style.borderColor='#ef4444'; return; }
            const origInput = document.getElementById('stock_' + id);
            if (origInput) origInput.value = val;
            if (typeof window.saveStock === 'function') window.saveStock(id);
            else alert('✅ Đã cập nhật tồn kho: ' + val);
            const row = document.querySelector('#inv_tbody tr[data-id="'+id+'"]');
            if (row) {
                row.dataset.stock = val;
                const sold = parseInt(row.cells[2]?.textContent)||0;
                row.querySelector('.inv-stock-num').textContent = val;
                row.querySelector('.inv-stock-num').style.color = col(val);
                row.querySelector('.inv-stock-bar-fill').style.width = pct(val,sold)+'%';
                row.querySelector('.inv-stock-bar-fill').style.background = col(val);
                row.querySelector('.inv-badge').className = 'inv-badge '+cls(val);
                row.querySelector('.inv-badge').textContent = lbl(val);
            }
        };

        document.readyState==='loading'
            ? document.addEventListener('DOMContentLoaded', ()=>setTimeout(build,100))
            : setTimeout(build, 100);
    })();
