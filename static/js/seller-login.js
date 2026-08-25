let currentMethod = 0; // 0 = phone, 1 = email

    function switchMethod(method) {
        currentMethod = method;
        document.querySelectorAll('.method-tab').forEach((tab, i) => {
            tab.classList.toggle('active', i === method);
        });
        document.getElementById('inputLabel').textContent = method === 0 ? 'Số điện thoại' : 'Email';
        document.getElementById('contactInput').placeholder = method === 0 ? '0905 123 456' : 'example@gmail.com';
    }

    function sendOTP() {
        const input = document.getElementById('contactInput').value.trim();
        if (!input) {
            alert('Vui lòng nhập số điện thoại hoặc email!');
            return;
        }

        // Hiển thị phần nhập OTP
        document.getElementById('otpSection').style.display = 'block';

        // Thông báo gửi OTP thành công
        alert(`✅ Mã OTP đã được gửi đến ${currentMethod === 0 ? 'số điện thoại' : 'email'} của bạn!`);

        // Tự động focus vào ô OTP đầu tiên
        document.querySelector('.otp-input input').focus();
    }

    // Chuyển focus tự động khi nhập đủ 1 ký tự
    function moveNext(input) {
        if (input.value.length === 1) {
            const next = input.nextElementSibling;
            if (next) next.focus();
        }
    }

    // Hàm xác nhận OTP (đã gắn sự kiện cho nút)
    function verifyOTP() {
        // Lấy tất cả 6 ô input OTP
        const inputs = document.querySelectorAll('.otp-input input');
        let otp = '';
        inputs.forEach(inp => otp += inp.value);

        if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
            alert('Vui lòng nhập đủ 6 số OTP!');
            return;
        }

        // Giả lập xác thực thành công (sau này bạn có thể gửi lên server để check thật)
        alert(`✅ Xác thực OTP thành công!\nMã OTP bạn nhập: ${otp}\n\nBạn đã đăng nhập vào DTAFood Seller.\nĐang chuyển hướng đến Dashboard...`);

        // Chuyển hướng thật (bỏ comment khi dùng)
        // window.location.href = "seller-dashboard.html";
    }

    // Gắn sự kiện cho nút Xác nhận OTP (chạy khi trang load)
    document.addEventListener('DOMContentLoaded', () => {
        const confirmBtn = document.querySelector('#otpSection .btn-otp');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', verifyOTP);
        }
    });

