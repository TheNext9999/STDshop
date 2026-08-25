// Hiển thị thời gian nộp bài
        const now = new Date();
        document.getElementById("submit-time").textContent =
            now.toLocaleString("vi-VN");

        function goHome() {
            window.location.href = "/home.html"; // chỉnh theo dự án
        }

        function viewResult() {
            window.location.href = "/result.html"; // chỉnh theo dự án
        }

