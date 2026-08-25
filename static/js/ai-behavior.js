/**
 * ai-behavior.js — STDShop AI Behavior Tracker & Recommendation Engine
 * ─────────────────────────────────────────────────────────────────────
 * Nhúng vào customer-order.html (trước thẻ </body>)
 *
 * Chức năng:
 *  1. Tạo / khôi phục session token (localStorage)
 *  2. Theo dõi click vào sản phẩm → log event view_product
 *  3. Đếm thời gian dừng xem (dwell-time) → log event view_duration
 *  4. Khi load trang chính → gọi /api/ai/recommendations → render section "Dành Cho Bạn"
 *  5. Khi click danh mục → log event category_click (dùng cho trending boost)
 *
 * Luồng dữ liệu:
 *  Frontend → POST /api/ai/events (Node :3000) → proxy → Python :8000
 *  Frontend → GET  /api/ai/recommendations     → proxy → Python :8000
 * ─────────────────────────────────────────────────────────────────────
 */

(function () {
    'use strict';

    /* ══════════════════════════════════════════════════
       CONFIG
    ══════════════════════════════════════════════════ */
    const NODE_API      = '/api/ai';          // qua proxy Node.js (cùng origin)
    const DWELL_TRIGGER = 4000;              // ms — xem 4 giây mới tính dwell
    const REC_LIMIT     = 8;                 // số sản phẩm gợi ý hiển thị

    /* ══════════════════════════════════════════════════
       SESSION TOKEN — dùng chung toàn site
    ══════════════════════════════════════════════════ */
    let sessionToken = localStorage.getItem('std_session_token');
    if (!sessionToken) {
        sessionToken = 'sess-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
        localStorage.setItem('std_session_token', sessionToken);
    }

    /** Lấy user_id từ localStorage (order-script.js đã lưu khi đăng nhập) */
    function getUserId() {
        try {
            const u = JSON.parse(localStorage.getItem('user') || 'null');
            return u ? u.id : null;
        } catch { return null; }
    }

    /* ══════════════════════════════════════════════════
       EVENT LOGGER — gửi hành vi lên Python qua Node proxy
    ══════════════════════════════════════════════════ */
    async function logEvent(productId, eventType, value = null) {
        try {
            await fetch(`${NODE_API}/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id:  sessionToken,
                    user_id:     getUserId(),
                    product_id:  productId,
                    event_type:  eventType,
                    value:       value !== null ? String(value) : null
                })
            });
        } catch (e) {
            // Silent fail — không ảnh hưởng UX
        }
    }

    /* ══════════════════════════════════════════════════
       DWELL-TIME TRACKER
       — gắn vào mỗi product card sau khi render xong
    ══════════════════════════════════════════════════ */
    const _dwellTimers  = new Map();   // productId → {startTime, timer}
    const _dwellLogged  = new Set();   // productId đã được log trong session này

    function attachDwellTracker(card, productId) {
        if (!productId) return;

        card.addEventListener('mouseenter', () => {
            if (_dwellTimers.has(productId)) return;
            const startTime = Date.now();
            const timer = setTimeout(() => {
                // Đã xem đủ 4 giây → log view_product ngay
                logEvent(productId, 'view_product');
                _dwellLogged.add(productId);
            }, DWELL_TRIGGER);
            _dwellTimers.set(productId, { startTime, timer });
        });

        card.addEventListener('mouseleave', () => {
            const entry = _dwellTimers.get(productId);
            if (!entry) return;
            clearTimeout(entry.timer);
            const elapsed = Math.round((Date.now() - entry.startTime) / 1000);
            _dwellTimers.delete(productId);

            if (elapsed >= 4) {
                // Log view_duration (số giây thực tế)
                logEvent(productId, 'view_duration', elapsed);
                // Cập nhật recommendations sau khi có tín hiệu mới
                scheduleRecRefresh();
            }
        });

        // Click → log ngay lập tức + hủy timer
        card.addEventListener('click', () => {
            const entry = _dwellTimers.get(productId);
            if (entry) {
                clearTimeout(entry.timer);
                _dwellTimers.delete(productId);
            }
            logEvent(productId, 'view_product');
            _dwellLogged.add(productId);
        });
    }

    /* ══════════════════════════════════════════════════
       DEBOUNCED REC REFRESH
       — tránh gọi API liên tục khi user hover nhiều card
    ══════════════════════════════════════════════════ */
    let _recRefreshTimer = null;
    function scheduleRecRefresh() {
        clearTimeout(_recRefreshTimer);
        _recRefreshTimer = setTimeout(loadRecommendations, 1500);
    }

    /* ══════════════════════════════════════════════════
       FORMAT HELPERS
    ══════════════════════════════════════════════════ */
    function fmtVND(n) {
        return Number(n).toLocaleString('vi-VN') + 'đ';
    }

    function renderStars(rating) {
        const r   = Math.round(parseFloat(rating) * 2) / 2;
        const full = Math.floor(r);
        const half = r % 1 !== 0;
        let s = '';
        for (let i = 0; i < full; i++) s += '★';
        if (half) s += '½';
        return s || '★';
    }

    /* ══════════════════════════════════════════════════
       RENDER MỘT PRODUCT CARD (dùng chung cho cả recs + trending)
    ══════════════════════════════════════════════════ */
    function buildProductCard(p, badge = null) {
        const price     = p.price || 0;
        const oldPrice  = p.old_price || p.oldPrice || 0;
        const discount  = oldPrice > price
            ? Math.round((1 - price / oldPrice) * 100)
            : 0;
        const rating  = parseFloat(p.rating) || 4.5;
        const sold    = p.sold || p.sold_count || 0;
        const img     = p.img || p.image_url || 'https://via.placeholder.com/300x300?text=SP';
        const name    = p.name || 'Sản phẩm';
        const pid     = p.id;

        const card = document.createElement('div');
        card.className = 'product-card ai-rec-card';
        card.dataset.productId = pid;
        card.innerHTML = `
            <div class="product-card__img-wrap">
                <img src="${img}" alt="${name}" loading="lazy">
                ${discount >= 5 ? `<span class="product-card__discount">-${discount}%</span>` : ''}
                ${badge ? `<span class="product-card__hot">${badge}</span>` : ''}
            </div>
            <div class="product-card__body">
                <div class="product-card__name">${name}</div>
                <div class="product-card__rating">
                    <span class="product-card__stars" style="color:var(--amber);">${renderStars(rating)}</span>
                    <span class="product-card__rating-score">${rating.toFixed(1)}</span>
                    <span class="product-card__rating-divider">•</span>
                    <span class="product-card__sold">Đã bán ${Number(sold).toLocaleString('vi-VN')}</span>
                </div>
                <div class="product-card__price-row">
                    <span class="product-card__price">${fmtVND(price)}</span>
                    ${oldPrice > price
                        ? `<span class="product-card__price-original">${fmtVND(oldPrice)}</span>`
                        : ''}
                </div>
            </div>`;

        attachDwellTracker(card, pid);
        return card;
    }

    /* ══════════════════════════════════════════════════
       SECTION "DÀNH CHO BẠN" — inject vào DOM
    ══════════════════════════════════════════════════ */
    function ensureRecSection() {
        if (document.getElementById('ai-rec-section')) return;

        // Chèn section ngay trước .trending-section
        const trendingSection = document.querySelector('.trending-section');
        if (!trendingSection) return;

        const section = document.createElement('section');
        section.id        = 'ai-rec-section';
        section.className = 'trending-section';
        section.style.cssText = 'display:none;';   // Ẩn cho đến khi có data
        section.innerHTML = `
            <div class="container">
                <h2 class="section-title" id="ai-rec-title">
                    🤖 Dành Riêng Cho Bạn
                    <span id="ai-rec-reason" style="
                        font-size:.72rem; font-weight:500;
                        color:var(--mist); margin-left:auto; letter-spacing:0;
                    "></span>
                </h2>
                <div class="product-grid" id="ai-rec-grid"></div>
            </div>`;

        trendingSection.parentNode.insertBefore(section, trendingSection);
    }

    /* ══════════════════════════════════════════════════
       LOAD RECOMMENDATIONS từ Python qua Node proxy
    ══════════════════════════════════════════════════ */
    async function loadRecommendations() {
        try {
            const uid = getUserId();
            const qs  = new URLSearchParams({
                session_token: sessionToken,
                limit: REC_LIMIT,
                ...(uid ? { user_id: uid } : {})
            });

            const res  = await fetch(`${NODE_API}/recommendations?${qs}`);
            if (!res.ok) return;
            const recs = await res.json();

            if (!Array.isArray(recs) || recs.length === 0) return;

            ensureRecSection();
            const section = document.getElementById('ai-rec-section');
            const grid    = document.getElementById('ai-rec-grid');
            const reason  = document.getElementById('ai-rec-reason');
            if (!section || !grid) return;

            // Xác định lý do gợi ý để hiển thị cho user
            const hasBoost = recs.some(r => r._score_breakdown?.realtime_boost);
            const hasAff   = recs.some(r => (r._score_breakdown?.affinity || 0) > 0);
            if (hasBoost)     reason.textContent = '⚡ Dựa trên sản phẩm bạn vừa xem';
            else if (hasAff)  reason.textContent = '❤️ Dựa trên sở thích của bạn';
            else              reason.textContent = '🔥 Sản phẩm đang trending';

            // Render cards
            grid.innerHTML = '';
            recs.forEach((p, idx) => {
                let badge = null;
                if (idx === 0) badge = '✨ Phù hợp nhất';
                else if (p._score_breakdown?.realtime_boost) badge = '⚡ Hot';
                const card = buildProductCard(p, badge);
                grid.appendChild(card);
            });

            // Hiện section với animation
            section.style.display = 'block';
            section.style.opacity = '0';
            section.style.transform = 'translateY(16px)';
            requestAnimationFrame(() => {
                section.style.transition = 'opacity .4s ease, transform .4s ease';
                section.style.opacity    = '1';
                section.style.transform  = 'translateY(0)';
            });

        } catch (e) {
            // Silent fail
        }
    }

    /* ══════════════════════════════════════════════════
       PATCH EXISTING PRODUCT GRIDS
       — gắn dwell tracker vào trendingGrid + dishGrid
         ngay sau khi order-script.js render xong
    ══════════════════════════════════════════════════ */
    function patchExistingGrids() {
        ['trendingGrid', 'dishGrid'].forEach(gridId => {
            const grid = document.getElementById(gridId);
            if (!grid) return;

            // Observer: phát hiện khi card được inject vào DOM
            const observer = new MutationObserver(() => {
                grid.querySelectorAll('.product-card:not([data-ai-patched])').forEach(card => {
                    card.dataset.aiPatched = '1';
                    // Lấy product id từ onclick hoặc data attribute
                    const pid = extractPidFromCard(card);
                    if (pid) attachDwellTracker(card, pid);
                });
            });
            observer.observe(grid, { childList: true, subtree: true });
        });
    }

    /**
     * Cố trích xuất product ID từ card đã render bởi order-script.js
     * order-script.js dùng: onclick="openProduct(${p.id})" hoặc data-id
     */
    function extractPidFromCard(card) {
        // Thử data-id trước
        if (card.dataset.id) return parseInt(card.dataset.id);
        // Thử onclick string
        const onclickStr = card.getAttribute('onclick') || '';
        const match = onclickStr.match(/\((\d+)/);
        if (match) return parseInt(match[1]);
        // Thử các phần tử con có data-product-id
        const child = card.querySelector('[data-product-id]');
        if (child) return parseInt(child.dataset.productId);
        return null;
    }

    /* ══════════════════════════════════════════════════
       TRACK CATEGORY CLICKS
       — khi user click danh mục → coi như xem sản phẩm đó
         (fallback: dùng product_id=0, Python log category interest)
    ══════════════════════════════════════════════════ */
    function trackCategoryClicks() {
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                const category = card.dataset.category || '';
                // Lưu vào localStorage để trang khác biết category vừa click
                localStorage.setItem('std_last_category', category);
                localStorage.setItem('std_last_category_ts', Date.now());
            });
        });
    }

    /**
     * Khi quay về trang chính sau khi xem category/product,
     * check xem có dữ liệu dwell-time được lưu từ trang detail không
     * (trang detail sẽ lưu vào localStorage trước khi navigate)
     */
    function processPendingEvents() {
        const pending = localStorage.getItem('std_pending_event');
        if (!pending) return;
        try {
            const ev = JSON.parse(pending);
            // Validate: event không quá 5 phút cũ
            if (Date.now() - ev.ts < 5 * 60 * 1000) {
                logEvent(ev.product_id, ev.event_type, ev.value);
                // Sau khi log pending event → load recs ngay
                setTimeout(loadRecommendations, 800);
            }
        } catch { }
        localStorage.removeItem('std_pending_event');
    }

    /* ══════════════════════════════════════════════════
       EXPOSE HELPER — để các trang detail có thể log event
       trước khi navigate về trang chính
    ══════════════════════════════════════════════════ */
    window.STD_AI = {
        /**
         * Gọi từ trang detail (product-detail.html) khi user chuẩn bị rời trang:
         *   window.STD_AI.saveDwellEvent(productId, seconds)
         */
        saveDwellEvent(productId, seconds) {
            localStorage.setItem('std_pending_event', JSON.stringify({
                product_id: productId,
                event_type: 'view_duration',
                value:      String(seconds),
                ts:         Date.now()
            }));
        },
        /** Log trực tiếp từ bất kỳ trang nào */
        logEvent,
        sessionToken,
        getUserId
    };

    /* ══════════════════════════════════════════════════
       INIT
    ══════════════════════════════════════════════════ */
    document.addEventListener('DOMContentLoaded', () => {
        processPendingEvents();   // 1. Xử lý event còn pending từ trang trước
        patchExistingGrids();     // 2. Gắn dwell tracker vào product grids
        trackCategoryClicks();    // 3. Theo dõi click danh mục
        loadRecommendations();    // 4. Load gợi ý lần đầu
    });

    // Refresh recs khi tab được focus lại (user quay về từ trang khác)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            processPendingEvents();
            scheduleRecRefresh();
        }
    });

})();