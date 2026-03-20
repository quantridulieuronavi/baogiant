/**
 * API — Nội Thất Đồng Nai
 * Toàn bộ giao tiếp với Google Apps Script / Google Sheets
 *
 * ⚠️ Thay GAS_URL sau khi deploy Apps Script:
 *    script.google.com → Deploy → Web App → Copy URL
 */

var GAS_URL = 'https://script.google.com/macros/s/AKfycbyUaDgp6JQlBE-RahEQENG4SZ5GX-oQR7J5B3_OtZU5fXWvNop-e3aQ1_ycI9r1kgZt0w/exec';

// ── Trạng thái kết nối ───────────────────────────────────────
var gasConnected = false;   // true sau khi ping thành công
var gasLoading   = false;   // đang gọi API

// ── HELPER: POST ─────────────────────────────────────────────
function gasPost(action, data) {
  return fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: action, data: data })
  })
  .then(function(res) { return res.json(); })
  .catch(function(err) {
    console.error('[GAS POST] ' + action, err);
    return { ok: false, error: err.message };
  });
}

// ── HELPER: GET ──────────────────────────────────────────────
function gasGet(params) {
  var url = GAS_URL + '?' + Object.keys(params)
    .map(function(k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); })
    .join('&');
  return fetch(url)
    .then(function(res) { return res.json(); })
    .catch(function(err) {
      console.error('[GAS GET]', err);
      return { ok: false, error: err.message };
    });
}

// ── KIỂM TRA KẾT NỐI ─────────────────────────────────────────
function checkGasConnection() {
  if (!GAS_URL || GAS_URL === 'YOUR_GAS_WEB_APP_URL') {
    updateConnectionBadge(false, 'Chưa cấu hình GAS URL');
    return;
  }
  gasGet({ action: 'ping' })
    .then(function(res) {
      gasConnected = res.ok !== false;
      updateConnectionBadge(gasConnected, gasConnected ? 'Google Sheets' : 'Lỗi kết nối');
    });
}

function updateConnectionBadge(connected, label) {
  var el = document.getElementById('gas-badge');
  if (!el) return;
  el.textContent = (connected ? '🟢 ' : '🔴 ') + label;
  el.title = connected
    ? 'Đã kết nối Google Sheets — dữ liệu được lưu tự động'
    : 'Chưa kết nối — dữ liệu chỉ lưu trong phiên làm việc này';
}

// ════════════════════════════════════════════════════════════
// VẬT TƯ
// ════════════════════════════════════════════════════════════

/** Tải vật tư từ Google Sheets về (gọi khi khởi động app) */
function loadMaterialsFromSheet() {
  if (!GAS_URL || GAS_URL === 'YOUR_GAS_WEB_APP_URL') return;
  showToast('⏳ Đang tải danh mục vật tư...');
  gasGet({ action: 'getMaterials' })
    .then(function(res) {
      if (res.ok && res.materials && res.materials.length) {
        materials = res.materials.map(function(m) {
          return {
            id:    parseInt(m.id) || m.id,
            name:  m.name  || '',
            desc:  m.desc  || '',
            cat:   m.cat   || '',
            unit:  m.unit  || 'cái',
            price: parseFloat(m.price) || 0,
            note:  m.note  || ''
          };
        });
        matNextId = Math.max.apply(null, materials.map(function(m){ return m.id||0; })) + 1;
        renderMatsTable();
        showToast('✅ Đã tải ' + materials.length + ' vật tư từ Google Sheets');
      } else {
        showToast('ℹ️ Sheet vật tư chưa có dữ liệu');
      }
    });
}

/** Đồng bộ toàn bộ vật tư hiện tại lên Sheet */
function syncMaterialsToSheet() {
  if (!GAS_URL || GAS_URL === 'YOUR_GAS_WEB_APP_URL') {
    showToast('⚠️ Chưa cấu hình GAS_URL trong js/api.js');
    return;
  }
  showToast('⏳ Đang đồng bộ ' + materials.length + ' vật tư...');
  gasPost('syncMaterials', materials)
    .then(function(res) {
      if (res.ok !== false) {
        showToast('✅ Đã đồng bộ ' + materials.length + ' vật tư lên Google Sheets');
      } else {
        showToast('❌ Lỗi đồng bộ: ' + (res.error || 'Không xác định'));
      }
    });
}

/** Lưu/sửa 1 vật tư lên Sheet */
function saveMaterialToSheet(mat) {
  if (!GAS_URL || GAS_URL === 'YOUR_GAS_WEB_APP_URL') return;
  gasPost('saveMaterial', mat);
}

/** Xóa 1 vật tư khỏi Sheet */
function deleteMaterialFromSheet(id) {
  if (!GAS_URL || GAS_URL === 'YOUR_GAS_WEB_APP_URL') return;
  gasPost('deleteMaterial', { id: id });
}

// ════════════════════════════════════════════════════════════
// BÁO GIÁ
// ════════════════════════════════════════════════════════════

/** Tải danh sách báo giá từ Sheet */
function loadQuotesFromSheet() {
  if (!GAS_URL || GAS_URL === 'YOUR_GAS_WEB_APP_URL') return;
  showToast('⏳ Đang tải danh sách báo giá...');
  gasGet({ action: 'getQuotes' })
    .then(function(res) {
      if (res.ok && res.quotes && res.quotes.length) {
        // Map từ header tiếng Việt → object
        quotes = res.quotes.map(function(q) {
          return {
            id:         q['Mã BG']          || '',
            cust:       q['Khách hàng']      || '',
            phone:      q['Điện thoại']      || '',
            email:      q['Email']           || '',
            addr:       q['Địa chỉ']         || '',
            type:       q['Loại CT']         || '',
            staff:      q['NV phụ trách']    || '',
            created:    q['Ngày tạo']        || '',
            expires:    q['Hiệu lực']        || '',
            status:     q['Trạng thái']      || 'draft',
            discount:   parseFloat(q['Giảm giá %']) || 0,
            vatRate:    (parseFloat(q['VAT %']) || 8) / 100,
            value:      parseFloat(q['Tổng cộng'])  || 0,
            approvedBy: q['Người duyệt']     || '',
            signedBy:   q['Người ký']        || '',
            rows:       []   // rows tải riêng nếu cần
          };
        });
        // Sắp xếp mới nhất lên đầu
        quotes.sort(function(a,b){ return b.id > a.id ? 1 : -1; });
        renderQuotesList();
        showToast('✅ Đã tải ' + quotes.length + ' báo giá');
      }
    });
}

/** Lưu báo giá lên Sheet (gọi sau saveQuote) */
function saveQuoteToSheet(qt) {
  if (!GAS_URL || GAS_URL === 'YOUR_GAS_WEB_APP_URL') return;
  // Tính lại subtotal để gửi lên
  var sub = qt.rows ? qt.rows.reduce(function(s, r) {
    if (r.isSection) return s;
    var mode = unitMode(r.unit);
    var kl   = calcKL(r);
    var sl   = parseFloat(r.sl) || 1;
    return s + (mode === 'manual' ? (r.qty||1)*(r.price||0) : kl*sl*(r.price||0));
  }, 0) : 0;
  var vatAmt  = Math.round(sub * (qt.vatRate || 0));
  var discAmt = Math.round(sub * (qt.discount || 0) / 100);
  gasPost('saveQuote', Object.assign({}, qt, {
    subtotal: Math.round(sub),
    vat:      vatAmt,
    total:    Math.round(sub + vatAmt - discAmt)
  }));
}

/** Cập nhật trạng thái báo giá lên Sheet */
function updateQuoteStatusOnSheet(id, status, by) {
  if (!GAS_URL || GAS_URL === 'YOUR_GAS_WEB_APP_URL') return;
  var data = { id: id, status: status, by: by };
  if (status === 'approved') data.approvedBy = by;
  if (status === 'signed')   data.signedBy   = by;
  gasPost('updateStatus', data);
}

/** Xóa báo giá khỏi Sheet */
function deleteQuoteFromSheet(id) {
  if (!GAS_URL || GAS_URL === 'YOUR_GAS_WEB_APP_URL') return;
  gasPost('deleteQuote', { id: id });
}

// ════════════════════════════════════════════════════════════
// NGƯỜI DÙNG
// ════════════════════════════════════════════════════════════

/** Tải danh sách user từ Sheet */
function loadUsersFromSheet(onDone) {
  if (!GAS_URL || GAS_URL === 'YOUR_GAS_WEB_APP_URL') {
    if (onDone) onDone(false);
    return Promise.resolve(false);
  }
  return gasGet({ action: 'getUsers' })
    .then(function(res) {
      if (res.ok && res.users && res.users.length) {
        users = res.users.map(function(u) {
          return {
            id:       parseInt(u['ID'])   || u['ID'],
            name:     u['Họ tên']         || '',
            email:    u['Email']          || '',
            role:     u['Vai trò']        || 'staff',
            status:   u['Trạng thái']     || 'active',
            created:  u['Ngày tạo']       || '',
            password: u['Mật khẩu']       || ''
          };
        });
        userNextId = Math.max.apply(null, users.map(function(u){ return u.id||0; })) + 1;
        if (onDone) onDone(true);
        return true;
      }
      if (onDone) onDone(false);
      return false;
    })
    .catch(function() {
      if (onDone) onDone(false);
      return false;
    });
}

/** Lưu user lên Sheet */
function saveUserToSheet(user) {
  if (!GAS_URL || GAS_URL === 'YOUR_GAS_WEB_APP_URL') return;
  gasPost('saveUser', user);
}

/** Xóa user khỏi Sheet */
function deleteUserFromSheet(id) {
  if (!GAS_URL || GAS_URL === 'YOUR_GAS_WEB_APP_URL') return;
  gasPost('deleteUser', { id: id });
}
