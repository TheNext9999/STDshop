# STDShop - Nền Tảng Thương Mại Điện Tử Dành Cho Sinh Viên

STDShop là nền tảng thương mại điện tử toàn diện được xây dựng trên nền tảng **Django**, thiết kế chuyên biệt cho nhu cầu mua sắm và trao đổi đồ dùng của sinh viên (sách vở, giáo trình, thiết bị điện tử, đồ gia dụng, thời trang, v.v.).

Dự án tích hợp **Trợ lý AI tư vấn mua sắm**, hệ thống **sinh viên tự đăng tin bán/thanh lý đồ**, xác thực tài khoản đa kênh qua mạng xã hội (**Google, Facebook, Zalo**), cùng **Bảng điều khiển quản trị tùy biến (Custom Admin Panel)** trực quan với biểu đồ thống kê.

---

## 🌟 Tính năng nổi bật

### 1. Trải nghiệm người mua (Student / Buyer)
- **Trang chủ & Danh mục**: Giao diện trực quan, hỗ trợ phân loại danh mục đa tầng và lọc sản phẩm.
- **Tìm kiếm thông minh**: Tìm kiếm thời gian thực kèm tính năng gợi ý từ khóa tự động (`/search/suggest/`).
- **Giỏ hàng & Đặt hàng**: Giỏ hàng tương tác nhanh không tải lại trang (AJAX), quy trình thanh toán (Checkout) và lưu địa chỉ giao hàng linh hoạt.
- **Theo dõi đơn hàng**: Lịch sử đơn hàng cá nhân và tra cứu trạng thái vận đơn chi tiết (`/orders/`, `/tracking/`).
- **Tiện ích mua sắm nâng cao**:
  - **Wishlist**: Lưu danh sách sản phẩm yêu thích.
  - **So sánh sản phẩm**: Đặt cạnh nhau 2 hay nhiều sản phẩm để so sánh thông số, giá bán (`/compare/`).
  - **Flash Sale**: Khu vực giảm giá chớp nhoáng với đồng hồ đếm ngược.
  - **Mã giảm giá (Vouchers)**: Áp dụng mã khuyến mãi trực tiếp khi thanh toán.
- **Cộng đồng & Đánh giá**: Đánh giá số sao, bình luận trải nghiệm và tương tác thả cảm xúc (Reactions) trên đánh giá.
- **Hệ thống Huy hiệu (Badges) & Thông báo**: Nhận huy hiệu thành viên năng động và trung tâm thông báo tức thì (`/notifications/`).

### 2. Kênh Sinh viên đăng bán (Student Marketplace)
- **Đăng bán đồ dùng/sách cũ**: Sinh viên có thể tự đăng bán sản phẩm cá nhân hoặc thanh lý đồ dùng (`/post-product/`).
- **Quản lý kho cá nhân**: Theo dõi, chỉnh sửa sản phẩm đã đăng và kiểm tra trạng thái duyệt bài (`/my-products/`).

### 3. Trợ lý AI mua sắm (AI Shopping Assistant)
- **Chatbot AI tích hợp**: Chatbot hỗ trợ tư vấn 24/7 trực tiếp trên website (`/api/chat/`).
- **Tự động nhận diện nhu cầu**: Sử dụng mô hình ngôn ngữ lớn (LLM qua Groq API) kết hợp truy vấn cơ sở dữ liệu để tìm kiếm và đề xuất các sản phẩm phù hợp nhất trong kho hàng theo ngữ cảnh trò chuyện.

### 4. Xác thực & Tài khoản người dùng (Authentication)
- Đăng ký, đăng nhập và bảo mật phiên theo chuẩn Django.
- **Đăng nhập mạng xã hội (Social Auth)**: Tích hợp Google, Facebook (thông qua `django-allauth`) và Zalo OAuth API.
- **Khôi phục mật khẩu**: Tính năng quên mật khẩu và đặt lại qua email (`/password-reset/`).

### 5. Hệ thống Quản trị (Admin System)
- **Custom Admin Dashboard (`/admin-panel/`)**:
  - Báo cáo thống kê trực quan với biểu đồ Chart.js (doanh thu, lượng đơn hàng, người dùng mới).
  - Quản lý và duyệt bài đăng bán của sinh viên trước khi hiển thị.
  - Quản trị danh mục, sản phẩm, voucher, chương trình flash sale, đánh giá, huy hiệu và thông báo toàn sàn.
- **Django Admin mặc định (`/admin/`)**: Phục vụ việc quản trị dữ liệu tầng sâu của quản trị viên cấp cao.

### 6. Nội dung & Hỗ trợ
- Hệ thống bài viết Blog chia sẻ mẹo vặt, cẩm nang sinh viên.
- Trang giới thiệu (About), liên hệ (Contact), câu hỏi thường gặp (FAQ) và điều khoản chính sách (Policy).

---

## 🛠️ Công nghệ sử dụng

- **Backend**: Python 3.10+, Django 5.2.x, PyMySQL, Requests, OpenAI SDK (kết nối Groq LLM API).
- **Frontend**: HTML5, CSS3, JavaScript (ES6+), Font Awesome 6, Chart.js.
- **Cơ sở dữ liệu**: MySQL (khuyên dùng trong cấu hình) / SQLite (hỗ trợ phát triển nhanh).
- **Xác thực**: Django Auth, django-allauth (Google, Facebook), Zalo OAuth 2.0.

---

## 📋 Yêu cầu hệ thống

- Python 3.10 trở lên
- pip (trình quản lý gói của Python)
- MySQL Server (nếu sử dụng cấu hình mặc định) hoặc SQLite
- Hệ điều hành: Windows, macOS hoặc Linux

---

## ⚙️ Cài đặt và Chạy dự án

### Bước 1: Clone mã nguồn
Mở terminal (PowerShell trên Windows hoặc Bash trên Linux/macOS):
```powershell
cd D:\STDshop
```

### Bước 2: Tạo và kích hoạt môi trường ảo (venv)
```powershell
# Tạo môi trường ảo
python -m venv venv

# Kích hoạt trên Windows PowerShell:
.\venv\Scripts\Activate.ps1

# (Nếu bị chặn script, chạy lệnh này trước khi kích hoạt):
# Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
# .\venv\Scripts\Activate.ps1

# Kích hoạt trên Linux / macOS:
# source venv/bin/activate
```

### Bước 3: Cài đặt các thư viện cần thiết
```powershell
pip install -r requirements.txt
```

### Bước 4: Cấu hình biến môi trường (`.env`)
Tạo file `.env` tại thư mục gốc (ngang hàng với `manage.py`) bằng cách sao chép từ file mẫu `.env.example`:
```powershell
copy .env.example .env
```
Mở file `.env` và thiết lập các thông số cần thiết:
```ini
# Cấu hình Django
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_DEBUG=True

# Groq API Key (bắt buộc để sử dụng AI Chatbot)
GROQ_API_KEY=your-groq-api-key-here

# Đăng nhập mạng xã hội (tùy chọn)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret
ZALO_APP_ID=your-zalo-app-id
ZALO_APP_SECRET=your-zalo-app-secret

# Cấu hình gửi Email (tùy chọn - mặc định in ra terminal console)
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### Bước 5: Cấu hình cơ sở dữ liệu

* **Cách 1: Sử dụng MySQL (Mặc định trong `settings.py`)**
  1. Mở MySQL Client/Workbench và tạo cơ sở dữ liệu:
     ```sql
     CREATE DATABASE stdshop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
     ```
  2. Đảm bảo thông tin user/password trong `stdshop/settings.py` khớp với MySQL server của bạn.

* **Cách 2: Sử dụng SQLite (Phát triển thử nghiệm nhanh)**
  Mở file `stdshop/settings.py` và thay khối `DATABASES` thành:
  ```python
  DATABASES = {
      'default': {
          'ENGINE': 'django.db.backends.sqlite3',
          'NAME': BASE_DIR / 'db.sqlite3',
      }
  }
  ```

### Bước 6: Khởi tạo database và tài khoản quản trị
```powershell
# Áp dụng migration
python manage.py migrate

# Tạo tài khoản Superuser (Admin)
python manage.py createsuperuser
```

### Bước 7: Khởi chạy máy chủ phát triển
```powershell
python manage.py runserver
```
Mở trình duyệt và truy cập: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)

---

## 🗺️ Bản đồ URL chính (Routing)

| Phân hệ | Đường dẫn (URL) | Mô tả |
| :--- | :--- | :--- |
| **Cửa hàng** | `/` | Trang chủ STDShop |
| | `/category/` | Xem sản phẩm theo danh mục |
| | `/detail/` | Chi tiết sản phẩm & đánh giá |
| | `/search/` | Tìm kiếm sản phẩm |
| | `/search/suggest/` | API gợi ý kết quả tìm kiếm |
| **Giỏ & Đơn hàng** | `/cart/` | Giỏ hàng mua sắm |
| | `/checkout/` | Thanh toán đơn hàng |
| | `/orders/` | Lịch sử mua hàng |
| | `/tracking/` | Theo dõi tiến trình đơn hàng |
| **Tiện ích mua sắm** | `/wishlist/` | Danh sách sản phẩm yêu thích |
| | `/compare/` | So sánh thông số sản phẩm |
| | `/flash-sale/` | Săn deal giảm giá có hạn giờ |
| | `/voucher/` | Kho voucher khuyến mãi |
| **Sinh viên đăng bán** | `/post-product/` | Form đăng tin bán sản phẩm |
| | `/my-products/` | Quản lý tin bán cá nhân |
| **Trợ lý AI** | `/api/chat/` | API Chatbot tư vấn thông minh (POST) |
| **Quản trị** | `/admin-panel/` | Custom Admin Dashboard (Charts, Duyệt bài, Quản lý) |
| | `/admin/` | Trang quản trị kỹ thuật của Django |
| **Xác thực** | `/login/`, `/register/`, `/logout/` | Đăng nhập, đăng ký, đăng xuất |
| | `/accounts/` | Đăng nhập Google & Facebook (allauth) |
| | `/zalo/login/` | Đăng nhập qua tài khoản Zalo |
| | `/password-reset/` | Quy trình đặt lại mật khẩu |

---

## 📁 Cấu trúc thư mục

```text
STDshop/
├── manage.py                 # Điểm vào thực thi các lệnh Django
├── requirements.txt          # Danh sách thư viện phụ thuộc
├── .env.example              # File mẫu khai báo biến môi trường
├── db.sqlite3                # SQLite database (khi sử dụng chế độ sqlite)
├── stdshop/                  # Package cấu hình dự án Django
│   ├── settings.py           # Cấu hình ứng dụng, database, auth, apps
│   ├── urls.py               # Root URL configuration
│   └── wsgi.py               # WSGI entrypoint
├── shop/                     # Ứng dụng chính (Core E-commerce App)
│   ├── models.py             # Định nghĩa cấu trúc dữ liệu (Product, Order, Review,...)
│   ├── views.py              # Xử lý logic nghiệp vụ và trả về response
│   ├── urls.py               # Điều hướng routes của app shop
│   ├── admin.py              # Đăng ký models vào Django admin
│   ├── context_processors.py # Context toàn cục (số thông báo chưa đọc,...)
│   └── migrations/           # Lịch sử lược đồ cơ sở dữ liệu
├── templates/                # Giao diện HTML (Django Templates)
│   └── shop/                 # Templates trang chủ, giỏ hàng, admin-panel,...
└── static/                   # Tài nguyên tĩnh (CSS, JS, Fonts, Images)
```

---

## 🔒 Lưu ý triển khai Production

- Đặt biến `DEBUG = False` trong `settings.py` (hoặc thông qua `.env`).
- Thiết lập khóa bí mật `SECRET_KEY` an toàn, không để lộ trên kho lưu trữ mã nguồn.
- Điền danh sách tên miền được phép trong `ALLOWED_HOSTS` và `CSRF_TRUSTED_ORIGINS`.
- Chạy `python manage.py collectstatic` để gom tài nguyên tĩnh và cấu hình WhiteNoise hoặc Nginx để phân phối.
- Cấu hình dịch vụ gửi email thực (SMTP Gmail/SendGrid) thay vì Console Backend.

---

## 👥 Tác giả & Đóng góp

- **Dự án**: STDShop - E-Commerce Platform for Students
- **Phát triển bởi**: Đội ngũ phát triển STDShop
- Mọi đóng góp (Pull Request), phản hồi hoặc báo lỗi vui lòng mở mục **Issues** trên kho lưu trữ.
