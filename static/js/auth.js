function switchTab(n) {
            document.querySelectorAll('.tab').forEach((tab, i) => {
                tab.classList.toggle('active', i === n);
            });
            document.getElementById('form-login').style.display = n === 0 ? 'block' : 'none';
            document.getElementById('form-register').style.display = n === 1 ? 'block' : 'none';
        }

        document.getElementById('tab-login').addEventListener('click', () => switchTab(0));
        document.getElementById('tab-register').addEventListener('click', () => switchTab(1));

        function login() { alert("✅ Đăng nhập thành công!"); }
        function register() { alert("✅ Đăng ký thành công!"); }

