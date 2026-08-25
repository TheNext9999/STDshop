const form = document.querySelector("#registerForm form");

form.addEventListener('submit', function (e) {
    e.preventDefault();

    const name = document.getElementById("shopName").value.trim();
    const owner = document.getElementById("ownerName").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();
    const address = document.getElementById("address").value.trim();
    const type = document.getElementById("businessType").value;

    if (!name || !phone || !address || !type) {
        alert('Vui lòng nhập đầy đủ thông tin!');
        return;
    }

    let pendingSellers = JSON.parse(localStorage.getItem("pendingSellers")) || [];

    // 🔥 CHECK TRÙNG EMAIL
    const emailExist = pendingSellers.some(s => s.email === email);
    if (emailExist) {
        alert("Email đã đăng ký rồi!");
        return;
    }

    // 🔥 CHECK TRÙNG SĐT
    const phoneExist = pendingSellers.some(s => s.phone === phone);
    if (phoneExist) {
        alert("Số điện thoại đã đăng ký rồi!");
        return;
    }

    const newSeller = {
        id: Date.now(),
        shopName: name,
        ownerName: owner,
        phone: phone,
        email: email,
        address: address,
        type: type,
        status: "pending",
        createdAt: new Date().toLocaleDateString()
    };

    pendingSellers.push(newSeller);

    localStorage.setItem("pendingSellers", JSON.stringify(pendingSellers));

    alert("🎉 Đăng ký thành công! Chờ admin duyệt.");

    form.reset();

    // 🔥 CHUYỂN SANG TRANG LOGIN
    window.location.href = "/html/seller-login.html";
});