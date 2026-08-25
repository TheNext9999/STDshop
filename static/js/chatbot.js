/**
 * AURA AI — FRONTEND CONTROLLER & BEHAVIOR TRACKING ENGINE
 * State manager, event listeners, dwell-time logs, cart synchronization,
 * chatbot reasoning client, dynamic HUD debugging console.
 */

// Global State
const API_BASE = "http://127.0.0.1:8000";
let activeUser = null; // Cập nhật khi switch persona
let activeSessionToken = localStorage.getItem("aura_session_token");
if (!activeSessionToken) {
    activeSessionToken = "session-" + uuidv4();
    localStorage.setItem("aura_session_token", activeSessionToken);
}

/**
 * Điều hướng đến trang chi tiết thật của sản phẩm/listing.
 * (chatbot.html đang nằm trong thư mục html/, nên dish-detail.html
 * và listing-detail.html — cùng thư mục — chỉ cần đường dẫn tương đối,
 * KHÔNG có tiền tố "html/" để tránh bị nhân đôi thành html/html/...)
 * - Sản phẩm shop (bảng products, id không prefix hoặc prefix "p"):
 *   -> dish-detail.html?id=ID
 * - Listing thanh lý (prefix "l"):
 *   -> listing-detail.html?id=ID
 * @param {string|number} rawId Có thể là số thuần (5) hoặc có prefix ("p_5", "l_5")
 */
function goToProductDetail(rawId) {
    const idStr = String(rawId);
    const match = idStr.match(/^(p|l)_(\d+)$/);
    const source = match ? match[1] : "p";
    const id = match ? match[2] : idStr;

    // Lấy đường dẫn thư mục hiện tại (vd: /html/) dựa vào URL đang chạy,
    // để tránh bị nhân đôi "html/html/" dù trang được mở từ đâu
    const currentDir = window.location.pathname.substring(
        0,
        window.location.pathname.lastIndexOf("/") + 1
    );

    if (source === "l") {
        window.location.href = `${currentDir}listing-detail.html?id=${id}`;
    } else {
        window.location.href = `${currentDir}dish-detail.html?id=${id}`;
    }
}

// Variables for Dwell-Time & Scroll depth tracking
let activeDetailProductId = null;
let detailOpenedTime = null;
let detailMaxScrollDepth = 0;
let didReadReviews = false;

// HUD Debug logger utility
function logHUD(message, type = "system") {
    const logsContainer = document.getElementById("calc-hud-logs");
    if (!logsContainer) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const item = document.createElement("p");
    item.className = `hud-item ${type}`;
    item.innerText = `[${timestamp}] ${message}`;
    
    logsContainer.appendChild(item);
    logsContainer.scrollTop = logsContainer.scrollHeight;
}

// v4 UUID Generator helper
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Formatter for currency
function formatVND(amount) {
    return parseInt(amount).toLocaleString('vi-VN') + 'đ';
}

// DOMContentLoaded Entrypoint
document.addEventListener("DOMContentLoaded", async () => {
    logHUD("Khoi tao he thong client AURA AI...", "system");
    
    // 1. Load active Users list
    await loadUsers();
    
    // Set default User Persona (Cold Start)
    await switchActivePersona("cold_start");
    
    // 2. Load catalog product listings
    await loadCatalog("all");
    
    // 3. Register Global DOM Events
    registerDOMEvents();
});

// Load Users from backend
async function loadUsers() {
    try {
        const res = await fetch(API_BASE + "/api/users");
        const users = await res.json();
        // Lấy Nguyễn Văn A (ID=1) làm user mặc định ban đầu
        if (users && users.length > 0) {
            activeUser = users[0];
            logHUD(`Nap danh sach users. User mac dinh: ${activeUser.name}`, "system");
        }
    } catch (e) {
        logHUD(`Loi nap danh sach users: ${e.message}`, "system");
    }
}

// Register DOM Event Listeners
function registerDOMEvents() {
    // Top Simulator Buttons
    const simBtns = document.querySelectorAll(".sim-btn");
    simBtns.forEach(btn => {
        btn.addEventListener("click", async (e) => {
            simBtns.forEach(b => b.classList.remove("active"));
            const currentBtn = e.currentTarget;
            currentBtn.classList.add("active");
            
            const persona = currentBtn.dataset.persona;
            await switchActivePersona(persona);
        });
    });

    // Chatbot send button and input
    const sendChatBtn = document.getElementById("send-chat-btn");
    const chatInput = document.getElementById("chat-input-field");
    
    sendChatBtn.addEventListener("click", handleChatSend);
    chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleChatSend();
    });

    // Cart overlay toggle
    const openCartBtn = document.getElementById("open-cart-btn");
    const closeCartBtn = document.getElementById("close-cart-btn");
    const cartOverlayBg = document.getElementById("cart-sidebar-overlay-bg");
    const cartSidebar = document.getElementById("cart-sidebar-container");

    openCartBtn.addEventListener("click", () => cartSidebar.classList.add("open"));
    closeCartBtn.addEventListener("click", () => cartSidebar.classList.remove("open"));
    cartOverlayBg.addEventListener("click", () => cartSidebar.classList.remove("open"));

    // Catalog category tabs
    const tabBtns = document.querySelectorAll(".tab-btn");
    tabBtns.forEach(tab => {
        tab.addEventListener("click", async (e) => {
            tabBtns.forEach(t => t.classList.remove("active"));
            e.currentTarget.classList.add("active");
            const cat = e.currentTarget.dataset.cat;
            await loadCatalog(cat);
        });
    });

    // Checkout Simulation Action
    const checkoutActionBtn = document.getElementById("checkout-action-btn");
    checkoutActionBtn.addEventListener("click", handleSimulatedCheckout);

    // Detail Modal Overlay closes details
    const modalOverlay = document.getElementById("product-detail-overlay");
    const closeModalBtn = document.getElementById("close-detail-modal-btn");
    modalOverlay.addEventListener("click", closeProductDetailModal);
    closeModalBtn.addEventListener("click", closeProductDetailModal);

    // Debug HUD Toggle Minimize
    const hudContainer = document.getElementById("calc-hud-hud");
    const toggleHudBtn = document.getElementById("toggle-hud-btn");
    
    toggleHudBtn.addEventListener("click", () => {
        hudContainer.classList.toggle("minimized");
        if (hudContainer.classList.contains("minimized")) {
            toggleHudBtn.innerText = "＋";
        } else {
            toggleHudBtn.innerText = "✕";
        }
    });
}


// ==========================================================================
// PERSONA SWAPPER & BEHAVIOR SIMULATION CLIENT
// ==========================================================================
async function switchActivePersona(persona) {
    if (!activeUser) return;
    
    logHUD(`Chuyen doi Persona sang: ${persona.toUpperCase()}...`, "system");
    document.getElementById("chat-typing-indicator").classList.remove("hidden");
    
    try {
        const res = await fetch(API_BASE + "/api/simulate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                persona: persona,
                user_id: activeUser.id,
                session_id: activeSessionToken
            })
        });
        
        const data = await res.json();
        if (data.status === "success") {
            const ctx = data.new_context;
            
            // Cập nhật giao diện Display
            updatePersonalizationHUD(ctx, persona);
            
            // Tải lại Cart & Recommendations
            await refreshCartAndBadge();
            await refreshRecommendations();
            
            // Xóa sạch lịch sử chat cũ khi đổi persona để kiểm nghiệm RAG mới tinh
            const chatLog = document.getElementById("chat-log-container");
            chatLog.innerHTML = "";
            
            let greeting = "";
            if (persona === "cold_start") {
                greeting = `Chào bạn! Mình là Trợ lý Mua sắm thông minh của UNI Mart. Mình có thể giúp bạn tìm kiếm khuyên tai, lắc tay, nhẫn thời trang phù hợp hoặc so sánh các mẫu mã theo tầm giá và chất liệu nè. Hôm nay bạn muốn tìm phụ kiện gì thế? 😊`;
            } else if (persona === "session_only") {
                greeting = `Chào bạn Trần Thị B! Mình thấy bạn vừa lướt xem các mẫu [Nhẫn titan xích xoay](product_id:27) cá tính và [Nhẫn hở mặt cười retro](product_id:29) độc đáo của shop. Bạn có cần mình so sánh chất liệu hay tư vấn ni tay của hai chiếc nhẫn này không nè?`;
            } else if (persona === "cart_only") {
                greeting = `Chào bạn Lê Văn C! Giỏ hàng của bạn đang có mẫu [Kẹp tóc càng cua mạ vàng hoa hồng](product_id:33) và [Set 5 buộc tóc Scrunchie lụa](product_id:35). Mình gợi ý bạn phối thêm các mẫu Bông tai hoặc lắc tay đính hoa hồng để làm set phụ kiện thêm đồng điệu nhé! Bạn muốn xem mẫu nào nè?`;
            } else if (persona === "purchase_history") {
                greeting = `Chào mừng khách hàng quen thuộc Phạm Thị D quay trở lại! Cảm ơn bạn đã mua các sản phẩm ngọc trai của shop trước đó. Hôm nay shop vừa về thêm mẫu [Vòng tay ngọc trai nhân tạo sang trọng](product_id:6) khóa bạc 925 cực kỳ phù hợp phối cùng đôi bông tai ngọc trai của bạn đó. Để mình giới thiệu chi tiết cho bạn nha!`;
            } else if (persona === "hybrid") {
                greeting = `Kính chào VIP Hoàng Văn E! Mình thấy bạn đã mua kính phi công mạ vàng sang chảnh, đồng thời đang thêm [Nhẫn tỳ hưu xanh ngọc](product_id:31) vào giỏ hàng. Đặc biệt bạn vừa click xem [Vòng tay trầm hương](product_id:7) phong thủy. Bạn có muốn mình tư vấn sự kết hợp may mắn tài lộc giữa nhẫn ngọc cẩm thạch và vòng tay trầm kiến nguyên khối không?`;
            }
            
            appendChatBubble(greeting, "assistant");
            logHUD(`Nap du lieu gia lap thanh cong. User segment: ${ctx.segment}`, "success");
        }
    } catch (e) {
        logHUD(`Loi khi gia lap Persona: ${e.message}`, "danger");
    } finally {
        document.getElementById("chat-typing-indicator").classList.add("hidden");
    }
}

// Update Personalization HUD Display Card
function updatePersonalizationHUD(ctx, persona) {
    // 1. Name badge header
    const pNames = {
        cold_start: "Khách Mới tinh (Nguyễn Văn A)",
        session_only: "Lướt xem (Trần Thị B)",
        cart_only: "Đang có Giỏ hàng (Lê Văn C)",
        purchase_history: "Khách quen / VIP (Phạm Thị D)",
        hybrid: "VIP Hybrid (Hoàng Văn E)"
    };
    document.getElementById("persona-name-display").innerText = pNames[persona] || "Khách Mới tinh";
    
    // 2. Personalization profile box
    document.getElementById("stat-segment").innerText = ctx.segment;
    
    // Segment color badge coding
    const segBadge = document.getElementById("stat-segment");
    segBadge.style.color = ctx.segment === "VIP" ? "var(--accent)" : (ctx.segment === "Active User" ? "var(--success)" : "var(--text-muted)");

    // Average spend formatting
    document.getElementById("stat-spend").innerText = ctx.avg_spend > 0 ? formatVND(ctx.avg_spend) : "0đ";
    
    // Favorite categories displaying
    document.getElementById("stat-fav").innerText = ctx.fav_categories.length > 0 ? ctx.fav_categories.join(", ") : "Chưa có";
    
    // Update Debug HUD Console
    logHUD(`[PERSONALIZATION STATE] Segment: ${ctx.segment} | Avg spend: ${ctx.avg_spend} | Fav: ${ctx.fav_categories.join(",")}`, "interest");
    
    if (ctx.interests.length > 0) {
        const activeIntList = ctx.interests.map(i => `${i.sub_category || i.category}(${i.score.toFixed(1)})`).join(", ");
        logHUD(`Interest Affinity: ${activeIntList}`, "interest");
    }
}


// ==========================================================================
// RAG CONVERSATIONAL SEARCH CLIENT
// ==========================================================================
async function handleChatSend() {
    const chatInput = document.getElementById("chat-input-field");
    const query = chatInput.value.trim();
    if (!query) return;

    chatInput.value = "";
    
    // Render user bubble
    appendChatBubble(query, "user");
    
    // Typing state on
    const typingIndicator = document.getElementById("chat-typing-indicator");
    typingIndicator.classList.remove("hidden");
    
    logHUD(`Gui chat query: "${query}"`, "event");

    let assistantMsgDiv = null;
    let assistantBubble = null;
    let accumulatedText = "";
    let retrievedProducts = [];

    try {
        const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout
const res = await fetch(API_BASE + "/api/chat", {
    signal: controller.signal,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query: query,
                user_id: activeUser ? activeUser.id : null,
                session_token: activeSessionToken
            })
        });
        
        if (!res.ok) {
            throw new Error(`Server error: ${res.status}`);
        }
        clearTimeout(timeout);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        const chatLog = document.getElementById("chat-log-container");

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            
            // Giữ lại phần dòng chưa hoàn chỉnh cuối cùng trong buffer
            buffer = lines.pop();
            
            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    const jsonStr = line.substring(6).trim();
                    if (!jsonStr) continue;
                    
                    try {
                        const data = JSON.parse(jsonStr);
                        
                        // ── 1. NHẬN METADATA BAN ĐẦU ──
                        if (data.type === "metadata") {
                            // Tắt typing indicator khi bắt đầu nhận dữ liệu
                            typingIndicator.classList.add("hidden");
                            
                            // Render bộ lọc tag
                            renderIntentBar(data.filters);
                            retrievedProducts = data.retrieved || [];
                            
                            // Tạo sẵn khung bong bóng chat cho AI
                            assistantMsgDiv = document.createElement("div");
                            assistantMsgDiv.className = "msg assistant";
                            assistantBubble = document.createElement("div");
                            assistantBubble.className = "msg-bubble";
                            assistantBubble.innerHTML = `<span style="color: var(--text-muted); font-style: italic;">UNI Mart AI đang suy nghĩ...</span>`;
                            assistantMsgDiv.appendChild(assistantBubble);
                            
                            chatLog.appendChild(assistantMsgDiv);
                            chatLog.scrollTop = chatLog.scrollHeight;
                        }
                        // ── 2. NHẬN TEXT STREAM Real-time ──
                        else if (data.type === "text") {
                            if (accumulatedText === "") {
                                assistantBubble.innerHTML = ""; // Xóa dòng chữ đang suy nghĩ
                            }
                            accumulatedText += data.content;
                            
                            // Tiến hành Parse Markdown thời gian thực (Bold, Italic, Link, Lists)
                            let parsedText = accumulatedText.replace(/\[([^\]]+)\]\(product_id:((?:p|l)_)?(\d+)\)/g, (match, name, prefix, id) => {
                                const fullId = (prefix || "p_") + id;
                                return `<a href="#" onclick="goToProductDetail('${fullId}'); return false;">${name}</a>`;
                            });
                            
                            parsedText = parsedText.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
                            parsedText = parsedText.replace(/\*([^*]+)\*/g, '<em>$1</em>');
                            
                            let textLines = parsedText.split('\n');
                            textLines = textLines.map(tLine => {
                                let trimmed = tLine.trim();
                                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                                    return `<div class="chat-list-item"><span class="bullet-dot">•</span><span>${trimmed.substring(2)}</span></div>`;
                                }
                                let numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
                                if (numMatch) {
                                    return `<div class="chat-list-item"><span class="bullet-num">${numMatch[1]}.</span><span>${numMatch[2]}</span></div>`;
                                }
                                return tLine;
                            });
                            parsedText = textLines.join('\n');
                            parsedText = parsedText.replace(/\n/g, "<br>");
                            
                            assistantBubble.innerHTML = parsedText;
                            chatLog.scrollTop = chatLog.scrollHeight;
                        }
                        // ── 3. HOÀN THÀNH STREAM ──
                        else if (data.type === "done") {
                            // Gắn danh sách sản phẩm mini bên dưới bong bóng
                            if (retrievedProducts && retrievedProducts.length > 0 && assistantMsgDiv) {
                                const prodGrid = document.createElement("div");
                                prodGrid.className = "chat-embedded-products";
                                
                                retrievedProducts.forEach(p => {
                                    const card = document.createElement("div");
                                    card.className = "emb-prod-card";
                                    
                                    const effPrice = p.sale_price && p.sale_price > 0 ? p.sale_price : p.price;
                                    const fullPid = (p.source === "listing" ? "l_" : "p_") + p.id;
                                    
                                    const imgSrc = p.image_url || p.img || 'https://placehold.co/80x80/eee/999?text=SP';
                                    card.innerHTML = `
                                        <img class="emb-prod-img" src="${imgSrc}" alt="${p.name || 'Sản phẩm'}" onerror="this.src='https://placehold.co/80x80/eee/999?text=SP'">
                                        <div class="emb-prod-info">
                                            <h4><a href="#" onclick="goToProductDetail('${fullPid}'); return false;">${p.name || 'Sản phẩm'}</a></h4>
                                            <p>${formatVND(effPrice)}</p>
                                        </div>
                                        <button class="emb-buy-btn" onclick="addToCartDirect(${p.id})">Mua ngay</button>
                                    `;
                                    prodGrid.appendChild(card);
                                });
                                assistantMsgDiv.appendChild(prodGrid);
                                chatLog.scrollTop = chatLog.scrollHeight;
                            }
                            
                            // Làm mới lại bảng gợi ý cá nhân hóa thời gian thực
                            await refreshRecommendations();
                            logHUD(`AI phan hoi stream hoan tat.`, "success");
                        }
                    } catch (err) {
                        console.error("Lỗi parse SSE chunk:", err);
                    }
                }
            }
        }
    } catch (e) {
        logHUD(`Loi ket noi chat stream: ${e.message}`, "danger");
        // Tắt typing indicator nếu bị lỗi
        typingIndicator.classList.add("hidden");
        appendChatBubble("Có sự cố kết nối rồi bạn ơi. Bạn thử lại nhé!", "assistant");
    }
}

// Render dynamic Intent Tags below chat log
function renderIntentBar(filters) {
    const bar = document.getElementById("intent-display-bar");
    const container = document.getElementById("intent-tags-container");
    container.innerHTML = "";

    let hasFilter = false;
    for (const [key, value] of Object.entries(filters)) {
        if (value !== null && value !== undefined && value !== "") {
            hasFilter = true;
            const tag = document.createElement("span");
            tag.className = "intent-tag";
            tag.innerText = `${key}: ${value}`;
            container.appendChild(tag);
        }
    }

    if (hasFilter) {
        bar.classList.remove("hidden");
    } else {
        bar.classList.add("hidden");
    }
}

// Append bubble to log with markdown parsing
function appendChatBubble(text, role, retrievedProducts = []) {
    const chatLog = document.getElementById("chat-log-container");
    const msg = document.createElement("div");
    msg.className = `msg ${role}`;
    
    const bubble = document.createElement("div");
    bubble.className = "msg-bubble";
    
    // ── NÂNG CẤP BỘ PARSER MARKDOWN ĐỂ GIAO DIỆN ĐẸP VÀ CHUYÊN NGHIỆP ──
    // 1. So khớp và chuyển đổi định dạng liên kết sản phẩm [Tên](product_id:X)
    let parsedText = text.replace(/\[([^\]]+)\]\(product_id:((?:p|l)_)?(\d+)\)/g, (match, name, prefix, id) => {
        const fullId = (prefix || "p_") + id;
        return `<a href="#" onclick="goToProductDetail('${fullId}'); return false;">${name}</a>`;
    });
    
    // 2. Chuyển đổi in đậm **chữ** -> <strong>chữ</strong>
    parsedText = parsedText.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // 3. Chuyển đổi in nghiêng *chữ* -> <em>chữ</em>
    parsedText = parsedText.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // 4. Phân tích các danh mục danh sách (Bullet points & Numbered lists)
    let lines = parsedText.split('\n');
    lines = lines.map(line => {
        let trimmed = line.trim();
        // Danh sách không thứ tự
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return `<div class="chat-list-item"><span class="bullet-dot">•</span><span>${trimmed.substring(2)}</span></div>`;
        }
        // Danh sách có thứ tự
        let numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
        if (numMatch) {
            return `<div class="chat-list-item"><span class="bullet-num">${numMatch[1]}.</span><span>${numMatch[2]}</span></div>`;
        }
        return line;
    });
    parsedText = lines.join('\n');
    
    // 5. Thay thế ký tự xuống dòng bằng thẻ <br>
    parsedText = parsedText.replace(/\n/g, "<br>");
    
    bubble.innerHTML = parsedText;
    msg.appendChild(bubble);
    
    // If AI assistant retrieved products -> render embedded product list directly inside chat!
    if (role === "assistant" && retrievedProducts && retrievedProducts.length > 0) {
        const prodGrid = document.createElement("div");
        prodGrid.className = "chat-embedded-products";
        
        retrievedProducts.forEach(p => {
            const card = document.createElement("div");
            card.className = "emb-prod-card";
            
            const effPrice = p.sale_price && p.sale_price > 0 ? p.sale_price : p.price;
            const fullPid2 = (p.source === "listing" ? "l_" : "p_") + p.id;
            
            const imgSrc2 = p.image_url || p.img || 'https://placehold.co/80x80/eee/999?text=SP';
            card.innerHTML = `
                <img class="emb-prod-img" src="${imgSrc2}" alt="${p.name || 'Sản phẩm'}" onerror="this.src='https://placehold.co/80x80/eee/999?text=SP'">
                <div class="emb-prod-info">
                    <h4><a href="#" onclick="goToProductDetail('${fullPid2}'); return false;">${p.name || 'Sản phẩm'}</a></h4>
                    <p>${formatVND(effPrice)}</p>
                </div>
                <button class="emb-buy-btn" onclick="addToCartDirect(${p.id})">Mua ngay</button>
            `;
            prodGrid.appendChild(card);
        });
        msg.appendChild(prodGrid);
    }
    
    chatLog.appendChild(msg);
    chatLog.scrollTop = chatLog.scrollHeight;
}


// ==========================================================================
// 3-STAGE PERSONALIZED RECOMMENDATIONS ENGINE (Transparent HUD scores)
// ==========================================================================
async function refreshRecommendations() {
    const container = document.getElementById("recommendations-container");
    const reasonText = document.getElementById("rec-trigger-reason");
    
    try {
        const userIdParam = activeUser ? `&user_id=${activeUser.id}` : '';
        const res = await fetch(`${API_BASE}/api/recommendations?session_token=${activeSessionToken}${userIdParam}&limit=4`);
        const recs = await res.json();
        
        container.innerHTML = "";
        
        if (!recs || recs.length === 0) {
            container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 1rem;">Đang tải gợi ý cá nhân hóa...</p>`;
            return;
        }

        // Cập nhật nhãn dòng kích hoạt (Dynamic trigger logic text)
        // Nếu sp đầu tiên có realtime boost -> thông báo "Phát hiện hành vi xem nhẫn, tăng gợi ý nhẫn"
        const first = recs[0];
        if (first._score_breakdown && first._score_breakdown.realtime_boost) {
            reasonText.innerText = `Phát hiện bạn vừa xem: "${first._viewed_name}" -> Xếp hạng lại thời gian thực (+0.5)`;
            reasonText.style.color = "var(--accent)";
        } else {
            reasonText.innerText = `Đang kết hợp Sở thích (40%) + So khớp (30%) + Bổ trợ (20%) + Hot (10%)`;
            reasonText.style.color = "var(--text-muted)";
        }

        recs.forEach(p => {
            const card = document.createElement("div");
            card.className = "rec-prod-card";
            
            const effPrice = p.sale_price && p.sale_price > 0 ? p.sale_price : p.price;
            const hasSale = p.sale_price && p.sale_price > 0;
            const hasBoost = p._score_breakdown && p._score_breakdown.realtime_boost;
            
            let bd = p._score_breakdown || { affinity: 0, similarity: 0, purchase_match: 0, trending: 0 };
            let boostRow = hasBoost ? `
                <div class="score-row" style="color: var(--accent);">
                    <span>Real-time Boost:</span>
                    <strong>+0.5</strong>
                </div>
            ` : "";

            const recImgSrc = p.image_url || p.img || 'https://placehold.co/200x200/eee/999?text=SP';
            card.innerHTML = `
                <div class="rec-img-wrapper">
                    <img class="rec-img" src="${recImgSrc}" alt="${p.name || ''}" onerror="this.src='https://placehold.co/200x200/eee/999?text=SP'">
                    ${hasBoost ? `<span class="boost-banner">BOOST ⚡</span>` : ""}
                    <span class="score-badge">Score: ${p.score.toFixed(2)}</span>
                    
                    <!-- Scoring Transparency Tooltip -->
                    <div class="score-tooltip">
                        <div class="tooltip-header">
                            <h4>Xếp Hạng Gợi Ý (3-Tầng)</h4>
                        </div>
                        <div class="score-row">
                            <span>Sở thích (Affinity 40%):</span>
                            <strong>${(bd.affinity * 0.4).toFixed(2)}</strong>
                        </div>
                        <div class="score-row">
                            <span>So khớp (Similar 30%):</span>
                            <strong>${(bd.similarity * 0.3).toFixed(2)}</strong>
                        </div>
                        <div class="score-row">
                            <span>Bổ trợ (Cross-sell 20%):</span>
                            <strong>${(bd.purchase_match * 0.2).toFixed(2)}</strong>
                        </div>
                        <div class="score-row">
                            <span>Trending (Hot 10%):</span>
                            <strong>${(bd.trending * 0.1).toFixed(2)}</strong>
                        </div>
                        ${boostRow}
                        <div class="score-row total-row">
                            <span>Tổng điểm:</span>
                            <strong>${p.score.toFixed(2)}</strong>
                        </div>
                    </div>
                </div>
                
                <div class="rec-details">
                    <h3>${p.name}</h3>
                    <div class="rec-price-row">
                        <span class="rec-price">${formatVND(effPrice)}</span>
                        <button class="rec-view-detail-btn" onclick="goToProductDetail('p_${p.id}')">Chi tiết</button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (e) {
        logHUD(`Loi cap nhat recommendations: ${e.message}`, "danger");
    }
}


// ==========================================================================
// STORE CATALOG EXPLORER
// ==========================================================================
async function loadCatalog(categoryFilter = "all") {
    const container = document.getElementById("catalog-products-container");
    container.innerHTML = "";
    
    try {
        let url = API_BASE + "/api/products";
        if (categoryFilter !== "all") {
            url += `?category=${encodeURIComponent(categoryFilter)}`;
        }
        
        const res = await fetch(url);
        const products = await res.json();
        
        if (!products || products.length === 0) {
            container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); font-size: 0.85rem;">Không có sản phẩm nào thuộc danh mục này.</p>`;
            return;
        }

        products.forEach(p => {
            const card = document.createElement("div");
            card.className = "prod-card";
            
            const effPrice = p.sale_price && p.sale_price > 0 ? p.sale_price : p.price;
            const hasSale = p.sale_price && p.sale_price > 0;
            
            const catImgSrc = p.image_url || p.img || 'https://placehold.co/200x200/eee/999?text=SP';
            card.innerHTML = `
                <div class="prod-img-wrapper">
                    <img class="prod-img" src="${catImgSrc}" alt="${p.name || ''}" onerror="this.src='https://placehold.co/200x200/eee/999?text=SP'">
                    ${hasSale ? `<span class="prod-sale-badge">SALE</span>` : ""}
                    <span class="prod-stars">★ ${p.rating.toFixed(1)}</span>
                </div>
                <div class="prod-body">
                    <h3>${p.name}</h3>
                    <div class="prod-price-row">
                        <span class="price-effective">${formatVND(effPrice)}</span>
                        ${hasSale ? `<span class="price-original">${formatVND(p.price)}</span>` : ""}
                    </div>
                    <div class="prod-actions">
                        <button class="add-cart-btn" onclick="addToCartDirect(${p.id})">Thêm vào giỏ</button>
                        <button class="view-btn" onclick="goToProductDetail('p_${p.id}')">👁️</button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (e) {
        logHUD(`Loi tai danh muc catalog: ${e.message}`, "danger");
    }
}


// ==========================================================================
// DWELL TIME & SCROLL DEPTH ENGAGEMENT LOGGER
// ==========================================================================
async function openProductDetail(productId) {
    const modal = document.getElementById("product-detail-modal");
    const body = document.getElementById("product-detail-modal-body");
    
    try {
        const res = await fetch(`${API_BASE}/api/products/${productId}?session_token=${activeSessionToken}&user_id=${activeUser ? activeUser.id : ''}`);
        const p = await res.json();
        
        const effPrice = p.sale_price && p.sale_price > 0 ? p.sale_price : p.price;
        const hasSale = p.sale_price && p.sale_price > 0;

        // Normalize fields — hỗ trợ cả MySQL (img/old_price) và SQLite cũ (image_url/sale_price)
        const modalImg      = p.image_url || p.img || 'https://placehold.co/300x300/eee/999?text=Sản+phẩm';
        const modalName     = p.name     || 'Sản phẩm';
        const modalDesc     = p.description || 'Phụ kiện thời trang cao cấp.';
        const modalMaterial = p.material  || 'Hợp kim cao cấp';
        const modalColor    = p.color     || 'Đa màu';
        const modalWarranty = p.warranty  || '6 tháng';
        const modalOrigin   = p.origin    || 'Việt Nam';
        const modalStock    = p.stock     != null ? p.stock : '—';
        const modalRating   = p.rating    ? parseFloat(p.rating).toFixed(1) : '4.5';

        body.innerHTML = `
            <div class="spec-grid" id="modal-spec-grid">
                <img class="spec-img" src="${modalImg}" alt="${modalName}" onerror="this.src='https://placehold.co/300x300/eee/999?text=Sản+phẩm'">
                <div class="spec-content">
                    <h2>${modalName}</h2>
                    <div class="spec-price">${formatVND(effPrice)} ${hasSale ? `<span class="price-original" style="font-size: 0.8rem; font-weight: normal; margin-left: 8px;">${formatVND(p.price)}</span>` : ""}</div>
                    <p class="spec-desc">${modalDesc}</p>
                    
                    <div class="spec-rows">
                        <div class="spec-row">
                            <span>Chất liệu:</span>
                            <strong>${modalMaterial}</strong>
                        </div>
                        <div class="spec-row">
                            <span>Màu sắc:</span>
                            <strong>${modalColor}</strong>
                        </div>
                        <div class="spec-row">
                            <span>Bảo hành:</span>
                            <strong>${modalWarranty}</strong>
                        </div>
                        <div class="spec-row">
                            <span>Xuất xứ:</span>
                            <strong>${modalOrigin}</strong>
                        </div>
                        <div class="spec-row">
                            <span>Tồn kho:</span>
                            <strong>Còn hàng (${modalStock} cái)</strong>
                        </div>
                        <div class="spec-row">
                            <span>Đánh giá:</span>
                            <strong>★ ${modalRating}/5</strong>
                        </div>
                    </div>
                    
                    <button class="checkout-btn" onclick="addToCartDirect(${p.id}); closeProductDetailModal();">THÊM VÀO GIỎ HÀNG</button>
                    
                    <!-- Simulated review read interaction -->
                    <button class="add-cart-btn" style="width: 100%; margin-top: 0.5rem;" id="modal-read-comments-btn">Xem Đánh Giá Khách Hàng (Reviews)</button>
                </div>
            </div>
        `;
        
        modal.classList.add("open");
        
        // ── KÍCH HOẠT HỆ THỐNG ĐO CHỈ SỐ HÀNH VI ──
        activeDetailProductId = productId;
        detailOpenedTime = Date.now();
        detailMaxScrollDepth = 0;
        didReadReviews = false;
        
        logHUD(`[EVENT] Bat dau tracking dwell_time & scroll cho SP#${productId}`, "event");

        // Event listener to track scrolling depth inside the modal wrapper
        const modalWrapper = document.querySelector(".modal-wrapper");
        modalWrapper.scrollTop = 0; // Reset scroll
        modalWrapper.onscroll = () => {
            const scrollPct = (modalWrapper.scrollTop / (modalWrapper.scrollHeight - modalWrapper.clientHeight)) * 100;
            detailMaxScrollDepth = Math.max(detailMaxScrollDepth, scrollPct);
        };

        // Event listener to track review reading clicks
        document.getElementById("modal-read-comments-btn").addEventListener("click", (e) => {
            didReadReviews = true;
            e.currentTarget.innerText = "★ 4.8/5 (124 lượt) - Đánh giá cực kỳ tốt!";
            e.currentTarget.disabled = true;
            
            // Báo log sự kiện đọc reviews nóng
            fetch(API_BASE + "/api/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: activeSessionToken,
                    user_id: activeUser ? activeUser.id : null,
                    product_id: productId,
                    event_type: "open_comments",
                    value: null
                })
            }).then(r => r.json()).then(res => {
                logHUD(`[TRACK] open_comments SP#${productId} -> +${res.increment} points.`, "interest");
                refreshRecommendations(); // refresh realtime recs list
            });
        });

    } catch (e) {
        logHUD(`Loi lay chi tiet SP: ${e.message}`, "danger");
    }
}

// Close Modal and Flush behavioral events logs
async function closeProductDetailModal() {
    const modal = document.getElementById("product-detail-modal");
    if (!modal.classList.contains("open")) return;
    
    modal.classList.remove("open");

    if (activeDetailProductId && detailOpenedTime) {
        const duration = (Date.now() - detailOpenedTime) / 1000; // Quy đổi ra giây
        const finalScroll = Math.round(detailMaxScrollDepth);
        
        logHUD(`[EVENT] Flush metrics SP#${activeDetailProductId}. Xem: ${duration.toFixed(1)}s | Cuộn: ${finalScroll}%`, "event");

        try {
            // 1. Gửi Dwell Time (Dự trữ thời gian xem)
            const dwellRes = await fetch(API_BASE + "/api/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: activeSessionToken,
                    user_id: activeUser ? activeUser.id : null,
                    product_id: activeDetailProductId,
                    event_type: "view_duration",
                    value: duration.toFixed(2)
                })
            });
            const dData = await dwellRes.json();
            if (dData.increment > 0) {
                logHUD(`[TRACK] view_duration (${duration.toFixed(1)}s) -> +${dData.increment} points`, "interest");
            }

            // 2. Gửi Scroll Depth (Chiều sâu cuộn trang)
            const scrollRes = await fetch(API_BASE + "/api/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: activeSessionToken,
                    user_id: activeUser ? activeUser.id : null,
                    product_id: activeDetailProductId,
                    event_type: "scroll_depth",
                    value: finalScroll.toString()
                })
            });
            const sData = await scrollRes.json();
            if (sData.increment > 0) {
                logHUD(`[TRACK] scroll_depth (${finalScroll}%) -> +${sData.increment} points`, "interest");
            }

            // Đồng bộ lại gợi ý & profile stats ngay lập tức sau khi xem
            await refreshRecommendations();
            
            // Cập nhật lại stats profile
            const userCtxRes = await fetch(`${API_BASE}/api/simulate?persona=check&user_id=${activeUser.id}&session_id=${activeSessionToken}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ persona: "check_only_do_not_wipe", user_id: activeUser.id, session_id: activeSessionToken })
            }); // Thực chất chỉ query lại context để refresh stats mà không wipe
            const cRes = await fetch(API_BASE + "/api/simulate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ persona: "check_status_only", user_id: activeUser.id, session_id: activeSessionToken })
            }).then(r=>r.json());
            
            // Cập nhật HUD stats
            updatePersonalizationHUD(cRes.new_context, "dynamic_update");

        } catch (e) {
            console.error("Lỗi flush events", e);
        }
    }

    activeDetailProductId = null;
    detailOpenedTime = null;
}


// ==========================================================================
// PERSISTENT SHOPPING CART & SIMULATED CHECKOUT
// ==========================================================================
async function addToCartDirect(productId) {
    if (!activeUser) return;
    
    logHUD(`Them SP#${productId} vao gio hang...`, "event");
    try {
        const res = await fetch(API_BASE + "/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: activeUser.id,
                product_id: productId,
                quantity: 1
            })
        });
        const data = await res.json();
        if (data.status === "success") {
            logHUD(`Da them vao gio. System logs add_cart (+3.0 points).`, "success");
            await refreshCartAndBadge();
            await refreshRecommendations();
            
            // Mở giỏ hàng trực quan để người dùng thấy feedback tức thì
            document.getElementById("cart-sidebar-container").classList.add("open");
        }
    } catch (e) {
        logHUD(`Loi them gio hang: ${e.message}`, "danger");
    }
}

async function refreshCartAndBadge() {
    if (!activeUser) return;
    
    const badge = document.getElementById("cart-count-badge");
    const list = document.getElementById("cart-items-list-container");
    const totalDisplay = document.getElementById("cart-total-price-display");

    try {
        const res = await fetch(`${API_BASE}/api/cart?user_id=${activeUser.id}`);
        const items = await res.json();
        
        badge.innerText = items.reduce((sum, item) => sum + item.quantity, 0);
        list.innerHTML = "";

        if (!items || items.length === 0) {
            list.innerHTML = `<p style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 2rem 0;">Giỏ hàng của bạn đang trống.</p>`;
            totalDisplay.innerText = "0đ";
            return;
        }

        let total = 0.0;
        items.forEach(item => {
            const price = item.sale_price && item.sale_price > 0 ? item.sale_price : item.price;
            total += price * item.quantity;

            const div = document.createElement("div");
            div.className = "cart-item";
            div.innerHTML = `
                <img class="cart-item-img" src="${item.image_url || item.img || 'https://placehold.co/60x60/eee/999?text=SP'}" alt="${item.name}" onerror="this.src='https://placehold.co/60x60/eee/999?text=SP'">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>${formatVND(price)}</p>
                    <span class="qty">Số lượng: ${item.quantity}</span>
                </div>
                <button class="remove-item-btn" onclick="removeFromCartDirect(${item.id})">✕</button>
            `;
            list.appendChild(div);
        });

        totalDisplay.innerText = formatVND(total);

    } catch (e) {
        console.error("Lỗi refresh cart", e);
    }
}

async function removeFromCartDirect(productId) {
    if (!activeUser) return;
    
    try {
        await fetch(`${API_BASE}/api/cart/${productId}?user_id=${activeUser.id}`, { method: "DELETE" });
        logHUD(`Da xoa SP#${productId} khoi gio hang.`, "system");
        await refreshCartAndBadge();
        await refreshRecommendations();
    } catch (e) {
        console.error(e);
    }
}

async function handleSimulatedCheckout() {
    if (!activeUser) return;
    
    logHUD("Bắt đầu đặt hàng giả lập...", "event");
    try {
        const res = await fetch("/api/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: activeUser.id })
        });
        const data = await res.json();
        if (data.status === "success") {
            logHUD(`[ORDER SUCCESS] Đơn hàng #${data.order_id} trị giá ${formatVND(data.total)} thanh toán thành công! Ghi nhận sự kiện purchase (+5.0 points per item)`, "success");
            
            // Đóng giỏ hàng và refresh
            document.getElementById("cart-sidebar-container").classList.remove("open");
            await refreshCartAndBadge();
            
            // Tái nạp recommendations & stats
            await refreshRecommendations();
            
            // Gọi simulator API để cập nhật status (sẽ chuyển user sang VIP nếu đạt mốc)
            const checkRes = await fetch(API_BASE + "/api/simulate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    persona: "check_vip",
                    user_id: activeUser.id,
                    session_id: activeSessionToken
                })
            });
            const simData = await checkRes.json();
            updatePersonalizationHUD(simData.new_context, "dynamic_update");
            
            alert(`🎉 Đặt hàng thành công! Đơn hàng của bạn trị giá ${formatVND(data.total)} đã hoàn tất. Điểm cá nhân hóa đã được cập nhật thành công!`);
        }
    } catch (e) {
        alert("Thanh toán thất bại, vui lòng kiểm tra giỏ hàng.");
    }
}