/**
 * ai-dwell-detail.js — Dwell-Time Tracker cho trang Chi Tiết Sản Phẩm
 * ─────────────────────────────────────────────────────────────────────
 * Nhúng vào product-detail.html / search.html / bất kỳ trang chi tiết nào
 * Yêu cầu: trang phải biết product_id đang xem
 *
 * Cách dùng:
 *   <script src="/js/ai-dwell-detail.js"></script>
 *   <script>
 *     // Sau khi xác định được product ID:
 *     AIDwell.init(productId);
 *   </script>
 * ─────────────────────────────────────────────────────────────────────
 */

window.AIDwell = (function () {
    'use strict';

    let _pid        = null;
    let _startTime  = null;
    let _maxScroll  = 0;
    let _saved      = false;

    /* Đọc session token (ai-behavior.js tạo trước) */
    function getSession() {
        return localStorage.getItem('std_session_token') || 'no-session';
    }

    function getUserId() {
        try {
            const u = JSON.parse(localStorage.getItem('user') || 'null');
            return u ? u.id : null;
        } catch { return null; }
    }

    /* Log event trực tiếp lên API */
    async function logDirect(eventType, value) {
        try {
            await fetch('http://127.0.0.1:8000/api/ai/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id:  getSession(),
                    user_id:     getUserId(),
                    product_id:  _pid,
                    event_type:  eventType,
                    value:       value !== null ? String(value) : null
                })
            });
        } catch { }
    }

    /* Lưu pending event vào localStorage (an toàn khi navigate) */
    function savePending(eventType, value) {
        localStorage.setItem('std_pending_event', JSON.stringify({
            product_id: _pid,
            event_type: eventType,
            value:      String(value),
            ts:         Date.now()
        }));
    }

    /* Tính giây đã xem */
    function getElapsedSeconds() {
        if (!_startTime) return 0;
        return Math.round((Date.now() - _startTime) / 1000);
    }

    /* Lưu dwell + scroll trước khi rời trang */
    function saveAndExit() {
        if (_saved || !_pid) return;
        _saved = true;

        const seconds = getElapsedSeconds();

        // Lưu dwell-time vào localStorage (ai-behavior.js xử lý khi quay về)
        if (seconds >= 3) {
            savePending('view_duration', seconds);
        }

        // Scroll depth: log trực tiếp (vẫn còn kết nối)
        if (_maxScroll > 10) {
            logDirect('scroll_depth', _maxScroll);
        }
    }

    /* Scroll tracker */
    function trackScroll() {
        window.addEventListener('scroll', () => {
            const scrolled  = window.scrollY + window.innerHeight;
            const total     = document.documentElement.scrollHeight;
            const pct       = Math.round((scrolled / total) * 100);
            if (pct > _maxScroll) _maxScroll = pct;
        }, { passive: true });
    }

    /* Public init */
    function init(productId) {
        if (!productId) return;
        _pid       = parseInt(productId);
        _startTime = Date.now();
        _saved     = false;
        _maxScroll = 0;

        // Log view_product ngay khi vào trang
        logDirect('view_product', null);

        // Theo dõi scroll
        trackScroll();

        // Lưu khi navigate đi (beforeunload)
        window.addEventListener('beforeunload', saveAndExit);

        // Lưu khi tab bị ẩn (user chuyển tab)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') saveAndExit();
        });

        console.log(`[AI Dwell] Tracking product #${_pid}`);
    }

    return { init, logDirect, getSession };
})();