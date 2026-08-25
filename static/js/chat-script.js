/* ================= CONFIG ================= */
const API_BASE = '/api';

let currentUser = JSON.parse(localStorage.getItem("user"));
let currentChatUser = null;
let chatInterval = null;

/* ================= VALIDATION ================= */
if (!currentUser) {
    alert("❌ Vui lòng đăng nhập trước");
    window.location.href = "/html/auth.html";
}

console.log("👤 Current user:", currentUser);

/* ================= SEARCH USERS ================= */
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");

searchInput.addEventListener("input", async (e) => {
    const email = e.target.value.trim();

    if (email.length === 0) {
        searchResults.style.display = "none";
        return;
    }

    try {
        console.log("🔍 Searching for email:", email);
        
        const res = await fetch(`${API_BASE}/search-users?email=${encodeURIComponent(email)}`);
        
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        const users = await res.json();
        console.log("📋 Search results:", users);

        if (!users || users.length === 0) {
            searchResults.innerHTML = `<div style="padding: 15px; text-align: center; color: #999;">Không tìm thấy người dùng</div>`;
            searchResults.style.display = "block";
            return;
        }

        searchResults.innerHTML = '';

        users.forEach(user => {
            // Không cho chat với chính mình
            if (user.id === currentUser.id) {
                console.log("⏭️ Skip self:", user.id);
                return;
            }

            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.innerHTML = `
                <div class="result-name">${user.name}</div>
                <div class="result-email">${user.email}</div>
            `;
            
            // ✅ FIX: Gọi openChatWithUser với đúng định dạng
            div.onclick = () => {
                const chatUser = {
                    user_id: user.id,  // ← Chuyển id thành user_id
                    name: user.name,
                    email: user.email
                };
                openChatWithUser(chatUser);
                searchInput.value = '';
                searchResults.style.display = 'none';
            };
            
            searchResults.appendChild(div);
        });

        searchResults.style.display = "block";

    } catch (err) {
        console.error("❌ Lỗi tìm kiếm:", err);
        searchResults.innerHTML = `<div style="padding: 15px; text-align: center; color: #d32f2f;">❌ Lỗi tìm kiếm: ${err.message}</div>`;
        searchResults.style.display = "block";
    }
});

/* ================= LOAD CHATS ================= */
async function loadChats() {
    try {
        console.log("📥 Loading chats for user:", currentUser.id);
        
        const res = await fetch(`${API_BASE}/chats/${currentUser.id}`);
        
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        const chats = await res.json();
        console.log("📋 Chats loaded:", chats);

        const container = document.getElementById("chatItemsContainer");
        
        if (!chats || chats.length === 0) {
            container.innerHTML = `<div class="empty-chats"><div><i class="fas fa-inbox" style="font-size: 2rem; color: #ccc; display: block; margin-bottom: 10px;"></i><p>Chưa có cuộc trò chuyện nào</p></div></div>`;
            document.getElementById("chatCount").textContent = "Chat (0)";
            return;
        }

        document.getElementById("chatCount").textContent = `Chat (${chats.length})`;
        container.innerHTML = '';

        chats.forEach((chat, index) => {
            const div = document.createElement('div');
            div.className = 'chat-item';
            div.dataset.index = index;  // ✅ Thêm data-index để dễ theo dõi
            
            // ✅ FIX: Dùng arrow function để giữ ngữ cảnh
            div.onclick = (e) => {
                e.stopPropagation();
                openChatWithUser(chat);
                
                // Highlight
                document.querySelectorAll(".chat-item").forEach(item => item.classList.remove("active"));
                div.classList.add("active");
            };

            const avatar = document.createElement('div');
            avatar.className = 'chat-avatar';
            avatar.textContent = (chat.name || 'U').charAt(0).toUpperCase();

            const info = document.createElement('div');
            info.className = 'chat-info';
            info.innerHTML = `
                <div class="chat-name">${chat.name || 'Unknown'}</div>
                <div class="chat-lastmsg">${chat.last_message || '(Không có tin nhắn)'}</div>
            `;

            const time = document.createElement('div');
            time.className = 'chat-time';
            time.textContent = formatTime(chat.last_message_time);

            div.appendChild(avatar);
            div.appendChild(info);
            div.appendChild(time);
            container.appendChild(div);
        });

    } catch (err) {
        console.error("❌ Lỗi load chats:", err);
        const container = document.getElementById("chatItemsContainer");
        container.innerHTML = `<div class="empty-chats"><div><i class="fas fa-exclamation-circle" style="font-size: 2rem; color: #d32f2f; display: block; margin-bottom: 10px;"></i><p>❌ Lỗi tải chat</p></div></div>`;
    }
}

/* ================= OPEN CHAT ================= */
async function openChatWithUser(user) {
    console.log("💬 Opening chat with:", user);

    if (!user.user_id) {
        alert("❌ Lỗi: ID người dùng không hợp lệ");
        return;
    }

    currentChatUser = user;

    // Cập nhật UI
    document.getElementById("welcomeScreen").style.display = "none";
    document.getElementById("chatTopBar").classList.add("active");
    document.getElementById("chatBox").classList.add("active");
    document.getElementById("chatInputArea").classList.add("active");

    document.getElementById("topBarAvatar").textContent = (user.name || 'U').charAt(0).toUpperCase();
    document.getElementById("topBarName").textContent = user.name || 'Unknown';
    document.getElementById("topBarEmail").textContent = user.email || '';

    // Load messages
    await loadMessages();

    // Clear old interval
    if (chatInterval) clearInterval(chatInterval);

    // Polling for new messages every 2 seconds
    chatInterval = setInterval(() => {
        loadMessages();
    }, 2000);
}

/* ================= LOAD MESSAGES ================= */
async function loadMessages() {
    if (!currentChatUser || !currentChatUser.user_id) {
        console.warn("⚠️ No chat user selected");
        return;
    }

    try {
        const url = `${API_BASE}/messages/${currentUser.id}/${currentChatUser.user_id}`;
        console.log("📥 Loading messages from:", url);

        const res = await fetch(url);

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        const messages = await res.json();
        console.log("📋 Messages loaded:", messages.length);

        const chatBox = document.getElementById("chatBox");
        chatBox.innerHTML = '';

        if (!messages || messages.length === 0) {
            chatBox.innerHTML = `<div style="text-align: center; color: #999; padding: 20px;">Bắt đầu cuộc trò chuyện mới</div>`;
            return;
        }

        messages.forEach(msg => {
            const div = document.createElement('div');
            div.className = `message ${msg.sender_id === currentUser.id ? 'sent' : 'received'}`;

            const bubble = document.createElement('div');
            bubble.className = 'message-bubble';
            bubble.textContent = msg.message;

            const time = document.createElement('div');
            time.className = 'message-time';
            time.textContent = formatTime(msg.created_at);

            div.appendChild(bubble);
            div.appendChild(time);
            chatBox.appendChild(div);
        });

        // Scroll to bottom
        setTimeout(() => {
            chatBox.scrollTop = chatBox.scrollHeight;
        }, 100);

    } catch (err) {
        console.error("❌ Lỗi load messages:", err);
    }
}

/* ================= SEND MESSAGE ================= */
async function sendMessage() {
    const input = document.getElementById("messageInput");
    const message = input.value.trim();

    // ✅ Validation chi tiết
    if (!message) {
        console.warn("⚠️ Message is empty");
        alert("❌ Vui lòng nhập tin nhắn");
        return;
    }

    if (!currentChatUser) {
        console.warn("⚠️ No chat user selected");
        alert("❌ Vui lòng chọn người dùng để chat");
        return;
    }

    if (!currentChatUser.user_id) {
        console.warn("⚠️ Invalid receiver_id:", currentChatUser.user_id);
        alert("❌ Lỗi: ID người dùng không hợp lệ");
        return;
    }

    if (!currentUser || !currentUser.id) {
        console.warn("⚠️ Invalid sender_id:", currentUser.id);
        alert("❌ Lỗi: Không tìm thấy thông tin người dùng");
        return;
    }

    try {
        const payload = {
            sender_id: parseInt(currentUser.id),  // ✅ Chuyển về INT
            receiver_id: parseInt(currentChatUser.user_id),  // ✅ Chuyển về INT
            message: message
        };

        console.log("📤 Sending message:", payload);

        const res = await fetch(`${API_BASE}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        console.log("📥 Response:", data);

        if (res.ok) {
            input.value = '';
            await loadMessages();
            await loadChats();
            console.log("✅ Message sent successfully");
        } else {
            alert("❌ " + (data.message || "Lỗi gửi tin nhắn"));
            console.error("❌ Error response:", data);
        }

    } catch (err) {
        console.error("❌ Lỗi gửi tin nhắn:", err);
        alert("❌ Lỗi gửi tin nhắn: " + err.message);
    }
}

/* ================= HELPER FUNCTIONS ================= */
function formatTime(dateString) {
    if (!dateString) return "";

    try {
        const date = new Date(dateString);
        const now = new Date();

        // Nếu hôm nay
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        }

        // Nếu hôm qua
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return "Hôm qua";
        }

        // Ngày khác
        return date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
    } catch (e) {
        console.warn("⚠️ Invalid date:", dateString);
        return "";
    }
}

function goBack() {
    document.getElementById("chatList").classList.add("hidden");
    document.getElementById("chatMain").style.width = "100%";
}

/* ================= SEND MESSAGE ON ENTER ================= */
document.addEventListener("DOMContentLoaded", () => {
    const messageInput = document.getElementById("messageInput");
    if (messageInput) {
        messageInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                sendMessage();
            }
        });
    }
});

/* ================= INITIALIZE ================= */
document.addEventListener("DOMContentLoaded", () => {
    loadChats();
    
    console.log('%c✅ Chat STDShop đã sẵn sàng!', 'color:#00C9B0; font-size:16px; font-weight:bold');
});