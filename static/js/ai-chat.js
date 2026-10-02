/* ============================================================
   AI CHAT WIDGET - STDShop (thiết kế mới hoàn toàn)
   Nối với API thật: POST /api/chat/  (views.chat_ai - Groq)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    const widget    = document.getElementById('aiChatWidget');
    const bubbleBtn = document.getElementById('aiChatBubbleBtn');
    const panel     = document.getElementById('aiChatPanel');
    const expandBtn = document.getElementById('aiExpandBtn');
    const closeBtn  = document.getElementById('aiCloseBtn');
    const messagesEl = document.getElementById('aiChatMessages');
    const input     = document.getElementById('aiChatInput');
    const sendBtn   = document.getElementById('aiSendBtn');

    // Trang nào ẩn site_footer (VD các trang /landing/...) sẽ không có các
    // phần tử này - thoát sớm, không báo lỗi.
    if (!widget || !bubbleBtn || !panel || !messagesEl || !input || !sendBtn) return;

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }
    const csrftoken = getCookie('csrftoken');

    // Lịch sử hội thoại gửi kèm mỗi request để AI nhớ ngữ cảnh - chỉ là biến
    // JS bình thường nên KHÔNG bị mất khi phóng to/thu nhỏ (chỉ đổi CSS, DOM
    // #aiChatMessages không hề bị xóa/tạo lại).
    let chatHistory = [];

    function formatVND(n) { return (n || 0).toLocaleString('vi-VN') + 'đ'; }

    function scrollToBottom() {
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function showGreetingIfNeeded() {
        if (messagesEl.children.length === 0) {
            const bubble = document.createElement('div');
            bubble.className = 'ai-msg bot';
            bubble.textContent = 'Xin chào! 👋 Mình là STDShop AI. Mình có thể giúp bạn tìm sản phẩm hoặc trả lời thắc mắc nhé!';
            messagesEl.appendChild(bubble);
        }
    }

    function appendUserBubble(text) {
        const bubble = document.createElement('div');
        bubble.className = 'ai-msg user';
        bubble.textContent = text;
        messagesEl.appendChild(bubble);
        scrollToBottom();
    }

    // ===== HIỆU ỨNG "ĐANG SUY NGHĨ" =====
    function showThinking() {
        const el = document.createElement('div');
        el.className = 'ai-thinking';
        el.id = 'aiThinkingIndicator';
        el.innerHTML = '<span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span>';
        messagesEl.appendChild(el);
        scrollToBottom();
        sendBtn.disabled = true;
        input.disabled = true;
    }
    function removeThinking() {
        const el = document.getElementById('aiThinkingIndicator');
        if (el) el.remove();
        sendBtn.disabled = false;
        input.disabled = false;
        input.focus();
    }

    // ===== HIỆU ỨNG ẢNH SẢN PHẨM (shimmer lúc tải -> fade in khi xong) =====
    function renderProducts(bubble, products) {
        if (!products || products.length === 0) return;

        const list = document.createElement('div');
        list.className = 'ai-product-list';

        products.forEach(p => {
            const a = document.createElement('a');
            a.href = `/detail/?id=${p.id}`;
            a.className = 'ai-product-card';
            a.innerHTML = `
                <div class="ai-img-wrap">
                    <img alt="${p.name}">
                </div>
                <div class="ai-product-info">
                    <div class="ai-product-name">${p.name}</div>
                    <div class="ai-product-price">${formatVND(p.price)}</div>
                </div>
            `;
            list.appendChild(a);

            const wrap = a.querySelector('.ai-img-wrap');
            const img = a.querySelector('img');

            const markLoaded = () => { img.classList.add('loaded'); wrap.classList.add('loaded'); };
            img.addEventListener('load', markLoaded);
            img.addEventListener('error', markLoaded); // ảnh lỗi cũng bỏ shimmer, tránh treo mãi
            img.src = p.image || ''; // gán sau khi gắn listener để không bỏ lỡ sự kiện load (ảnh cache)
        });

        bubble.appendChild(list);
        scrollToBottom();
    }

    // ===== HIỆU ỨNG GÕ CHỮ (TYPEWRITER) =====
    function typewriterBotMessage(text, products) {
        const bubble = document.createElement('div');
        bubble.className = 'ai-msg bot';

        const textSpan = document.createElement('span');
        const cursor = document.createElement('span');
        cursor.className = 'ai-typing-cursor';

        bubble.appendChild(textSpan);
        bubble.appendChild(cursor);
        messagesEl.appendChild(bubble);
        scrollToBottom();

        const chars = Array.from(text || '');
        // Tổng thời gian gõ tối đa ~1.8s dù tin nhắn dài hay ngắn, để trải
        // nghiệm không bị quá chậm với các câu trả lời dài.
        const totalDuration = Math.min(1800, Math.max(300, chars.length * 16));
        const stepDelay = chars.length ? totalDuration / chars.length : 0;

        let i = 0;
        function typeNext() {
            if (i < chars.length) {
                textSpan.textContent += chars[i];
                i++;
                scrollToBottom();
                setTimeout(typeNext, stepDelay);
            } else {
                cursor.remove();
                renderProducts(bubble, products);
            }
        }
        if (chars.length === 0) {
            cursor.remove();
            renderProducts(bubble, products);
        } else {
            typeNext();
        }
    }

    // ===== GỬI TIN NHẮN =====
    function sendMessage() {
        const text = input.value.trim();
        if (!text || sendBtn.disabled) return;

        appendUserBubble(text);
        input.value = '';
        showThinking();

        fetch('/api/chat/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
            body: JSON.stringify({ message: text, history: chatHistory })
        })
            .then(res => res.json())
            .then(data => {
                removeThinking();
                if (data.status === 'success') {
                    chatHistory.push({ role: 'user', content: text });
                    chatHistory.push({ role: 'assistant', content: data.reply });
                    typewriterBotMessage(data.reply, data.products || []);
                } else {
                    typewriterBotMessage(data.message || 'AI đang bận, vui lòng thử lại sau nhé!', []);
                }
            })
            .catch(() => {
                removeThinking();
                typewriterBotMessage('Không thể kết nối tới máy chủ. Vui lòng thử lại sau.', []);
            });
    }

    // ===== MỞ / ĐÓNG =====
    bubbleBtn.addEventListener('click', () => {
        widget.classList.toggle('open');
        if (widget.classList.contains('open')) {
            showGreetingIfNeeded();
            input.focus();
        }
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => widget.classList.remove('open'));
    }

    // ===== PHÓNG TO / THU NHỎ =====
    // Chỉ toggle class CSS - không đụng tới #aiChatMessages nên lịch sử chat
    // (cả trong DOM lẫn biến chatHistory) được giữ nguyên hoàn toàn.
    if (expandBtn) {
        expandBtn.addEventListener('click', () => {
            const isExpanded = panel.classList.toggle('expanded');
            const icon = expandBtn.querySelector('i');
            if (isExpanded) {
                icon.classList.remove('fa-expand-alt');
                icon.classList.add('fa-compress-alt');
                expandBtn.title = 'Thu nhỏ';
            } else {
                icon.classList.remove('fa-compress-alt');
                icon.classList.add('fa-expand-alt');
                expandBtn.title = 'Phóng to';
            }
            scrollToBottom();
        });
    }

    // ===== GỬI BẰNG NÚT / PHÍM ENTER =====
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });
});
