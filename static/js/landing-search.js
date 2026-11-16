/* ============================================================
   LandingSearch - thanh tìm kiếm của STD Market
   - tìm KHÔNG DẤU, nhiều từ khóa (gõ "ao thun" vẫn ra "Áo thun")
   - hộp gợi ý khi gõ: ảnh, tên (làm nổi bật từ khóa), giá, tình trạng, khu vực
   - điều khiển bằng bàn phím: ↑ ↓ chọn, Enter mở / tìm tất cả, Esc đóng
   - nút xóa nhanh từ khóa
   Gợi ý lấy từ API  GET /landing/search/suggest/?q=...  (xem landing/views.py)
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------- Bỏ dấu tiếng Việt ----------
     Mỗi ký tự được đổi riêng và LUÔN giữ nguyên độ dài, nhờ vậy vị trí tìm thấy trong chuỗi
     đã bỏ dấu khớp đúng với chuỗi gốc (cần cho việc làm nổi bật từ khóa). */
  function foldChar(ch) {
    let r = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (ch === 'đ' || ch === 'Đ') r = 'd';
    r = r.toLowerCase();
    return r.length === ch.length ? r : ch;
  }

  function fold(text) {
    let out = '';
    for (const ch of String(text == null ? '' : text).normalize('NFC')) out += foldChar(ch);
    return out;
  }

  /* Tách câu tìm kiếm thành các từ khóa đã bỏ dấu. */
  function tokens(query) {
    return fold(query).split(/\s+/).filter(Boolean);
  }

  /* Mọi từ khóa đều phải xuất hiện trong `haystack`. Không có từ khóa = khớp tất cả. */
  function matchesAll(haystack, toks) {
    const h = fold(haystack);
    return toks.every(t => h.includes(t));
  }

  /* Ghi `text` vào phần tử `el`, bọc các đoạn khớp từ khóa trong <mark> (dựng bằng DOM,
     không dùng innerHTML nên tên sản phẩm do người bán nhập không thể chèn mã độc). */
  function appendHighlighted(el, text, toks) {
    const s = String(text == null ? '' : text).normalize('NFC');
    const f = fold(s);
    const marked = new Array(s.length).fill(false);
    toks.forEach(t => {
      if (!t) return;
      let i = f.indexOf(t);
      while (i !== -1) {
        for (let k = i; k < i + t.length; k++) marked[k] = true;
        i = f.indexOf(t, i + t.length);
      }
    });
    let i = 0;
    while (i < s.length) {
      let j = i;
      const on = marked[i];
      while (j < s.length && marked[j] === on) j++;
      const piece = s.slice(i, j);
      if (on) {
        const m = document.createElement('mark');
        m.textContent = piece;
        el_append(el, m);
      } else {
        el_append(el, document.createTextNode(piece));
      }
      i = j;
    }
  }

  function el_append(parent, child) { parent.appendChild(child); }

  function make(tag, className) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    return e;
  }

  function formatPrice(n) {
    return (Number(n) || 0).toLocaleString('vi-VN') + 'đ';
  }

  /* ---------- Gắn hộp gợi ý vào 1 thanh tìm kiếm ----------
     bar     : phần tử .search-bar, cần có data-suggest-url (và action="..." nếu là <form>
               để "Xem tất cả" biết trang kết quả)
     options : { debounce, onSubmit(q), onViewAll(q) } - có thể bỏ trống
               onSubmit  : gọi khi bấm Enter mà chưa chọn mục nào (mặc định: form tự gửi đi)
               onViewAll : gọi khi bấm "Xem tất cả" (mặc định: chuyển trang kết quả) */
  function attach(bar, options) {
    if (!bar || bar.dataset.lsReady) return null;
    const input = bar.querySelector('input[type="text"]');
    const suggestUrl = bar.dataset.suggestUrl;
    if (!input || !suggestUrl) return null;
    bar.dataset.lsReady = '1';
    options = options || {};
    const allUrl = bar.getAttribute('action') || bar.dataset.allUrl || '';

    const dropdown = make('div', 'ls-dropdown');
    dropdown.setAttribute('role', 'listbox');
    dropdown.hidden = true;
    bar.appendChild(dropdown);

    const clearBtn = make('button', 'ls-clear');
    clearBtn.type = 'button';
    clearBtn.setAttribute('aria-label', 'Xóa từ khóa');
    clearBtn.textContent = '×';
    clearBtn.hidden = !input.value;
    bar.appendChild(clearBtn);

    let timer = null;
    let seq = 0;        // số thứ tự yêu cầu: bỏ qua kết quả của yêu cầu cũ trả về chậm
    let links = [];
    let active = -1;

    function open() { dropdown.hidden = false; }
    function close() { dropdown.hidden = true; active = -1; links.forEach(l => l.classList.remove('is-active')); }

    function setActive(idx) {
      links.forEach(l => { l.classList.remove('is-active'); l.setAttribute('aria-selected', 'false'); });
      active = idx;
      const cur = links[idx];
      if (!cur) return;
      cur.classList.add('is-active');
      cur.setAttribute('aria-selected', 'true');
      if (cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest' });
    }

    function viewAllHref(q) {
      return allUrl + (allUrl.indexOf('?') === -1 ? '?' : '&') + 'q=' + encodeURIComponent(q);
    }

    function render(data, q) {
      dropdown.textContent = '';
      links = [];
      active = -1;
      const toks = tokens(q);
      const results = data.results || [];

      if (!results.length) {
        const empty = make('div', 'ls-empty');
        empty.textContent = 'Không tìm thấy sản phẩm nào cho “' + q + '”. Thử bỏ bớt từ khóa nhé.';
        dropdown.appendChild(empty);
        open();
        return;
      }

      results.forEach((r, idx) => {
        const a = make('a', 'ls-item');
        a.href = r.url;
        a.setAttribute('role', 'option');

        const thumb = make('span', 'ls-thumb');
        if (r.image) {
          const img = document.createElement('img');
          img.alt = '';
          img.loading = 'lazy';
          img.addEventListener('error', () => { img.remove(); thumb.classList.add('ls-noimg'); });
          img.src = r.image;
          thumb.appendChild(img);
        } else {
          thumb.classList.add('ls-noimg');
        }

        const body = make('span', 'ls-body');
        const name = make('span', 'ls-name');
        appendHighlighted(name, r.name, toks);
        const meta = make('span', 'ls-meta');
        meta.textContent = [r.condition, r.location].filter(Boolean).join(' · ');
        body.appendChild(name);
        body.appendChild(meta);

        const price = make('span', 'ls-price');
        price.textContent = formatPrice(r.price);

        a.appendChild(thumb);
        a.appendChild(body);
        a.appendChild(price);
        a.addEventListener('mouseenter', () => setActive(idx));
        dropdown.appendChild(a);
        links.push(a);
      });

      const all = make('a', 'ls-all');
      all.href = viewAllHref(q);
      all.textContent = 'Xem tất cả ' + data.total + ' kết quả →';
      all.addEventListener('click', e => {
        if (options.onViewAll) { e.preventDefault(); close(); options.onViewAll(q); }
      });
      all.addEventListener('mouseenter', () => setActive(links.indexOf(all)));
      dropdown.appendChild(all);
      links.push(all);
      open();
    }

    function request(q) {
      const mine = ++seq;
      fetch(suggestUrl + '?q=' + encodeURIComponent(q), {
        credentials: 'same-origin',
        headers: { 'Accept': 'application/json' }
      })
        .then(res => (res.ok ? res.json() : Promise.reject(new Error('HTTP ' + res.status))))
        .then(data => {
          if (mine !== seq) return;                 // đã có yêu cầu mới hơn
          if (input.value.trim() !== q) return;     // người dùng đã gõ tiếp / xóa
          render(data, q);
        })
        .catch(() => { if (mine === seq) close(); });
    }

    input.addEventListener('input', () => {
      const q = input.value.trim();
      clearBtn.hidden = !input.value;
      clearTimeout(timer);
      if (!q) { seq++; close(); return; }
      timer = setTimeout(() => request(q), options.debounce != null ? options.debounce : 250);
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') {
        if (!links.length) return;
        e.preventDefault();
        if (dropdown.hidden) open();
        setActive(active + 1 >= links.length ? 0 : active + 1);
      } else if (e.key === 'ArrowUp') {
        if (!links.length) return;
        e.preventDefault();
        setActive(active - 1 < 0 ? links.length - 1 : active - 1);
      } else if (e.key === 'Enter') {
        if (e.isComposing) return;                  // gõ Telex/VNI: Enter chỉ chốt chữ đang gõ dở
        if (active >= 0 && links[active]) {
          e.preventDefault();
          links[active].click();                    // mở sản phẩm (hoặc "Xem tất cả") đang chọn
          return;
        }
        if (options.onSubmit) {
          e.preventDefault();
          close();
          options.onSubmit(input.value.trim());
        }
        // không có onSubmit: <form> tự gửi GET tới trang kết quả
      } else if (e.key === 'Escape') {
        close();
      }
    });

    input.addEventListener('focus', () => {
      if (links.length && input.value.trim()) open();
    });

    clearBtn.addEventListener('click', () => {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));   // để các bộ lọc khác cũng được xóa
      input.focus();
    });

    document.addEventListener('click', e => {
      if (!bar.contains(e.target)) close();
    });

    return {
      close: close,
      // gọi khi code khác tự đổi giá trị ô tìm kiếm (VD điền sẵn từ ?q=) để cập nhật nút xóa
      refresh: function () { clearBtn.hidden = !input.value; }
    };
  }

  global.LandingSearch = { fold: fold, tokens: tokens, matchesAll: matchesAll, attach: attach };
})(window);
