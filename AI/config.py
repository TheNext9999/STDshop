"""
AI/config.py
Mọi thông số cấu hình của Chat AI nằm ở đây. Muốn đổi mô hình, nhà cung cấp API,
độ "sáng tạo" hay số sản phẩm gợi ý thì chỉ cần sửa file này.
"""

# ---- Nhà cung cấp & mô hình (Groq, dùng giao thức tương thích OpenAI) ----
API_KEY_ENV = "GROQ_API_KEY"                  # tên biến môi trường trong file .env
BASE_URL = "https://api.groq.com/openai/v1"
MODEL = "openai/gpt-oss-120b"

# ---- Tham số sinh câu trả lời ----
MAX_TOKENS = 900
TEMPERATURE = 0.35

# ---- Sản phẩm ----
MAX_PRODUCTS = 6          # tối đa số sản phẩm phù hợp đưa vào prompt và giao diện

# ---- Thông báo gửi về giao diện khi AI gặp lỗi ----
ERROR_MESSAGE = "AI đang bận, vui lòng thử lại sau nhé!"
