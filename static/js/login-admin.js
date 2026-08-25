function switchTab(tab) {
        document.getElementById('tabLogin').classList.toggle('active', tab === 0);
        document.getElementById('tabRegister').classList.toggle('active', tab === 1);
        document.getElementById('loginForm').style.display = tab === 0 ? 'block' : 'none';
        document.getElementById('registerForm').style.display = tab === 1 ? 'block' : 'none';
    }

    function sendAdminOTP() {
        document.getElementById('adminOTPSection').style.display = 'block';
        alert("🔐 Mã OTP đã được gửi đến Email / Số điện thoại của Admin!");
    }

    function verifyAdminOTP() {
        alert("✅ Xác thực OTP thành công!\n\nChào mừng Super Admin!\nĐang chuyển vào Dashboard Quản trị...");
        // window.location = "admin-dashboard.html";
    }

    function registerAdmin() {
        alert("📩 Yêu cầu đăng ký Admin đã được gửi!\n\nSuper Admin sẽ kiểm duyệt và cấp mã mời trong 24h.");
    }

