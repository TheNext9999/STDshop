// ===== DATA =====
// Card sản phẩm giờ do DJANGO RENDER SẴN ra HTML (xem partial
// landing/partials/market_card.html) - JS không còn tự dựng HTML bằng chuỗi
// template như cách cũ nữa. File này chỉ lo LỌC / SẮP XẾP / TÌM KIẾM bằng
// cách ẩn-hiện và đổi thứ tự các thẻ .product-card đã có sẵn trong DOM.
//
// Biến `products` (mảng JSON dữ liệu thật) vẫn được template khai báo ở thẻ
// <script> phía trước, dùng để tra thông tin khi mở modal chi tiết sản phẩm.

function formatVND(n){ return (n||0).toLocaleString('vi-VN')+'đ' }

function conditionBadge(c){
  const m={new:'badge-new like-new','like-new':'badge-like-new',used:'badge-used'};
  const l={'new':'Mới 100%','like-new':'Như mới',used:'Đã dùng'};
  return `<span class="badge-condition ${m[c]||'badge-used'}">${l[c]||c}</span>`;
}

// ===== TRẠNG THÁI BỘ LỌC HIỆN TẠI =====
const filterState = {
  cat: 'all',
  condition: 'all',
  price: null,     // 'cheap' | 'mid' | 'high'
  verified: false,
  flash: false,
  keyword: '',
};

function getCards(){
  return Array.from(document.querySelectorAll('#productGrid .product-card'));
}

function getProductById(id){
  return products.find(p => String(p.id) === String(id));
}

// ===== ÁP DỤNG BỘ LỌC (ẩn/hiện card có sẵn) =====
function applyFilters(){
  let visibleCount = 0;

  getCards().forEach(card => {
    const p = getProductById(card.dataset.id) || {};
    const price = parseInt(card.dataset.price) || 0;
    let show = true;

    if (filterState.cat !== 'all' && card.dataset.cat !== filterState.cat) show = false;
    if (filterState.condition !== 'all' && p.condition !== filterState.condition) show = false;

    if (filterState.price === 'cheap' && price >= 200000) show = false;
    if (filterState.price === 'mid'   && (price < 200000 || price > 1000000)) show = false;
    if (filterState.price === 'high'  && price <= 1000000) show = false;

    if (filterState.verified && !p.verified) show = false;
    if (filterState.flash && !p.flash) show = false;

    if (filterState.keyword) {
      const hay = (card.dataset.name || '') + ' ' + (card.dataset.seller || '');
      if (!hay.includes(filterState.keyword)) show = false;
    }

    card.style.display = show ? '' : 'none';
    if (show) visibleCount++;
  });

  const noResult = document.getElementById('noResultMsg');
  if (noResult) noResult.style.display = visibleCount === 0 ? 'block' : 'none';
}

// ===== CATEGORY FILTER =====
function filterCat(cat, el){
  document.querySelectorAll('.cat-item').forEach(c=>c.classList.remove('active'));
  if (el) el.classList.add('active');
  filterState.cat = cat;
  applyFilters();
}

// ===== FILTER TAGS =====
function toggleFilter(el, group, value){
  if (group === 'condition' || group === 'price') {
    // Trong cùng 1 nhóm chỉ chọn được 1 giá trị
    document.querySelectorAll(`.filter-tag`).forEach(t => {
      const onclickAttr = t.getAttribute('onclick') || '';
      if (onclickAttr.includes(`'${group}'`)) t.classList.remove('active');
    });
    el.classList.add('active');

    if (group === 'condition') filterState.condition = value;
    if (group === 'price') filterState.price = value;

  } else if (group === 'special') {
    // Các tag đặc biệt bật/tắt độc lập
    const isActive = el.classList.toggle('active');
    if (value === 'verified') filterState.verified = isActive;
    if (value === 'flash') filterState.flash = isActive;
  }

  applyFilters();
}

// ===== SẮP XẾP (đổi thứ tự card trong DOM) =====
function sortProducts(mode){
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  const sorted = getCards().sort((a, b) => {
    const pa = getProductById(a.dataset.id) || {};
    const pb = getProductById(b.dataset.id) || {};
    const priceA = parseInt(a.dataset.price) || 0;
    const priceB = parseInt(b.dataset.price) || 0;

    if (mode === 'Giá thấp → cao')  return priceA - priceB;
    if (mode === 'Giá cao → thấp')  return priceB - priceA;
    if (mode === 'Phổ biến nhất')   return (parseInt(b.dataset.views)||0) - (parseInt(a.dataset.views)||0);
    if (mode === 'Đánh giá cao')    return (pb.sellerRating||0) - (pa.sellerRating||0);
    return (pb.id||0) - (pa.id||0); // Mới nhất: id lớn hơn = mới hơn
  });

  sorted.forEach(card => grid.appendChild(card));
}

// ===== OPEN PRODUCT MODAL =====
// Card render từ Django chỉ truyền id, nên tra dữ liệu đầy đủ từ mảng products.
function openProductById(id){
  const p = getProductById(id);
  if (p) openProduct(p);
}

function openProduct(p){
  document.getElementById('modalTitle').textContent = p.name;
  document.getElementById('modalName').textContent = p.name;
  document.getElementById('modalImg').src = p.img;
  document.getElementById('modalPrice').textContent = formatVND(p.price);
  document.getElementById('modalOldPrice').textContent = formatVND(p.oldPrice);
  document.getElementById('modalConditionTag').innerHTML = conditionBadge(p.condition);
  document.getElementById('modalMeta').innerHTML = `
    <div class="meta-item"><label>Danh mục</label><span>${p.cat}</span></div>
    <div class="meta-item"><label>Tình trạng</label><span>${p.condLabel}</span></div>
    <div class="meta-item"><label>Địa điểm</label><span>${p.location}</span></div>
    <div class="meta-item"><label>Giảm</label><span style="color:var(--danger)">-${p.discount}%</span></div>
  `;
  document.getElementById('modalSellerCard').innerHTML = `
    <div class="seller-avatar-lg">${p.seller ? p.seller[0] : '?'}</div>
    <div>
      <div class="seller-name">${p.seller} ${p.verified?'<i class="fas fa-check-circle" style="color:var(--primary);font-size:.85rem"></i>':''}</div>
      <div class="seller-meta">
        <span><i class="fas fa-star star"></i> ${p.sellerRating}/5</span>
        <span><i class="fas fa-shopping-bag"></i> ${p.sellerSales} đánh giá</span>
        <span><i class="fas fa-map-marker-alt"></i> ${p.location}</span>
      </div>
    </div>
  `;
  openModal('productModal');
}

// ===== MODAL =====
function openModal(id){
  document.getElementById(id).classList.add('active');
  document.body.style.overflow='hidden';
}
function closeModal(id){
  document.getElementById(id).classList.remove('active');
  document.body.style.overflow='';
}
document.querySelectorAll('.modal-overlay').forEach(o=>{
  o.addEventListener('click', e=>{ if(e.target===o) closeModal(o.id); });
});

// ===== PAYMENT =====
function selectPay(opt){
  document.getElementById('optA').classList.toggle('selected', opt==='A');
  document.getElementById('optB').classList.toggle('selected', opt==='B');
  document.getElementById('escrowFlow').style.display = opt==='A'?'block':'none';
}

// ===== CHAT =====
function sendMsg(){
  const inp = document.getElementById('chatInput');
  const msg = inp.value.trim();
  if(!msg) return;
  const box = document.getElementById('chatMessages');
  const now = new Date();
  const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;
  const div = document.createElement('div');
  div.innerHTML = `<div class="msg msg-buyer">${msg}</div><div class="msg-time">${time}</div>`;
  box.appendChild(div);
  inp.value='';
  box.scrollTop = box.scrollHeight;
  setTimeout(()=>{
    const replies = ['Bạn đợi mình xác nhận nhé! 😊','OK bạn, mình có thể deal thêm một chút!','Hàng còn đó, bạn muốn đặt cọc không?','Mình sẽ gửi thêm ảnh cho bạn ngay!'];
    const r = document.createElement('div');
    r.innerHTML = `<div class="msg-sender">Người bán</div><div class="msg msg-seller">${replies[Math.floor(Math.random()*replies.length)]}</div><div class="msg-time">${time}</div>`;
    box.appendChild(r);
    box.scrollTop = box.scrollHeight;
  }, 1200);
}
function quickMsg(t){ document.getElementById('chatInput').value=t; sendMsg(); }
function sendImg(){ showToast('Tính năng gửi ảnh sẽ sớm ra mắt!','warning'); }

// ===== STARS =====
function setStars(id, n){
  document.querySelectorAll(`#${id} span`).forEach((s,i)=>{
    s.classList.toggle('active',i<n);
  });
}

// ===== WISHLIST =====
function toggleWish(btn){
  btn.classList.toggle('active');
  showToast(btn.classList.contains('active')?'Đã thêm vào danh sách yêu thích ❤️':'Đã bỏ yêu thích','');
}

// ===== TOAST =====
function showToast(msg, type){
  const t = document.getElementById('toastEl');
  t.className = `toast ${type}`;
  t.innerHTML = `<i class="fas fa-${type==='success'?'check-circle':type==='danger'?'exclamation-circle':'info-circle'}"></i> ${msg}`;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),3500);
}

// ===== COUNTDOWN =====
let secs = 1*3600 + 45*60 + 30;
setInterval(()=>{
  if(secs<=0) return;
  secs--;
  const h=Math.floor(secs/3600), m=Math.floor((secs%3600)/60), s=secs%60;
  document.getElementById('fh').textContent=String(h).padStart(2,'0');
  document.getElementById('fm').textContent=String(m).padStart(2,'0');
  document.getElementById('fs').textContent=String(s).padStart(2,'0');
}, 1000);


// ===== INIT: gắn sự kiện tìm kiếm & sắp xếp =====
document.addEventListener('DOMContentLoaded', () => {
  // Dropdown tài khoản (dùng chung cơ chế .user-menu.open như navbar chính)
  const navUser = document.getElementById('navUser');
  if (navUser) {
    navUser.addEventListener('click', (e) => {
      e.stopPropagation();
      navUser.classList.toggle('open');
    });
    document.addEventListener('click', () => navUser.classList.remove('open'));
  }

  const searchBox = document.getElementById('searchInput');
  if (searchBox) {
    searchBox.addEventListener('input', function(){
      filterState.keyword = this.value.toLowerCase().trim();
      applyFilters();
    });
  }

  const sortSelect = document.querySelector('.sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', function(){
      sortProducts(this.value);
    });
  }
});

// ===== ORDER MANAGEMENT =====
const ordersData = [
  {
    id:'STD-2026-0841',
    product:'Laptop Dell Inspiron 15 2022 – i7/16GB/512GB SSD',
    seller:'Minh Tuấn',
    price:6800000, oldPrice:14000000,
    img:'https://maytinhquanganh.com/wp-content/uploads/2024/06/z5532090216110_ac965f20c3fc9daaa1e03746c7e387bc.jpg',
    status:'shipping',
    statusLabel:'Đang vận chuyển',
    escrowStep:3, // 1=paid,2=sent,3=shipping,4=received,5=reviewed
    date:'08/05/2026',
    payMethod:'Escrow'
  },
  {
    id:'STD-2026-0839',
    product:'iPhone 13 Pro 128GB – Xanh Sierra, fullbox',
    seller:'Lan Anh',
    price:14500000, oldPrice:25000000,
    img:'https://file.hstatic.net/1000359786/file/dsc03296_98ba72034d2d44959c9f85b0902651f1_grande.jpg',
    status:'shipping',
    statusLabel:'Đang vận chuyển',
    escrowStep:3,
    date:'07/05/2026',
    payMethod:'Escrow'
  },
  {
    id:'STD-2026-0820',
    product:'Tai nghe Sony WH-1000XM4 – chống ồn ANC, fullbox',
    seller:'Phương Chi',
    price:3200000, oldPrice:6000000,
    img:'https://tainghechinhhang.vn/wp-content/uploads/2022/12/z3935645219091_d5cd6d7ed3adc1b12639e20dcefe1161-scaled.jpg',
    status:'pending',
    statusLabel:'Chờ người bán xác nhận',
    escrowStep:1,
    date:'06/05/2026',
    payMethod:'Escrow'
  },
  {
    id:'STD-2026-0815',
    product:'Áo hoodie unisex oversize form rộng – màu xám tro',
    seller:'Thu Thảo',
    price:150000, oldPrice:280000,
    img:'https://down-vn.img.susercontent.com/file/28279ae9c4c4536a42730d4f3e5a0fd1',
    status:'pending',
    statusLabel:'Chờ người bán gửi hàng',
    escrowStep:2,
    date:'05/05/2026',
    payMethod:'Escrow'
  },
  {
    id:'STD-2026-0798',
    product:'Máy ảnh Canon EOS M50 Mark II – kit 15-45mm',
    seller:'Đức Anh',
    price:8500000, oldPrice:15000000,
    img:'https://bncamera.com/wp-content/uploads/2024/10/z5982145992222_88096fa2f140bc5e808adc5cb87c9541-1-scaled.jpg',
    status:'delivered',
    statusLabel:'Đã nhận hàng',
    escrowStep:4,
    date:'01/05/2026',
    payMethod:'Escrow',
    needReview: true
  },
  {
    id:'STD-2026-0771',
    product:'Balo Targus Gaming 15.6 inch – chống nước',
    seller:'Quốc Bảo',
    price:280000, oldPrice:450000,
    img:'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80',
    status:'cancelled',
    statusLabel:'Đã huỷ',
    escrowStep:0,
    date:'25/04/2026',
    payMethod:'COD'
  },
];

const statusBadgeClass = {
  pending:'status-pending',
  shipping:'status-shipping',
  delivered:'status-delivered',
  cancelled:'status-cancelled',
  disputed:'status-disputed'
};

const escrowLabels = ['Đã TT','Đã gửi','Đang giao','Nhận hàng','Đánh giá'];
const escrowPercents = [0, 25, 50, 75, 100];

function formatOrderVND(n){ return n.toLocaleString('vi-VN')+'đ' }

function buildOrderCard(o){
  const pct = escrowPercents[o.escrowStep] || 0;
  const showEscrow = o.status !== 'cancelled' && o.status !== 'delivered';
  const stepLabelsHtml = escrowLabels.map((l,i)=>{
    let cls = '';
    if(i < o.escrowStep) cls='done';
    else if(i === o.escrowStep - 1) cls='current';
    return `<span class="${cls}">${l}</span>`;
  }).join('');

  let actionsHtml = '';
  if(o.status === 'shipping'){
    actionsHtml = `
      <button class="order-action-btn btn-confirm-recv" onclick="confirmReceived('${o.id}')"><i class="fas fa-check-circle"></i> Đã nhận hàng</button>
      <button class="order-action-btn btn-contact-seller" onclick="openModal('chatModal')"><i class="fas fa-comments"></i> Liên hệ</button>
      <button class="order-action-btn btn-dispute" onclick="openModal('reportModal')"><i class="fas fa-flag"></i> Khiếu nại</button>
    `;
  } else if(o.status === 'pending'){
    actionsHtml = `
      <button class="order-action-btn btn-contact-seller" onclick="openModal('chatModal')"><i class="fas fa-comments"></i> Liên hệ người bán</button>
      <button class="order-action-btn btn-view-detail"><i class="fas fa-eye"></i> Xem chi tiết</button>
      <button class="order-action-btn btn-dispute" onclick="cancelOrder('${o.id}')"><i class="fas fa-times"></i> Huỷ đơn</button>
    `;
  } else if(o.status === 'delivered'){
    if(o.needReview){
      actionsHtml = `
        <button class="order-action-btn btn-rate" onclick="openModal('reviewModal')"><i class="fas fa-star"></i> Đánh giá ngay</button>
        <button class="order-action-btn btn-contact-seller" onclick="openModal('chatModal')"><i class="fas fa-comments"></i> Liên hệ</button>
        <button class="order-action-btn btn-confirm-recv" onclick="confirmReceived('${o.id}')"><i class="fas fa-check-circle"></i> Xác nhận & Giải phóng tiền</button>
      `;
    } else {
      actionsHtml = `
        <button class="order-action-btn btn-view-detail" style="flex:none;padding:8px 20px"><i class="fas fa-redo"></i> Mua lại</button>
        <button class="order-action-btn btn-contact-seller" style="flex:none;padding:8px 20px"><i class="fas fa-star"></i> Xem đánh giá</button>
      `;
    }
  } else if(o.status === 'cancelled'){
    actionsHtml = `<button class="order-action-btn btn-view-detail" style="flex:none;padding:8px 20px"><i class="fas fa-redo"></i> Mua lại sản phẩm này</button>`;
  }

  return `
    <div class="order-card" id="order-${o.id}">
      <div class="order-card-top">
        <span class="order-id"><i class="fas fa-receipt" style="color:var(--primary)"></i> ${o.id} · ${o.payMethod}</span>
        <span class="order-status-badge ${statusBadgeClass[o.status]||''}">${o.statusLabel}</span>
      </div>
      <div class="order-product-row">
        <img class="order-product-img" src="${o.img}" alt="${o.product}">
        <div class="order-product-info">
          <div class="order-product-name">${o.product}</div>
          <div class="order-seller-line"><i class="fas fa-store"></i> ${o.seller}</div>
          <div class="order-price-line">
            <span class="order-final-price">${formatOrderVND(o.price)}</span>
            <span class="order-old-price">${formatOrderVND(o.oldPrice)}</span>
          </div>
          <div class="order-date-line"><i class="fas fa-calendar-alt"></i> Ngày đặt: ${o.date}</div>
        </div>
      </div>
      ${showEscrow ? `
        <div style="margin-top:12px">
          <div class="escrow-progress-bar"><div class="escrow-progress-fill" style="width:${pct}%"></div></div>
          <div class="escrow-step-labels">${stepLabelsHtml}</div>
        </div>
      ` : ''}
      <div class="order-card-actions">${actionsHtml}</div>
    </div>
  `;
}

let currentOrderTab = 'all';

function renderOrders(tab){
  currentOrderTab = tab;
  const list = document.getElementById('ordersList');
  const filtered = tab === 'all' ? ordersData : ordersData.filter(o=>o.status===tab);
  if(filtered.length === 0){
    list.innerHTML = `<div class="empty-orders"><i class="fas fa-box-open"></i><p>Không có đơn hàng nào trong mục này.</p></div>`;
    return;
  }
  list.innerHTML = filtered.map(buildOrderCard).join('');
}

function switchTab(tab, el){
  document.querySelectorAll('.orders-tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  renderOrders(tab);
}

function switchTabById(tab){
  const tabs = document.querySelectorAll('.orders-tab');
  const map = {all:0,pending:1,shipping:2,delivered:3,cancelled:4};
  tabs.forEach(t=>t.classList.remove('active'));
  tabs[map[tab]].classList.add('active');
  renderOrders(tab);
}

function openOrders(){
  document.getElementById('ordersOverlay').classList.add('active');
  document.body.style.overflow='hidden';
  renderOrders('all');
}

function closeOrders(){
  document.getElementById('ordersOverlay').classList.remove('active');
  document.body.style.overflow='';
}

function confirmReceived(id){
  const order = ordersData.find(o=>o.id===id);
  if(!order) return;
  order.status='delivered';
  order.statusLabel='Đã nhận hàng';
  order.escrowStep=4;
  order.needReview=true;
  renderOrders(currentOrderTab);
  showToast('✅ Xác nhận thành công! Tiền đã được giải phóng cho người bán.','success');
}

function cancelOrder(id){
  const order = ordersData.find(o=>o.id===id);
  if(!order) return;
  order.status='cancelled';
  order.statusLabel='Đã huỷ';
  order.escrowStep=0;
  renderOrders(currentOrderTab);
  showToast('Đơn hàng đã được huỷ. Tiền hoàn lại trong 1-3 ngày làm việc.','warning');
}