# STDShop

STDShop là một dự án thương mại điện tử được xây dựng bằng Django, hướng đến nhu cầu mua sắm của sinh viên. Giao diện hiện tại cung cấp trang chủ với thanh tìm kiếm, danh mục sản phẩm, khu vực flash sale, giỏ hàng và các màn hình hỗ trợ đăng nhập, trò chuyện và quản lý người bán.

## Công nghệ sử dụng

- Python
- Django 5.2.17
- SQLite
- HTML, CSS và JavaScript
- Chart.js và Font Awesome thông qua CDN

## Yêu cầu

- Python 3.10 trở lên
- pip
- PowerShell trên Windows (hoặc terminal tương đương)

## Cài đặt và chạy dự án

1. Clone hoặc tải mã nguồn về máy, sau đó mở terminal tại thư mục dự án:

   ```powershell
   cd D:\STDshop
   ```

2. Tạo môi trường ảo:

   ```powershell
   python -m venv venv
   ```

3. Kích hoạt môi trường ảo:

   ```powershell
   .\venv\Scripts\Activate.ps1
   ```

   Nếu PowerShell chặn việc chạy script, có thể kích hoạt tạm thời bằng lệnh:

   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   .\venv\Scripts\Activate.ps1
   ```

4. Cài đặt các thư viện:

   ```powershell
   pip install -r requirements.txt
   ```

5. Tạo hoặc cập nhật cơ sở dữ liệu:

   ```powershell
   python manage.py migrate
   ```

6. Khởi động máy chủ phát triển:

   ```powershell
   python manage.py runserver
   ```

7. Mở trình duyệt tại <http://127.0.0.1:8000/>.

## Tài khoản quản trị

Để truy cập Django admin, tạo tài khoản quản trị bằng lệnh:

```powershell
python manage.py createsuperuser
```

Sau đó truy cập <http://127.0.0.1:8000/admin/>.

## Chạy kiểm thử

```powershell
python manage.py test
```

## Cấu trúc chính

```text
STDshop/
├── manage.py                 # Điểm vào cho các lệnh Django
├── requirements.txt          # Danh sách thư viện Python
├── shop/                     # Django app chính
│   ├── models.py             # Mô hình dữ liệu
│   ├── views.py              # Xử lý request và response
│   ├── urls.py               # URL của app shop
│   └── migrations/           # Migration cơ sở dữ liệu
├── stdshop/                  # Cấu hình project Django
├── templates/shop/           # Các template giao diện
└── static/                   # CSS, JavaScript và tài nguyên tĩnh
```

## Các URL hiện có

- `/`: Trang chủ STDShop
- `/admin/`: Trang quản trị Django

## Lưu ý phát triển

Cấu hình hiện tại dùng `DEBUG = True` và SQLite, phù hợp cho môi trường phát triển cục bộ. Trước khi triển khai production, cần thay đổi secret key, cấu hình `ALLOWED_HOSTS`, tắt debug và thiết lập cơ sở dữ liệu cũng như static files theo môi trường triển khai.
