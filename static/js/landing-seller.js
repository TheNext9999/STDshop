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

function removeImg(idx) {
  uploadedFiles.splice(idx, 1);
  renderPreviews();
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
function submitProduct() {
  if (uploadedFiles.length < 3) {
    showToast('⚠️ Vui lòng tải lên ít nhất 3 ảnh thật!', true);
    return;
  }
  if (!document.getElementById('conditionVal').value) {
    showToast('⚠️ Vui lòng chọn tình trạng sản phẩm!', true);
    return;
  }
  showToast('🎉 Đã đăng sản phẩm! Chờ STD kiểm duyệt trong 1 giờ.');
  setTimeout(() => switchTab('listings'), 1800);
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

/* ---- CONFIRM ORDER ---- */
function confirmOrder() {
  showToast('✅ Đã xác nhận! Hẹn người mua nhận hàng.');
}

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

