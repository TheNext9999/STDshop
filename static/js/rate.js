// Chọn sao đánh giá
        const stars = document.querySelectorAll('.star');
        let currentRating = 5;

        stars.forEach(star => {
            star.addEventListener('click', () => {
                currentRating = parseInt(star.dataset.value);
                
                stars.forEach(s => {
                    s.classList.toggle('active', parseInt(s.dataset.value) <= currentRating);
                });

                const texts = ["Tệ", "Không hài lòng", "Bình thường", "Hài lòng", "Tuyệt vời"];
                document.getElementById('ratingText').textContent = texts[currentRating - 1];
            });
        });

        // Submit (demo)
        function submitReview() {
            const reviewText = document.getElementById('reviewText').value.trim();
            if (reviewText === "") {
                alert("Vui lòng nhập nội dung đánh giá!");
                return;
            }
            alert("✅ Đánh giá của bạn đã được gửi thành công!\nCảm ơn bạn đã góp phần giúp STDShop ngày càng tốt hơn.");
            // Có thể chuyển hướng về trang đơn hàng hoặc trang chủ
            // window.location.href = "order-history.html";
        }

        // Khởi tạo 5 sao mặc định
        document.querySelectorAll('.star')[4].click();

