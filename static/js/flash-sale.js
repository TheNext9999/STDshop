/* ============================================================
   TRANG FLASH SALE - STDShop
   Sản phẩm do Django render sẵn; file này chỉ lo 2 việc tương tác:
   đếm ngược và lọc theo tab danh mục (ẩn/hiện các thẻ đã có sẵn trong DOM).
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ===== 1. ĐẾM NGƯỢC tới 24:00 hôm nay (theo giờ máy người xem) =====
    const hEl = document.getElementById('fsH');
    const mEl = document.getElementById('fsM');
    const sEl = document.getElementById('fsS');

    function pad(n) { return String(n).padStart(2, '0'); }

    function tick() {
        if (!hEl || !mEl || !sEl) return;
        const now = new Date();
        const end = new Date(now);
        end.setHours(24, 0, 0, 0);
        const left = Math.max(0, Math.floor((end - now) / 1000));
        hEl.textContent = pad(Math.floor(left / 3600));
        mEl.textContent = pad(Math.floor((left % 3600) / 60));
        sEl.textContent = pad(left % 60);
    }
    tick();
    setInterval(tick, 1000);

    // ===== 2. LỌC THEO TAB DANH MỤC =====
    const tabs = Array.from(document.querySelectorAll('#fsTabs .fs-tab'));
    const items = Array.from(document.querySelectorAll('#fsGrid .fs-item'));
    const noResult = document.getElementById('fsNoResult');
    if (!tabs.length) return;

    function itemCats(item) {
        return (item.dataset.cat || '').trim().split(/\s+/).filter(Boolean);
    }

    // Hiện số sản phẩm cạnh mỗi tab (đếm từ các thẻ thật đang có trên trang)
    tabs.forEach(tab => {
        const slug = tab.dataset.cat;
        const count = slug === 'all'
            ? items.length
            : items.filter(it => itemCats(it).includes(slug)).length;
        const badge = tab.querySelector('.fs-tab-count');
        if (badge) badge.textContent = '(' + count + ')';
    });

    function applyTab(slug) {
        let visible = 0;
        items.forEach(item => {
            const show = slug === 'all' || itemCats(item).includes(slug);
            item.style.display = show ? '' : 'none';
            if (show) visible++;
        });
        // Chỉ báo "không có sản phẩm" khi trang có sản phẩm nhưng tab này lọc ra rỗng
        if (noResult) noResult.style.display = (items.length > 0 && visible === 0) ? '' : 'none';
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            applyTab(tab.dataset.cat);
        });
    });
});