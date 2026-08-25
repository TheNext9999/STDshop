/**
 * ai-widget.js — STDShop AI Smart Layer
 * ───────────────────────────────────────────────────────────────
 * Chức năng:
 *   1. Dwell-Time Tracker: theo dõi thời gian xem sản phẩm,
 *      log event lên Python FastAPI (/api/events),
 *      tự động mở Drawer gợi ý sản phẩm liên quan (/api/recommendations)
 *   2. Mini Chat Bubble: chat AI nhanh qua /api/chat (Python),
 *      render sản phẩm dạng pill có thể click,
 *      nút chuyển sang chatbot đầy đủ (chatbot.html)
 *   3. Hero AI Chips: gợi ý câu hỏi nhanh trong hero section
 *
 * Kết nối:
 *   - Node.js API (index.js) : http://localhost:3000  → lấy products
 *   - Python FastAPI (app.py): http://localhost:8000  → chat, events, recs
 * ───────────────────────────────────────────────────────────────
 */

(function () {
    'use strict';

    /* ══════════════════════════════════════════════════════
       CONFIG
    ══════════════════════════════════════════════════════ */
    const NODE_API    = 'http://localhost:3000/api';   // Node.js (products, cart)
    const PYTHON_API  = 'http://localhost:8000/api';   // Python FastAPI (chat, events, recs)
    const CHATBOT_URL = '/html/chatbot.html';           // Trang chatbot đầy đủ

    /* Dwell-time config */
    const DWELL_TRIGGER_MS    = 4000;   // Xem 4 giây → log event + gọi recs
    const DWELL_STRONG_MS     = 8000;   // Xem 8 giây → mở drawer tự động
    const DWELL_POLL_MS       = 300;    // Kiểm tra mỗi 300ms
    const DWELL_DRAWER_LIMIT  = 8;      // Tối đa 8 sản phẩm trong drawer

    /* ══════════════════════════════════════════════════════
       STATE
    ══════════════════════════════════════════════════════ */
    // Session token — dùng chung với Python backend để nhận diện user
    let sessionToken = localStorage.getItem('ai_session_token');
    if (!sessionToken) {
        sessionToken = 'sess-' + Math.random().toString(36).slice(2) + Date.now();
        localStorage.setItem('ai_session_token', sessionToken);
    }

    // User ID từ localStorage (sau khi đăng nhập qua Node.js)
    function getUserId() {
        try {
            const u = JSON.parse(localStorage.getItem('user') || '{}');
            return u.id || null;
        } catch { return null; }
    }

    // Dwell tracking state
    const dwellMap = new Map(); // product_id → { startMs, el, logged4s, logged8s }
    let dwellObserver = null;   // IntersectionObserver

    // Chat state
    let chatOpen = false;
    const chatHistory = []; // { role, content }

    /* ══════════════════════════════════════════════════════
       UTILITY
    ══════════════════════════════════════════════════════ */
    function fmt(n) {
        return Number(n).toLocaleString('vi-VN') + 'đ';
    }

    function toast(msg, icon = '✨') {
        let el = document.getElementById('aiToast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'aiToast';
            el.className = 'ai-toast';
            document.body.appendChild(el);
        }
        el.innerHTML = `<span class="toast-icon">${icon}</span>${msg}`;
        el.classList.add('show');
        clearTimeout(el._t);
        el._t = setTimeout(() => el.classList.remove('show'), 2800);
    }

    /* ══════════════════════════════════════════════════════
       1. DWELL-TIME TRACKER
    ══════════════════════════════════════════════════════ */

    /** Bắt đầu theo dõi tất cả .product-card trong DOM */
    function initDwellTracker() {
        // Dùng IntersectionObserver để biết card có đang trên màn hình không
        dwellObserver = new IntersectionObserver(onIntersect, {
            threshold: 0.5  // ≥50% card hiện trên màn hình
        });

        attachDwellToCards();

        // Re-attach khi có card mới load (lazy render)
        const gridEl = document.getElementById('dishGrid') || document.getElementById('trendingGrid');
        if (gridEl) {
            const mo = new MutationObserver(() => attachDwellToCards());
            mo.observe(gridEl, { childList: true });
        }
    }

    function attachDwellToCards() {
        document.querySelectorAll('.product-card').forEach(card => {
            if (card.dataset.dwellAttached) return; // đã attach rồi
            card.dataset.dwellAttached = '1';
            card.style.position = 'relative'; // cần cho progress bar

            // Thêm progress bar dwell
            const wrap = document.createElement('div');
            wrap.className = 'dwell-progress-wrap';
            const fill = document.createElement('div');
            fill.className = 'dwell-progress-fill';
            wrap.appendChild(fill);
            card.appendChild(wrap);

            dwellObserver.observe(card);
        });
    }

    function onIntersect(entries) {
        entries.forEach(entry => {
            const card = entry.target;
            const pid  = parseInt(card.dataset.productId || card.querySelector('[data-product-id]')?.dataset.productId
                               || card.getAttribute('data-id') || '0', 10);

            if (!pid) return; // card chưa có product id

            if (entry.isIntersecting) {
                // Bắt đầu đếm thời gian
                dwellMap.set(pid, {
                    startMs:  Date.now(),
                    el:       card,
                    logged4s: false,
                    logged8s: false
                });
                startDwellTimer(pid);
            } else {
                // Rời khỏi viewport → dừng
                stopDwellTimer(pid);
            }
        });
    }

    const dwellTimers = new Map(); // pid → intervalId

    function startDwellTimer(pid) {
        if (dwellTimers.has(pid)) return;
        const interval = setInterval(() => tickDwell(pid), DWELL_POLL_MS);
        dwellTimers.set(pid, interval);
    }

    function stopDwellTimer(pid) {
        const id = dwellTimers.get(pid);
        if (id) {
            clearInterval(id);
            dwellTimers.delete(pid);
        }
        dwellMap.delete(pid);

        // Reset progress bar
        const state = dwellMap.get(pid);
        if (state) {
            const fill = state.el.querySelector('.dwell-progress-fill');
            if (fill) fill.style.width = '0%';
        }
    }

    function tickDwell(pid) {
        const state = dwellMap.get(pid);
        if (!state) { stopDwellTimer(pid); return; }

        const elapsed = Date.now() - state.startMs;

        // Update progress bar (8s = 100%)
        const pct = Math.min((elapsed / DWELL_STRONG_MS) * 100, 100);
        const fill = state.el.querySelector('.dwell-progress-fill');
        if (fill) fill.style.width = pct + '%';

        // 4 giây: log event nhẹ + gọi recommendations ngầm
        if (!state.logged4s && elapsed >= DWELL_TRIGGER_MS) {
            state.logged4s = true;
            const seconds = Math.floor(elapsed / 1000);
            logDwellEvent(pid, 'view_duration', String(seconds));
            prefetchRelated(pid); // gọi ngầm để cache
        }

        // 8 giây: mở drawer + ripple effect
        if (!state.logged8s && elapsed >= DWELL_STRONG_MS) {
            state.logged8s = true;
            logDwellEvent(pid, 'view_duration', '8');
            addDwellRipple(state.el);
            openRelatedDrawer(pid, state.el);
            toast('👀 Đang xem lâu? Mình tìm sản phẩm tương tự cho bạn!', '🔍');
        }
    }

    function addDwellRipple(el) {
        const ripple = document.createElement('div');
        ripple.className = 'dwell-ripple';
        el.appendChild(ripple);
        setTimeout(() => ripple.remove(), 1000);
    }

    /* Gửi event lên Python FastAPI */
    async function logDwellEvent(productId, eventType, value = null) {
        try {
            await fetch(`${PYTHON_API}/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id:  sessionToken,
                    user_id:     getUserId(),
                    product_id:  productId,
                    event_type:  eventType,
                    value:       value
                })
            });
        } catch (e) {
            // Silent fail — không làm gián đoạn UX
        }
    }

    /* Cache sẵn recommendations để drawer mở nhanh */
    const recsCache = new Map();

    async function prefetchRelated(productId) {
        if (recsCache.has(productId)) return;
        try {
            const url = `${PYTHON_API}/recommendations?session_token=${sessionToken}&user_id=${getUserId() || ''}&limit=${DWELL_DRAWER_LIMIT}`;
            const res  = await fetch(url);
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                recsCache.set(productId, data);
            }
        } catch (e) { /* silent */ }
    }

    /* Mở Related Products Drawer */
    async function openRelatedDrawer(productId, triggerEl) {
        const drawer = document.getElementById('relatedDrawer');
        if (!drawer) return;

        // Cập nhật dwell bar trong header
        const dwellFill = drawer.querySelector('.dwell-fill');
        if (dwellFill) dwellFill.style.width = '100%';

        // Lấy tên sản phẩm trigger
        const triggerName = triggerEl.querySelector('.product-card__name')?.textContent || 'sản phẩm này';
        const infoEl = drawer.querySelector('.drawer-trigger-info span');
        if (infoEl) infoEl.textContent = `Vì bạn xem: ${triggerName.slice(0, 28)}...`;

        // Load products
        const productsEl = drawer.querySelector('.drawer-products');
        productsEl.innerHTML = `<div style="padding:20px;color:#8aadaa;font-size:.8rem;">Đang tải...</div>`;

        drawer.classList.add('open');

        let recs = recsCache.get(productId);
        if (!recs) {
            await prefetchRelated(productId);
            recs = recsCache.get(productId) || [];
        }

        // Fallback: lấy từ Node API nếu Python không có
        if (!recs || recs.length === 0) {
            recs = await fetchNodeRelated(productId);
        }

        renderDrawerProducts(productsEl, recs, productId);
    }

    /** Fallback: lấy sản phẩm liên quan từ Node.js (cùng category) */
    async function fetchNodeRelated(productId) {
        try {
            const resP = await fetch(`${NODE_API}/products/${productId}`);
            if (!resP.ok) throw new Error();
            const p    = await resP.json();
            const cat  = p.category || '';

            const resAll = await fetch(`${NODE_API}/products?category=${encodeURIComponent(cat)}`);
            const all    = await resAll.json();
            return all.filter(x => x.id !== productId).slice(0, DWELL_DRAWER_LIMIT);
        } catch { return []; }
    }

    function renderDrawerProducts(container, products, excludeId) {
        container.innerHTML = '';

        const list = products.filter(p => p.id !== excludeId).slice(0, DWELL_DRAWER_LIMIT);

        if (list.length === 0) {
            container.innerHTML = `<p style="color:#8aadaa;font-size:.8rem;padding:20px;">Chưa có gợi ý phù hợp. Hãy khám phá thêm nhé!</p>`;
            return;
        }

        list.forEach(p => {
            const card = document.createElement('div');
            card.className = 'drawer-product-card';

            const img       = p.img || p.image_url || '';
            const price     = p.price || 0;
            const oldPrice  = p.old_price || p.sale_price || null;
            const name      = p.name || 'Sản phẩm';

            card.innerHTML = `
                <img src="${img}" alt="${name}" loading="lazy" onerror="this.src='https://via.placeholder.com/140x110?text=SP'">
                <div class="drawer-card-body">
                    <div class="drawer-card-name">${name}</div>
                    <div>
                        <span class="drawer-card-price">${fmt(price)}</span>
                        ${oldPrice && oldPrice > price ? `<span class="drawer-card-old-price">${fmt(oldPrice)}</span>` : ''}
                    </div>
                    <button class="drawer-card-btn">Xem ngay →</button>
                </div>
            `;

            card.addEventListener('click', () => {
                // Log click event
                logDwellEvent(p.id, 'view_product');
                window.location.href = `/html/dish-detail.html?id=${p.id}`;
            });

            container.appendChild(card);
        });
    }

    /** Đặt product_id lên card khi render (cần patch createProductCard) */
    function patchProductCards() {
        // Hook vào window.createProductCard nếu có, hoặc dùng MutationObserver
        const origFn = window.createProductCard;
        if (typeof origFn === 'function') {
            window.createProductCard = function (product) {
                const card = origFn(product);
                if (card && product.id) {
                    card.dataset.productId = product.id;
                }
                return card;
            };
        }

        // Fallback: quan sát DOM và gắn id dựa trên onclick href
        const observer = new MutationObserver(() => {
            document.querySelectorAll('.product-card:not([data-product-id])').forEach(card => {
                const href = card.onclick?.toString().match(/id=(\d+)/)?.[1]
                          || card.querySelector('a')?.href.match(/id=(\d+)/)?.[1];
                if (href) card.dataset.productId = href;
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    /* ══════════════════════════════════════════════════════
       2. MINI CHAT BUBBLE
    ══════════════════════════════════════════════════════ */

    function buildChatUI() {
        // Bubble button
        const bubble = document.createElement('div');
        bubble.id = 'aiChatBubble';
        bubble.innerHTML = `
            <div class="ai-chat-panel hidden" id="aiChatPanel">
                <div class="ai-chat-header">
                    <div class="ai-avatar">🤖</div>
                    <div class="ai-name">
                        <strong>Trợ lý AI STDShop</strong>
                        <span>Tư vấn mua sắm thông minh</span>
                    </div>
                    <div class="ai-status-dot"></div>
                    <button class="ai-fullchat-btn" id="goFullChat" title="Mở chatbot đầy đủ">Chat đầy đủ ↗</button>
                </div>
                <div class="ai-messages" id="aiMessages">
                    <div class="ai-msg">
                        <div class="msg-bubble">Chào bạn! 👋 Mình có thể giúp bạn tìm sản phẩm phù hợp. Hỏi mình bất cứ điều gì nhé!</div>
                    </div>
                </div>
                <div class="ai-chat-input-bar">
                    <input type="text" id="aiChatInput" placeholder="Nhập câu hỏi...">
                    <button class="ai-chat-send-btn" id="aiSendBtn">➤</button>
                </div>
            </div>
            <button class="ai-bubble-btn" id="aiBubbleToggle" title="Chat với AI">
                🤖
                <span class="bubble-notif" id="bubbleNotif">1</span>
            </button>
        `;
        document.body.appendChild(bubble);

        // Show welcome notif
        setTimeout(() => {
            const notif = document.getElementById('bubbleNotif');
            if (notif) notif.classList.add('show');
        }, 2500);

        // Event handlers
        document.getElementById('aiBubbleToggle').addEventListener('click', toggleChat);
        document.getElementById('aiSendBtn').addEventListener('click', sendChat);
        document.getElementById('aiChatInput').addEventListener('keydown', e => {
            if (e.key === 'Enter') sendChat();
        });
        document.getElementById('goFullChat').addEventListener('click', () => {
            window.location.href = CHATBOT_URL;
        });
    }

    function toggleChat() {
        chatOpen = !chatOpen;
        const panel  = document.getElementById('aiChatPanel');
        const toggle = document.getElementById('aiBubbleToggle');
        const notif  = document.getElementById('bubbleNotif');

        if (chatOpen) {
            panel.classList.remove('hidden');
            toggle.textContent = '✕';
            if (notif) notif.classList.remove('show');
        } else {
            panel.classList.add('hidden');
            toggle.innerHTML = '🤖<span class="bubble-notif" id="bubbleNotif"></span>';
        }
    }

    function appendMsg(role, html) {
        const container = document.getElementById('aiMessages');
        if (!container) return;

        const wrap = document.createElement('div');
        wrap.className = `ai-msg ${role}`;
        const bubble = document.createElement('div');
        bubble.className = 'msg-bubble';
        bubble.innerHTML = html;
        wrap.appendChild(bubble);
        container.appendChild(wrap);
        container.scrollTop = container.scrollHeight;
    }

    function showTyping() {
        const container = document.getElementById('aiMessages');
        if (!container) return null;
        const wrap = document.createElement('div');
        wrap.className = 'ai-msg';
        wrap.innerHTML = `<div class="ai-typing"><span></span><span></span><span></span></div>`;
        container.appendChild(wrap);
        container.scrollTop = container.scrollHeight;
        return wrap;
    }

    async function sendChat() {
        const input = document.getElementById('aiChatInput');
        const query = input.value.trim();
        if (!query) return;

        input.value = '';
        appendMsg('user', query);
        chatHistory.push({ role: 'user', content: query });

        const typingEl = showTyping();

        try {
            const res = await fetch(`${PYTHON_API}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query:         query,
                    user_id:       getUserId(),
                    session_token: sessionToken
                })
            });

            let fullText      = '';
            let productLinks  = [];
            let retrievedData = [];

            if (res.headers.get('content-type')?.includes('text/event-stream')) {
                // SSE streaming response
                const reader = res.body.getReader();
                const dec    = new TextDecoder();
                let buf      = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buf += dec.decode(value, { stream: true });

                    const lines = buf.split('\n\n');
                    buf = lines.pop() || '';

                    for (const line of lines) {
                        if (!line.startsWith('data:')) continue;
                        try {
                            const evt = JSON.parse(line.slice(5).trim());
                            if (evt.type === 'metadata') {
                                retrievedData = evt.retrieved || [];
                                productLinks  = [];
                            } else if (evt.type === 'text') {
                                fullText += evt.content;
                            }
                        } catch { /* skip malformed */ }
                    }
                }
            } else {
                // Plain JSON response
                const data    = await res.json();
                fullText      = data.answer || '';
                productLinks  = data.product_links || [];
                retrievedData = data.retrieved || [];
            }

            // Parse inline product links từ markdown [Name](product_id:XX)
            productLinks = [];
            const linkRx = /\[([^\]]+)\]\(product_id:(\d+)\)/g;
            let m;
            const cleanText = fullText.replace(linkRx, (_, name, id) => {
                productLinks.push({ name: name.replace(/\*/g, '').trim(), product_id: parseInt(id) });
                return `<a class="ai-product-pill" href="/html/dish-detail.html?id=${id}">🛍 ${name.replace(/\*/g, '').trim()}</a>`;
            }).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
              .replace(/\n/g, '<br>');

            if (typingEl) typingEl.remove();
            appendMsg('', cleanText);

            // Đẩy sản phẩm gợi ý lên drawer nếu có nhiều hơn 2 sản phẩm
            if (retrievedData.length > 2) {
                const key = 'chat_' + Date.now();
                recsCache.set(key, retrievedData);
            }

            chatHistory.push({ role: 'assistant', content: fullText });

        } catch (err) {
            if (typingEl) typingEl.remove();
            appendMsg('', '⚠️ Không thể kết nối AI. Vui lòng thử lại sau.');
        }
    }

    /* ══════════════════════════════════════════════════════
       3. HERO AI CHIPS + SEARCH ENHANCEMENT
    ══════════════════════════════════════════════════════ */

    const QUICK_QUERIES = [
        'Vòng tay bạc dưới 200k 💍',
        'Phụ kiện tóc dễ thương 🌸',
        'Nhẫn titan cá tính ⚡',
        'Quà tặng sinh nhật 🎁',
        'Bông tai ngọc trai ✨'
    ];

    function buildHeroAIHint() {
        const heroSearch = document.querySelector('.hero-search-box');
        if (!heroSearch) return;

        // Hint dòng "Chat với AI"
        const hint = document.createElement('div');
        hint.className = 'hero-ai-hint';
        hint.innerHTML = `<span>✨ Hoặc</span> <strong id="heroOpenChat">chat với AI để tư vấn miễn phí</strong>`;
        heroSearch.insertAdjacentElement('afterend', hint);

        document.getElementById('heroOpenChat').addEventListener('click', () => {
            if (!chatOpen) toggleChat();
            const panel = document.getElementById('aiChatPanel');
            if (panel) panel.classList.remove('hidden');
            chatOpen = true;
            setTimeout(() => document.getElementById('aiChatInput')?.focus(), 100);
        });

        // Quick query chips
        const chips = document.createElement('div');
        chips.className = 'hero-ai-chips';
        QUICK_QUERIES.forEach(q => {
            const chip = document.createElement('button');
            chip.className = 'ai-chip';
            chip.textContent = q;
            chip.addEventListener('click', () => {
                // Nhét vào hero search input
                const heroInput = document.getElementById('heroSearchInput');
                if (heroInput) heroInput.value = q.replace(/[^\w\sÀ-ỹ]/gu, '').trim();

                // Đồng thời gửi tới AI chat
                if (!chatOpen) toggleChat();
                const chatInput = document.getElementById('aiChatInput');
                if (chatInput) {
                    chatInput.value = q.replace(/[^\w\sÀ-ỹ]/gu, '').trim();
                    sendChat();
                }
            });
            chips.appendChild(chip);
        });
        heroSearch.insertAdjacentElement('afterend', chips);
        hint.insertAdjacentElement('afterend', chips); // chips ở giữa hint
    }

    /* ══════════════════════════════════════════════════════
       4. RELATED PRODUCTS DRAWER (DOM)
    ══════════════════════════════════════════════════════ */

    function buildRelatedDrawer() {
        const drawer = document.createElement('div');
        drawer.id = 'relatedDrawer';
        drawer.innerHTML = `
            <div class="drawer-handle"></div>
            <div class="drawer-header">
                <div class="drawer-title">
                    <h3>🔍 Sản Phẩm Liên Quan</h3>
                    <span class="drawer-badge">GỢI Ý THÔNG MINH</span>
                </div>
                <div style="display:flex;align-items:center;gap:10px;">
                    <div class="drawer-trigger-info">
                        <span>Dựa trên lịch sử của bạn</span>
                        <div class="dwell-bar"><div class="dwell-fill"></div></div>
                    </div>
                    <button class="drawer-close-btn" id="closeDrawerBtn">✕</button>
                </div>
            </div>
            <div class="drawer-products" id="drawerProducts"></div>
        `;
        document.body.appendChild(drawer);

        document.getElementById('closeDrawerBtn').addEventListener('click', () => {
            drawer.classList.remove('open');
        });
    }

    /* ══════════════════════════════════════════════════════
       INIT
    ══════════════════════════════════════════════════════ */
    function init() {
        // Build DOM elements
        buildRelatedDrawer();
        buildChatUI();
        buildHeroAIHint();

        // Patch createProductCard để có data-product-id
        patchProductCards();

        // Khởi động dwell tracker sau khi products đã render
        // (đợi 1.5s để page load xong)
        setTimeout(initDwellTracker, 1500);

        // Re-attach dwell mỗi 5s để bắt kịp lazy load
        setInterval(attachDwellToCards, 5000);

        console.log('🤖 AI Widget (STDShop) đã khởi động. Session:', sessionToken);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
