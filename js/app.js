/**
 * APP — Nội Thất Đồng Nai
 * APP — Khởi tạo, điều hướng, phân quyền
 */

// ══════════════════════════════════════════════════════
// ĐIỀU HƯỚNG
// ══════════════════════════════════════════════════════
function gotoPage(id) {
  var r = currentUser.roleKey;
  if (ROLES[r].nav.indexOf(id) < 0) return;
  document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active'); });
  document.querySelectorAll('.nav-item').forEach(function(n){ n.classList.remove('active'); });
  document.getElementById('page-'+id).classList.add('active');
  var ni = document.getElementById('nav-'+id); if (ni) ni.classList.add('active');
  document.getElementById('page-title').textContent = PAGE_TITLES[id] || '';
  if (id==='materials') renderMatsTable();
  if (id==='users')     renderUsersTable();
  if (id==='quotes')    renderQuotesList();
}

// ══════════════════════════════════════════════════════
// TÍNH TOÁN KÍCH THƯỚC & KHỐI LƯỢNG (đơn vị nhập = mm)
// ══════════════════════════════════════════════════════
function unitMode(unit) {
  var u = (unit||'').toLowerCase().replace(/\s/g,'');
  if (u==='m²'||u==='m2'||u==='mvuong') return 'm2';
  if (u==='mdài'||u==='mdai'||u==='mdam') return 'ml';
  return 'manual';
}

// Tính KL từ mm → m² hoặc m dài
// r.d = Rộng (mm), r.w = Sâu (mm), r.h = Cao (mm)
// r.kitchenType: 'I' | 'L' | 'U'  (chỉ dùng cho m dài)
// r.d2 = cạnh 2 (mm), r.d3 = cạnh 3 (mm)  cho L/U
function calcKL(r) {
  var mode = unitMode(r.unit);
  if (mode === 'm2') {
    // m² = Rộng(mm) × Cao(mm) / 1,000,000  → đổi sang m²
    var w = r.d || 0;  // Rộng
    var h = r.h || 0;  // Cao
    return Math.round(w * h / 1000000 * 1000) / 1000;  // 3 decimal
  }
  if (mode === 'ml') {
    var ktype = r.kitchenType || 'I';
    var d1 = r.d  || 0;  // Chiều dài cạnh 1 (mm)
    var d2 = r.d2 || 0;  // Chiều dài cạnh 2 (mm)
    var d3 = r.d3 || 0;  // Chiều dài cạnh 3 (mm)
    var deep = r.w || 0; // Chiều sâu tủ (mm)
    var mm;
    if (ktype === 'L') {
      // (cạnh 1 + cạnh 2) - chiều sâu
      mm = (d1 + d2) - deep;
    } else if (ktype === 'U') {
      // (cạnh 1 + cạnh 2 + cạnh 3) - 2 × chiều sâu
      mm = (d1 + d2 + d3) - 2 * deep;
    } else {
      // Chữ I: chỉ cần chiều dài
      mm = d1;
    }
    return Math.round(Math.max(0, mm) / 1000 * 1000) / 1000;  // 3 decimal, m
  }
  return r.qty || 1;
}

// Chuỗi hiển thị kích thước trong PDF (mm)
function dimDisplay(r) {
  var mode = unitMode(r.unit);
  if (mode === 'm2') {
    if (!r.d && !r.h) return '';
    return (r.d||0) + ' × ' + (r.w||0) + (r.h ? ' × ' + r.h : '') + ' mm';
  }
  if (mode === 'ml') {
    var ktype = r.kitchenType || 'I';
    if (ktype === 'L') return 'L: ' + (r.d||0) + ' + ' + (r.d2||0) + ' - sâu ' + (r.w||0) + ' mm';
    if (ktype === 'U') return 'U: ' + (r.d||0) + ' + ' + (r.d2||0) + ' + ' + (r.d3||0) + ' - 2×' + (r.w||0) + ' mm';
    return (r.d||0) + ' mm';
  }
  return '';
}


// Kiểm tra Google SDK đã load chưa khi trang mở
window.addEventListener('load', function() {
  // Nếu Google SDK chưa load sau 3s, show fallback
  setTimeout(function() {
    var btnEl = document.getElementById('google-signin-btn');
    var notCfgEl = document.getElementById('google-not-cfg');
    if (notCfgEl && btnEl) {
      var hasGoogleBtn = btnEl.querySelector('iframe, div[role="button"]');
      var clientIdSet = typeof GOOGLE_CLIENT_ID !== 'undefined' &&
                        !GOOGLE_CLIENT_ID.includes('YOUR_GOOGLE');
      if (!hasGoogleBtn && clientIdSet) {
        // SDK load nhưng chưa render được nút
        notCfgEl.style.display = 'block';
        btnEl.style.display = 'none';
      }
      if (!clientIdSet) {
        notCfgEl.style.display = 'block';
        btnEl.style.display = 'none';
      }
    }
  }, 3000);
});

// Tải users từ Sheet ngay khi trang mở
window.addEventListener('load', function() {
  if (typeof GAS_URL !== 'undefined' && GAS_URL && !GAS_URL.includes('YOUR_GAS')) {
    loadUsersFromSheet();
  }
});
