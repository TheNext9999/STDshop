let currentChat = null;

        function openChat(chatId) {
            currentChat = chatId;
            document.getElementById('welcomeScreen').style.display = 'none';
            document.getElementById('chatBox').style.display = 'flex';

            // Demo tin nhắn
            const chatBox = document.getElementById('chatBox');
            chatBox.innerHTML = `
                <div class="message received">Bạn ơi, đơn hàng đã hoàn thành rồi, bạn cảm thấy sao về chất lượng sản phẩm ạ</div>
                <div class="message sent">Dạ cảm ơn shop nha, sản phẩm rất ưng ý mình nha</div>
                <div class="message received">Cảm ơn bạn nha</div>
            `;
        }

        function sendMessage() {
            const input = document.getElementById('messageInput');
            if (input.value.trim() === '' || !currentChat) return;

            const chatBox = document.getElementById('chatBox');
            const newMsg = document.createElement('div');
            newMsg.className = 'message sent';
            newMsg.textContent = input.value;
            chatBox.appendChild(newMsg);
            chatBox.scrollTop = chatBox.scrollHeight;
            input.value = '';
        }

        // Gửi tin nhắn khi nhấn Enter
        document.getElementById('messageInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') sendMessage();
        });

