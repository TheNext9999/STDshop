/* ================= CHUYỂN TAB LOGIN / REGISTER ================= */

const tabButtons = document.querySelectorAll(".tab-btn");
const forms = document.querySelectorAll(".auth-form");

tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        // Xóa active từ tất cả button
        tabButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const tab = btn.dataset.tab;

        // Xóa active từ tất cả form
        forms.forEach(f => f.classList.remove("active"));

        // Hiển thị form tương ứng
        if (tab === "login") {
            document.getElementById("loginForm").classList.add("active");
        } else {
            document.getElementById("registerForm").classList.add("active");
        }
    });
});


/* ================= REGISTER ================= */

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const name = document.getElementById("regName").value.trim();
        const phone = document.getElementById("regPhone").value.trim();
        const email = document.getElementById("regEmail").value.trim();
        const password = document.getElementById("regPassword").value.trim();
        const confirm = document.getElementById("regConfirmPassword").value.trim();

        // ✅ VALIDATION ĐẦU VÀO
        if (!name || !phone || !email || !password || !confirm) {
            alert("❌ Vui lòng nhập đầy đủ thông tin!");
            return;
        }

        // ✅ KIỂM TRA EMAIL PHẢI LÀ @eaut.edu.vn
        if (!email.endsWith("@eaut.edu.vn")) {
            alert("❌ Email phải là địa chỉ trường (@eaut.edu.vn)!\n\nVí dụ: 20210101@eaut.edu.vn");
            document.getElementById("regEmail").focus();
            return;
        }

        // ✅ KIỂM TRA ĐỊNH DẠNG EMAIL (tách phần trước @)
        const emailPrefix = email.split("@")[0];
        if (emailPrefix.length === 0) {
            alert("❌ Email không hợp lệ!");
            return;
        }

        // ✅ KIỂM TRA MẬT KHẨU CÓ ÍT NHẤT 6 KÝ TỰ
        if (password.length < 6) {
            alert("❌ Mật khẩu phải có ít nhất 6 ký tự!");
            document.getElementById("regPassword").focus();
            return;
        }

        // ✅ KIỂM TRA MẬT KHẨU KHỚP
        if (password !== confirm) {
            alert("❌ Mật khẩu không khớp!");
            document.getElementById("regConfirmPassword").focus();
            return;
        }

        // ✅ KIỂM TRA SỐ ĐIỆN THOẠI (10-11 chữ số)
        if (!/^\d{10,11}$/.test(phone)) {
            alert("❌ Số điện thoại phải là 10-11 chữ số!");
            document.getElementById("regPhone").focus();
            return;
        }

        try {
    // 📤 GỬI TỚI SERVER
    const res = await fetch("http://localhost:3000/api/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, phone, email, password })
    });

    console.log("📤 Response status:", res.status);
    console.log("📤 Response ok:", res.ok);

    const data = await res.json();
    console.log("📥 Server trả về:", data);

    if (res.ok) {
        alert("✅ Đăng ký thành công!");
        // ... rest of code
    } else {
        alert("❌ " + (data.message || "Đăng ký thất bại!"));
    }

} catch (err) {
    console.error("❌ Lỗi đăng ký:", err);
    alert("❌ Không kết nối được server!");
}
    });
}


/* ================= LOGIN ================= */

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const phone = document.getElementById("loginPhone").value.trim();
        const password = document.getElementById("loginPassword").value.trim();

        // ✅ VALIDATION
        if (!phone || !password) {
            alert("❌ Vui lòng nhập số điện thoại và mật khẩu!");
            return;
        }

        try {
            // 📤 GỬI TỚI SERVER
            const res = await fetch("http://localhost:3000/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ phone, password })
            });

            const data = await res.json();

            if (res.ok) {
                // ✅ KIỂM TRA TÀI KHOẢN CÓ BỊ KHÓA KHÔNG
                if (data.status === "blocked") {
                    alert("❌ Tài khoản đã bị khóa!");
                    return;
                }

                // 💾 LƯU THÔNG TIN USER VÀO LOCALSTORAGE
                localStorage.setItem("user", JSON.stringify(data));

                alert("✅ Đăng nhập thành công!");

                // 🚀 CHUYỂN HƯỚNG ĐẾN TRANG CHÍNH
                window.location.href = "customer-order.html";

            } else {
                alert("❌ " + (data.message || "Đăng nhập thất bại!"));
            }

        } catch (err) {
            console.error("❌ Lỗi đăng nhập:", err);
            alert("❌ Không kết nối được server!");
        }
    });
}


/* ================= LOGOUT ================= */

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("user");
        alert("✅ Đăng xuất thành công!");
        window.location.href = "index.html";
    });
}


/* ================= KIỂM TRA TRẠNG THÁI LOGIN KHI TẢI TRANG ================= */

function checkLoginStatus() {
    const user = JSON.parse(localStorage.getItem("user"));
    
    if (user) {
        console.log("✅ User đang đăng nhập:", user);
        // Có thể hiển thị tên user, avatar...
    } else {
        console.log("ℹ️ User chưa đăng nhập");
    }
}

// Chạy khi trang load
document.addEventListener("DOMContentLoaded", checkLoginStatus);