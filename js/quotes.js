/**
 * QUOTES — Nội Thất Đồng Nai
 * QUOTES — Danh sách BG, lưu, duyệt, ký, xóa
 */

// ══════════════════════════════════════════════════════
// DANH SÁCH BÁO GIÁ
// ══════════════════════════════════════════════════════
function renderQuotesList() {
  var r = currentUser.roleKey;
  var q = (document.getElementById('q-search').value||'').toLowerCase();
  var f = document.getElementById('q-filter').value;
  var list = quotes.filter(function(qt) {
    if (f && qt.status!==f) return false;
    if (q && !qt.cust.toLowerCase().includes(q) && !qt.id.toLowerCase().includes(q)) return false;
    return true;
  });
  var tbody = document.getElementById('quotes-tbody');
  if (!tbody) return;
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text3);">Không có báo giá nào</td></tr>';
    return;
  }
  tbody.innerHTML = '';
  list.forEach(function(qt) {
    var approvedInfo = qt.approvedBy ? '<br><span style="font-size:10px;color:var(--text3);">Duyệt: '+qt.approvedBy+'</span>' : '';
    var signedInfo   = qt.signedBy   ? '<br><span style="font-size:10px;color:var(--green-fg);">Ký: '+qt.signedBy+'</span>'    : '';
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td style="color:var(--gold2);font-weight:500;">'+qt.id+'</td>'+
      '<td>'+qt.cust+'</td>'+
      '<td>'+qt.addr+'</td>'+
      '<td>'+fmt(qt.value)+' đ</td>'+
      '<td>'+qt.staff+'</td>'+
      '<td>'+qt.created+'</td>'+
      '<td><span class="badge '+STATUS_BADGE[qt.status]+'">'+STATUS_LABELS[qt.status]+'</span>'+approvedInfo+signedInfo+'</td>'+
      '<td class="q-actions"></td>';
    var td = tr.querySelector('.q-actions');
    var btnPDF = document.createElement('span');
    btnPDF.className = 'alink'; btnPDF.textContent = 'PDF';
    btnPDF.onclick = (function(id){ return function(){ viewQuotePDF(id); }; })(qt.id);
    td.appendChild(btnPDF);
    if (r!=='staff' && qt.status==='pending') {
      var sp = document.createElement('span'); sp.innerHTML = ' &nbsp;';
      td.appendChild(sp);
      var btnA = document.createElement('span');
      btnA.className = 'alink'; btnA.style.color = 'var(--green-fg)'; btnA.textContent = '✓ Duyệt';
      btnA.onclick = (function(id){ return function(){ approveQuoteById(id); }; })(qt.id);
      td.appendChild(btnA);
    }
    if ((r==='admin'||r==='manager') && qt.status==='approved') {
      var sp = document.createElement('span'); sp.innerHTML = ' &nbsp;';
      td.appendChild(sp);
      var btnS = document.createElement('span');
      btnS.className = 'alink'; btnS.style.color = 'var(--blue-fg)'; btnS.textContent = '✎ Ký';
      btnS.onclick = (function(id){ return function(){ signQuoteById(id); }; })(qt.id);
      td.appendChild(btnS);
    }
    if (r==='admin') {
      var sp = document.createElement('span'); sp.innerHTML = ' &nbsp;';
      td.appendChild(sp);
      var btnX = document.createElement('span');
      btnX.className = 'alink'; btnX.style.color = 'var(--red-fg)'; btnX.textContent = 'Xóa';
      btnX.onclick = (function(id){ return function(){ deleteQuoteById(id); }; })(qt.id);
      td.appendChild(btnX);
    }
    tbody.appendChild(tr);
  });
}

function viewQuotePDF(id) {
  var qt = quotes.find(function(x){return x.id===id;});
  if (!qt) return;
  quoteRows = JSON.parse(JSON.stringify(qt.rows||[]));
  buildPDF();
  var custEl = document.getElementById('pdf-cust');
  if (custEl) custEl.innerHTML = '<div style="font-size:9px;color:#999;text-transform:uppercase;">Kính gửi</div><div style="font-size:13px;font-weight:500;margin-top:2px;">'+qt.cust+'</div><div style="font-size:10px;color:#666;margin-top:1px;">'+qt.addr+' · '+qt.phone+'</div>';
  gotoPage('preview');
}
function approveQuoteById(id) {
  var qt = quotes.find(function(x){return x.id===id;});
  if (!qt || qt.status!=='pending') return;
  qt.status='approved'; qt.approvedBy=currentUser.name;
  updateQuoteStatusOnSheet(id, 'approved', currentUser.name);
  renderQuotesList(); showToast('Đã duyệt báo giá '+id);
}
function signQuoteById(id) {
  var qt = quotes.find(function(x){return x.id===id;});
  if (!qt) return;
  qt.status='signed'; qt.signedBy=currentUser.name;
  updateQuoteStatusOnSheet(id, 'signed', currentUser.name);
  renderQuotesList(); showToast('Đã ký xác nhận báo giá '+id);
}
function showConfirm(msg, onOk) {
  document.getElementById('confirm-msg').textContent = msg;
  document.getElementById('confirm-ok-btn').onclick = function() { closeConfirm(); onOk(); };
  document.getElementById('confirm-overlay').classList.add('open');
}
function closeConfirm() {
  document.getElementById('confirm-overlay').classList.remove('open');
}
function deleteQuoteById(id) {
  showConfirm('Xóa báo giá ' + id + '? Hành động này không thể hoàn tác.', function() {
    quotes = quotes.filter(function(x){ return x.id !== id; });
    deleteQuoteFromSheet(id);
    renderQuotesList();
    showToast('Đã xóa báo giá ' + id);
  });
}

// ══════════════════════════════════════════════════════
// LƯU / DUYỆT BÁO GIÁ (từ form tạo mới)
// ══════════════════════════════════════════════════════
function getFormQuoteData(status) {
  var cust = document.getElementById('q-cust').value.trim();
  if (!cust) { alert('Vui lòng nhập tên khách hàng!'); return null; }
  var sub = quoteRows.reduce(function(s,r) {
    if (r.isSection) return s;
    var mode=unitMode(r.unit), kl=calcKL(r), sl=parseFloat(r.sl)||1;
    return s + (mode==='manual' ? (r.qty||1)*(r.price||0) : kl*sl*(r.price||0));
  }, 0);
  var vatRate = parseFloat(document.getElementById('vat-rate').value)||0;
  var dp      = parseFloat(document.getElementById('discount').value)||0;
  var vat     = Math.round(sub*vatRate);
  var disc    = Math.round(sub*dp/100);
  return {
    id:      'BG-2026-0'+quoteNextId,
    cust:    cust,
    phone:   document.getElementById('q-phone').value.trim(),
    email:   document.getElementById('q-email').value.trim(),
    addr:    document.getElementById('q-addr').value.trim(),
    type:    document.getElementById('q-type').value,
    expires: document.getElementById('q-expires').value,
    staff:   currentUser.name, staffId: currentUser.id,
    created: new Date().toLocaleDateString('vi-VN'),
    status:  status,
    value:   sub+vat-disc,
    discount:dp, vatRate:vatRate,
    rows:    JSON.parse(JSON.stringify(quoteRows)),
    approvedBy:'', signedBy:''
  };
}
function saveQuote(status) {
  var qt = getFormQuoteData(status);
  if (!qt) return;
  quotes.unshift(qt);
  quoteNextId++;
  saveQuoteToSheet(qt);
  ['q-cust','q-phone','q-email','q-addr'].forEach(function(id){ document.getElementById(id).value=''; });
  quoteRows = []; renderQuoteTable();
  showToast(status==='draft' ? 'Đã lưu nháp '+qt.id : 'Đã tạo báo giá '+qt.id+' – chờ duyệt');
  if (status!=='draft') gotoPage('quotes');
}
function approveQuote() {
  var qt = getFormQuoteData('approved');
  if (!qt) return;
  qt.approvedBy = currentUser.name;
  quotes.unshift(qt); quoteNextId++;
  ['q-cust','q-phone','q-email','q-addr'].forEach(function(id){ document.getElementById(id).value=''; });
  quoteRows = []; renderQuoteTable();
  showToast('Đã tạo & duyệt báo giá '+qt.id);
  gotoPage('quotes');
}

