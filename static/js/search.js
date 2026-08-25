// ==================== DỮ LIỆU SẢN PHẨM (đã có sẵn) ====================
        const defaultDishes = [
    { id: 1, name: "Áo Hoodie Oversize Unisex", price: 189000, rating: 4.8, img: "https://down-vn.img.susercontent.com/file/vn-11134201-7r98o-lpja7tsxdp9xfe@resize_w900_nl.webp", hot: true },
    { id: 31, name: "Áo Hoodie Basic Oversize Cotton", price: 169000, rating: 4.7, img: "https://thoitrangbigsize.vn/wp-content/uploads/2025/01/BSX1518W.jpg", hot: false },
    { id: 32, name: "Áo Hoodie Zip Jacket Unisex", price: 229000, rating: 4.9, img: "https://content.pancake.vn/1/s1768x1768/fwebp80/c6/0a/df/4e/613210214e0667e6a8148c47c6de35abc62b6c7b8dce35f67da88b70-w:3648-h:3648-l:324157-t:image/jpeg.jpeg", hot: true },
    { id: 33, name: "Áo Hoodie In Hình Stussy Style", price: 199000, rating: 4.8, img: "https://imgcdn.thitruongsi.com/tts/rs:fill:1200:0:1:1/g:sm/plain/file://product/2024/05/22/54b9b550-17de-11ef-bb33-0ff2f9aae4bf.jpg", hot: true },
    { id: 34, name: "Áo Hoodie Nike Air Oversize", price: 259000, rating: 4.6, img: "https://dongphucgiadinh.com/wp-content/uploads/2022/10/thoi-trang-ao-hoodie-sweater-49.jpg", hot: false },
    { id: 35, name: "Áo Hoodie Hooded Sweatshirt Đen", price: 179000, rating: 4.7, img: "https://product.hstatic.net/200000886795/product/ao-hoodie-unisex-nam-nu-insidemen-ihd002bz__7__ff4a3abea33141b99dd7dd0ad98039ec.jpg", hot: false },
    { id: 36, name: "Áo Hoodie Champion Logo Unisex", price: 245000, rating: 4.9, img: "https://down-vn.img.susercontent.com/file/44c2961c7fda2cf0bf8823305028ecb2", hot: true },
    { id: 37, name: "Áo Hoodie Local Brand Oversize", price: 209000, rating: 4.5, img: "https://product.hstatic.net/200000370449/product/hdr_xam_sau_f1327ea20bfa4b8cab1b3a1bc7295ea6_master.jpg", hot: false },
    { id: 38, name: "Áo Hoodie Thêu Chữ Basic", price: 159000, rating: 4.8, img: "https://down-vn.img.susercontent.com/file/f80d32165e4212e25193757f6cde3048", hot: true },
    { id: 39, name: "Áo Hoodie Fleece Lót Nỉ Ấm", price: 279000, rating: 4.7, img: "https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-m15pbbt13bln13", hot: false },
    { id: 40, name: "Áo Hoodie Supreme Box Logo", price: 235000, rating: 4.6, img: "https://i.ebayimg.com/images/g/7KEAAeSwk5NpQ7uh/s-l1600.webp", hot: true },

    { id: 41, name: "Áo Hoodie Adidas Originals", price: 269000, rating: 4.8, img: "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lpwgqsbzj8iafc", hot: false },
    { id: 42, name: "Áo Hoodie Kangaroo Pocket", price: 185000, rating: 4.9, img: "https://cdn.vuahanghieu.com/unsafe/0x900/left/top/smart/filters:quality(90)/https://admin.vuahanghieu.com/upload/product/2023/10/ao-hoodie-nam-carrera-jeans-lightweight-with-kangaroo-pocket-835a0043a_40k-mau-xanh-navy-size-m-6540b02a3144a-31102023144338.jpg", hot: true },
    { id: 43, name: "Áo Hoodie In Hình Anime", price: 199000, rating: 4.7, img: "https://down-vn.img.susercontent.com/file/245c3b059ff5195582f65903e0f82fef", hot: false },
    { id: 44, name: "Áo Hoodie Oversize Wash Effect", price: 219000, rating: 4.6, img: "https://product.hstatic.net/1000308345/product/img_4115_3103845f009b4a77aeae84d8ee7ae141_master.jpg", hot: true },
    { id: 45, name: "Áo Hoodie Teddy Bear Unisex", price: 239000, rating: 4.8, img: "https://down-vn.img.susercontent.com/file/aa06cc62ba3d0e527907056231cecf3f", hot: false },
    { id: 46, name: "Áo Hoodie Retro Vintage", price: 175000, rating: 4.5, img: "https://down-vn.img.susercontent.com/file/sg-11134202-7rbk3-llmm2p4jhghbaf", hot: true },
    { id: 47, name: "Áo Hoodie Zip Up Cardigan", price: 265000, rating: 4.9, img: "https://img.lazcdn.com/g/p/01ac34375c3e5e43329b9f68d87d7754.jpg_720x720q80.jpg", hot: false },
    { id: 48, name: "Áo Hoodie In Hình Graffiti", price: 189000, rating: 4.7, img: "https://thoitrangbigsize.vn/wp-content/uploads/2024/12/BSX1424W.jpg", hot: true },
    { id: 49, name: "Áo Hoodie Heavyweight Cotton", price: 299000, rating: 4.8, img: "https://image.made-in-china.com/202f0j00hoycRiKMEYbl/500-GSM-100-Cotton-Plain-Essentials-Mens-Heavyweight-Hoodie-Oversized-Sweatshirt-Men-Cropped-Hoodie-for-Men.webp", hot: false },
            // Bạn có thể thêm nhiều sản phẩm hơn vào đây
        ];

        // ==================== RENDER KẾT QUẢ ====================
        const searchInput = document.getElementById("searchInput");
        const searchKeywordEl = document.getElementById("searchKeyword");
        const searchResultsGrid = document.getElementById("searchResultsGrid");

        function renderSearchResults(results) {
            searchResultsGrid.innerHTML = '';

            if (results.length === 0) {
                searchResultsGrid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#888;padding:60px;">Không tìm thấy sản phẩm nào phù hợp.</p>`;
                return;
            }

            results.forEach(dish => {
                const card = document.createElement('div');
                card.className = 'product-card';
                card.innerHTML = `
                    <a href="dish-detail.html?id=${dish.id}" style="text-decoration:none;color:inherit;">
                        <img src="${dish.img}" alt="${dish.name}">
                        <div class="product-info">
                            <div class="product-name">${dish.name}</div>
                            <div class="product-price">${dish.price.toLocaleString('vi-VN')}đ</div>
                            <div class="product-rating">⭐ ${dish.rating}</div>
                        </div>
                    </a>
                `;
                searchResultsGrid.appendChild(card);
            });
        }

        // Tìm kiếm realtime
        function performSearch(keyword) {
            const term = keyword.toLowerCase().trim();
            searchKeywordEl.textContent = term ? `"${keyword}"` : "Tất cả sản phẩm";

            const results = term 
                ? defaultDishes.filter(dish => dish.name.toLowerCase().includes(term))
                : defaultDishes;   // Nếu không nhập gì thì hiển thị tất cả

            renderSearchResults(results);
        }

        searchInput.addEventListener('input', () => {
            performSearch(searchInput.value);
        });

        // Sắp xếp
        document.querySelectorAll('.sort-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.sort-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                let results = defaultDishes.filter(d => 
                    d.name.toLowerCase().includes(searchInput.value.toLowerCase().trim())
                );

                const sortType = tab.dataset.sort;
                if (sortType === 'price-asc') results.sort((a,b) => a.price - b.price);
                if (sortType === 'price-desc') results.sort((a,b) => b.price - a.price);
                if (sortType === 'bestselling') results.sort((a,b) => b.rating - a.rating);

                renderSearchResults(results);
            });
        });

        // Khởi tạo trang: Hiển thị tất cả sản phẩm khi vừa vào trang tìm kiếm
        document.addEventListener('DOMContentLoaded', () => {
            renderSearchResults(defaultDishes);   // Hiển thị mặc định tất cả sản phẩm
            console.log('%c✅ Trang tìm kiếm STDShop đã sẵn sàng với sản phẩm!', 'color:#00C9B0; font-size:16px;');
        });

