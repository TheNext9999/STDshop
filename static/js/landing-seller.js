/* ---- IMAGE UPLOAD ---- */
let uploadedFiles = [];

function handleFileSelect(e) {
  const files = Array.from(e.target.files);
  files.forEach(f => {
    if (uploadedFiles.length < 10) uploadedFiles.push(f);
  });
  renderPreviews();
}

function renderPreviews() {
  const grid = document.getElementById('previewGrid');
  const counter = document.getElementById('imgCounter');
  const counterTxt = document.getElementById('imgCountText');

  grid.innerHTML = '';
  uploadedFiles.forEach((f, i) => {
    const reader = new FileReader();
    reader.onload = ev => {
      const div = document.createElement('div');
      div.className = 'preview-thumb';
      div.innerHTML = `
        <img src="${ev.target.result}" alt="preview">
        <button class="remove-btn" onclick="removeImg(${i})"><i class="fas fa-times"></i></button>
      `;
      grid.insertBefore(div, grid.lastChild);
    };
    reader.readAsDataURL(f);
  });

  if (uploadedFiles.length < 10) {
    const add = document.createElement('div');
    add.className = 'preview-thumb add-more';
    add.innerHTML = '+';
    add.onclick = () => document.getElementById('fileInput').click();
    grid.appendChild(add);
  }

  const count = uploadedFiles.length;
  counterTxt.textContent = `${count} / 3 ảnh tối thiểu${count >= 3 ? ' – Đủ yêu cầu ✓' : ' – Cần thêm ảnh'}`;
  counter.className = 'img-counter ' + (count >= 3 ? 'ok' : 'warn');
}

/* Đồng bộ danh sách ảnh (kể cả ảnh kéo-thả) trở lại vào <input type="file">.
   Nếu không làm bước này, ảnh kéo-thả sẽ KHÔNG được gửi lên server khi submit,
   vì trình duyệt chỉ gửi những file nằm trong chính input đó. */
function syncFilesToInput() {
  const dt = new DataTransfer();
  uploadedFiles.forEach(f => dt.items.add(f));
  document.getElementById('fileInput').files = dt.files;
}

function removeImg(idx) {
  uploadedFiles.splice(idx, 1);
  renderPreviews();
  syncFilesToInput();
}

// Drag & drop
const zone = document.getElementById('uploadZone');
zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
zone.addEventListener('drop', e => {
  e.preventDefault();
  zone.classList.remove('drag-over');
  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
  files.forEach(f => { if (uploadedFiles.length < 10) uploadedFiles.push(f); });
  renderPreviews();
  syncFilesToInput();
});

/* ---- CONDITION SELECT ---- */
function selectCondition(btn, val) {
  document.querySelectorAll('.condition-btn[data-group="cond"]').forEach(b => b.classList.remove('selected'));
  document.querySelectorAll('.condition-group')[0].querySelectorAll('.condition-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  document.getElementById('conditionVal').value = val;
}

function toggleShip(btn) {
  btn.classList.toggle('selected');
  // Gom các phương thức đang chọn vào hidden input để gửi kèm khi submit
  const shipVal = document.getElementById('shipVal');
  if (shipVal) {
    const selected = Array.from(btn.parentElement.querySelectorAll('.condition-btn.selected'))
      .map(b => b.textContent.trim());
    shipVal.value = selected.join(', ');
  }
}

/* ---- PRICE ---- */
function setPrice(val) {
  document.getElementById('priceInput').value = val;
}

function formatPrice() {
  // just visual, keep as is for simplicity
}

/* ---- REASON ---- */
function toggleCustomReason() {
  const sel = document.getElementById('reasonSelect').value;
  const ta  = document.getElementById('customReason');
  ta.style.display = sel === 'other' ? 'block' : 'none';
}

/* ---- CHAR COUNT ---- */
function updateCharCount(inp) {
  document.getElementById('nameCount').textContent =
    `${inp.value.length} / 120 ký tự – Đặt tên rõ ràng, chứa thương hiệu và thông số chính`;
}

/* ---- FORM SUBMIT ---- */
/* submitProduct() giờ chỉ VALIDATE phía client rồi trả true/false.
   Trả true -> form tự submit thật lên Django (views.landing_seller xử lý POST
   và lưu vào MarketProduct). Trả false -> chặn submit, hiện cảnh báo. */
function submitProduct() {
  if (uploadedFiles.length < 3) {
    showToast('⚠️ Vui lòng tải lên ít nhất 3 ảnh thật!', true);
    return false;
  }
  if (!document.getElementById('conditionVal').value) {
    showToast('⚠️ Vui lòng chọn tình trạng sản phẩm!', true);
    return false;
  }
  return true;
}

function saveDraft() {
  showToast('💾 Đã lưu nháp thành công!');
}

/* ---- TABS ---- */
function switchTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));

  document.getElementById('tab-' + name).classList.add('active');

  const tabBtns = document.querySelectorAll('.tab-btn');
  const map = { post:0, listings:1, orders:2, wallet:3, notifs:4 };
  if (map[name] !== undefined) tabBtns[map[name]].classList.add('active');

  const titles = {
    post:     ['Đăng sản phẩm mới', 'Điền thông tin đầy đủ để sản phẩm được duyệt nhanh nhất'],
    listings: ['Sản phẩm của tôi',  'Quản lý tất cả sản phẩm đang rao, chờ duyệt và đã bán'],
    orders:   ['Quản lý đơn hàng',  'Xác nhận, gửi hàng và theo dõi tiến trình giao dịch'],
    wallet:   ['Ví & Thu nhập',     'Theo dõi số dư, lịch sử giao dịch và rút tiền về ngân hàng'],
    notifs:   ['Thông báo',         'Cập nhật mới nhất về đơn hàng, kiểm duyệt và tin nhắn'],
  };
  document.getElementById('page-title').textContent = titles[name][0];
  document.getElementById('page-sub').textContent   = titles[name][1];
}

/* ---- MODAL ---- */
function openModal()  { document.getElementById('orderModal').classList.add('show'); }
function closeModal() { document.getElementById('orderModal').classList.remove('show'); }
function closeModalOutside(e) { if (e.target === document.getElementById('orderModal')) closeModal(); }

/* ---- TOAST ---- */
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

// init previews
renderPreviews();

/* ============================================================
   3 TAB: SẢN PHẨM / ĐƠN HÀNG / THÔNG BÁO (dữ liệu thật do Django render sẵn)
   JS chỉ lo lọc, mở popup và đánh dấu đã đọc.
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  /* ---- CSRF (cookie hoặc token trong form của trang) ---- */
  function getCsrf() {
    const m = document.cookie.match(/(?:^|; )csrftoken=([^;]*)/);
    if (m) return decodeURIComponent(m[1]);
    const input = document.querySelector('input[name="csrfmiddlewaretoken"]');
    return input ? input.value : '';
  }

  /* ---- Mở đúng tab theo ?tab=... (sau khi thao tác hoặc bấm vào thông báo) ---- */
  const VALID_TABS = ['post', 'listings', 'orders', 'wallet', 'notifs'];
  const startTab = new URLSearchParams(window.location.search).get('tab');
  if (startTab && VALID_TABS.includes(startTab)) switchTab(startTab);

  /* ---- Bộ lọc tab SẢN PHẨM (chip trạng thái + ô tìm kiếm) ---- */
  const listingChips = document.querySelectorAll('#listingFilters .filter-chip');
  const listingSearch = document.getElementById('listingSearch');

  function applyListingFilter() {
    const active = document.querySelector('#listingFilters .filter-chip.active');
    const status = active ? active.dataset.filter : 'all';
    const q = listingSearch ? listingSearch.value.trim().toLowerCase() : '';
    const cards = document.querySelectorAll('#listingGrid .product-card');
    let visible = 0;
    cards.forEach(card => {
      const ok = (status === 'all' || card.dataset.status === status) &&
                 (!q || (card.dataset.name || '').includes(q));
      card.style.display = ok ? '' : 'none';
      if (ok) visible++;
    });
    const none = document.getElementById('listingNoResult');
    if (none) none.style.display = (cards.length > 0 && visible === 0) ? '' : 'none';
  }
  listingChips.forEach(chip => chip.addEventListener('click', () => {
    listingChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    applyListingFilter();
  }));
  if (listingSearch) listingSearch.addEventListener('input', applyListingFilter);

  /* ---- Bộ lọc tab ĐƠN HÀNG ---- */
  const orderChips = document.querySelectorAll('#orderFilters .filter-chip');
  function applyOrderFilter() {
    const active = document.querySelector('#orderFilters .filter-chip.active');
    const status = active ? active.dataset.filter : 'all';
    const rows = document.querySelectorAll('#orderTable tbody tr[data-status]');
    let visible = 0;
    rows.forEach(row => {
      const ok = status === 'all' || row.dataset.status === status;
      row.style.display = ok ? '' : 'none';
      if (ok) visible++;
    });
    const none = document.getElementById('orderNoResult');
    if (none) none.style.display = (rows.length > 0 && visible === 0) ? '' : 'none';
  }
  orderChips.forEach(chip => chip.addEventListener('click', () => {
    orderChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    applyOrderFilter();
  }));

  /* ---- Tab THÔNG BÁO: bấm vào 1 thông báo = đánh dấu đã đọc (+ chuyển tới liên kết) ---- */
  function setNotifBadges(unread) {
    ['sideNotifBadge', 'notifTabCnt'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (unread > 0) el.textContent = unread; else el.remove();
    });
    const summary = document.getElementById('notifSummary');
    if (summary) summary.textContent = unread > 0 ? unread + ' thông báo chưa đọc' : 'Bạn đã đọc hết thông báo';
  }

  function followLink(link) {
    if (!link) return;
    let url;
    try { url = new URL(link, window.location.origin); } catch (e) { return; }
    const tab = url.searchParams.get('tab');
    if (url.pathname === window.location.pathname && tab && VALID_TABS.includes(tab)) {
      switchTab(tab);                       // cùng trang: chỉ đổi tab, không tải lại
    } else {
      window.location.href = link;
    }
  }

  document.querySelectorAll('#notifList .notif-item').forEach(item => {
    item.addEventListener('click', () => {
      const link = item.dataset.link;
      if (!item.classList.contains('unread')) { followLink(link); return; }

      fetch(window.location.pathname, {
        method: 'POST',
        headers: {
          'X-CSRFToken': getCsrf(),
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ action: 'notif_read', notif_id: item.dataset.notifId })
      })
        .then(res => res.json())
        .then(data => {
          item.classList.remove('unread');
          const dot = item.querySelector('.notif-dot');
          if (dot) dot.remove();
          setNotifBadges(data.unread);
          followLink(link);
        })
        .catch(() => followLink(link));
    });
  });
});

/* ---- Popup chi tiết đơn: điền dữ liệu từ các data-* trên nút "Chi tiết" ---- */
function openOrderModal(btn) {
  const d = btn.dataset;
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value || '—';
  };
  set('omCode', d.code);
  set('omProduct', d.product);
  set('omStatus', d.status);
  set('omBuyer', d.buyer);
  set('omPhone', d.phone);
  set('omAddress', d.address);
  set('omNote', d.note);
  set('omTime', d.time);
  set('omPrice', d.price);
  set('omFee', d.fee);
  set('omNet', d.net);
  const img = document.getElementById('omImg');
  if (img) {
    if (d.img) { img.src = d.img; img.style.display = ''; }
    else { img.removeAttribute('src'); img.style.display = 'none'; }
  }
  openModal();
}