// ============================================================
// CODE.GS — Google Apps Script · Nội Thất Đồng Nai v2.0
// Database backend cho phần mềm báo giá
// ============================================================
// HƯỚNG DẪN DEPLOY:
//  1. Mở Google Sheet mới
//  2. Extensions → Apps Script → dán toàn bộ code này vào
//  3. Chạy setupSheets() MỘT LẦN để tạo cấu trúc sheet
//  4. Deploy → New deployment → Web App
//     - Execute as: Me
//     - Who has access: Anyone
//  5. Copy URL → dán vào js/api.js (biến GAS_URL)
// ============================================================

const SHEET_QUOTES    = 'BaoGia';
const SHEET_ROWS      = 'HangMuc';
const SHEET_MATERIALS = 'VatTu';
const SHEET_USERS     = 'NguoiDung';
const SHEET_LOG       = 'NhatKy';

const HEADERS = {
  [SHEET_QUOTES]: [
    'Mã BG','Khách hàng','Điện thoại','Email','Địa chỉ','Loại CT',
    'NV phụ trách','Ngày tạo','Hiệu lực','Trạng thái','Giảm giá %',
    'VAT %','Tạm tính','VAT','Tổng cộng','Người duyệt','Người ký','Ghi chú'
  ],
  [SHEET_ROWS]: [
    'Mã BG','STT','Tiêu đề phòng','Tên hạng mục','Mô tả chi tiết',
    'ĐVT','Rộng (mm)','Sâu (mm)','Cao (mm)','KL','SL','Đơn giá','Thành tiền','Ghi chú'
  ],
  [SHEET_MATERIALS]: [
    'ID','Tên vật tư','Mô tả chi tiết','Danh mục','ĐVT','Đơn giá','Ghi chú','Ngày cập nhật'
  ],
  [SHEET_USERS]: [
    'ID','Họ tên','Email','Vai trò','Trạng thái','Ngày tạo','Mật khẩu'
  ],
  [SHEET_LOG]: [
    'Thời gian','Người dùng','Hành động','Mã BG','Chi tiết'
  ]
};

// ─────────────────────────────────────────────────────────────
// SETUP — chạy một lần để tạo sheet & định dạng
// ─────────────────────────────────────────────────────────────
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(HEADERS).forEach(name => {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    sh.clearContents();
    sh.getRange(1, 1, 1, HEADERS[name].length).setValues([HEADERS[name]]);
    const hdr = sh.getRange(1, 1, 1, HEADERS[name].length);
    hdr.setBackground('#1a1a2e').setFontColor('#c9a96e').setFontWeight('bold').setFontSize(11);
    sh.setFrozenRows(1);
  });

  // Column widths BaoGia
  [80,150,110,150,200,100,130,90,90,90,70,60,110,100,110,130,130,120]
    .forEach((w,i) => ss.getSheetByName(SHEET_QUOTES).setColumnWidth(i+1,w));

  // Column widths HangMuc
  [80,40,160,200,280,60,70,70,70,60,50,100,110,160]
    .forEach((w,i) => ss.getSheetByName(SHEET_ROWS).setColumnWidth(i+1,w));

  // Column widths VatTu
  [50,220,300,130,70,100,180,110]
    .forEach((w,i) => ss.getSheetByName(SHEET_MATERIALS).setColumnWidth(i+1,w));

  // Column widths NguoiDung
  [40,160,200,90,90,100,100]
    .forEach((w,i) => ss.getSheetByName(SHEET_USERS).setColumnWidth(i+1,w));

  SpreadsheetApp.getUi().alert(
    '✅ Đã tạo xong 5 sheet!\n\n' +
    'Tiếp theo:\n' +
    '1. Deploy → New deployment → Web App\n' +
    '   Execute as: Me | Access: Anyone\n' +
    '2. Copy URL → dán vào js/api.js (biến GAS_URL)'
  );
}

// ─────────────────────────────────────────────────────────────
// WEB APP ENDPOINTS
// ─────────────────────────────────────────────────────────────
function doGet(e) {
  const action = (e.parameter && e.parameter.action) || '';
  let result;
  try {
    switch(action) {
      case 'ping':         result = {ok:true, msg:'Nội Thất Đồng Nai API v2.0'}; break;
      case 'getMaterials': result = getMaterials(); break;
      case 'getQuotes':    result = getQuotes(e.parameter); break;
      case 'getUsers':     result = getUsers(); break;
      default:             result = {ok:true, msg:'Nội Thất Đồng Nai API v2.0'};
    }
  } catch(err) {
    result = {ok:false, error: err.message};
  }
  return jsonOut(result);
}

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); }
  catch(err) { return jsonOut({ok:false, error:'Invalid JSON'}); }
  let result;
  try {
    switch(body.action) {
      case 'saveQuote':      result = saveQuote(body.data);      break;
      case 'updateStatus':   result = updateStatus(body.data);   break;
      case 'deleteQuote':    result = deleteQuote(body.data.id); break;
      case 'saveMaterial':   result = saveMaterial(body.data);   break;
      case 'deleteMaterial': result = deleteMaterial(body.data.id); break;
      case 'syncMaterials':  result = syncMaterials(body.data);  break;
      case 'saveUser':       result = saveUser(body.data);       break;
      case 'deleteUser':     result = deleteUser(body.data.id);  break;
      default: result = {ok:false, error:'Unknown action: '+body.action};
    }
  } catch(err) {
    writeLog({user:'system', action:'ERROR', quoteId:'', detail:err.message});
    result = {ok:false, error: err.message};
  }
  return jsonOut(result);
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─────────────────────────────────────────────────────────────
// BÁO GIÁ
// ─────────────────────────────────────────────────────────────
function saveQuote(data) {
  const ss  = SpreadsheetApp.getActiveSpreadsheet();
  const qSh = ss.getSheetByName(SHEET_QUOTES);
  const rSh = ss.getSheetByName(SHEET_ROWS);

  const qRow = [
    data.id, data.cust, data.phone||'', data.email||'', data.addr||'', data.type||'',
    data.staff||'', data.created||'', data.expires||'', data.status||'draft',
    data.discount||0, Math.round((data.vatRate||0)*100),
    data.subtotal||0, data.vat||0, data.total||0,
    data.approvedBy||'', data.signedBy||'', data.remark||''
  ];

  const existing = findRow(qSh, data.id, 0);
  if (existing > 0) {
    qSh.getRange(existing, 1, 1, qRow.length).setValues([qRow]);
    deleteRowsByKey(rSh, data.id, 0);
  } else {
    qSh.appendRow(qRow);
  }
  const rowNum = existing > 0 ? existing : qSh.getLastRow();
  applyStatusColor(qSh, rowNum, data.status);

  // Lưu hạng mục
  if (data.rows && data.rows.length) {
    let section = '', itemNum = 0;
    data.rows.forEach(r => {
      if (r.isSection) { section = r.name; return; }
      itemNum++;
      const kl = calcKL(r);
      const sl = parseFloat(r.sl)||1;
      rSh.appendRow([
        data.id, itemNum, section, r.name||'', r.desc||'',
        r.unit||'', r.d||0, r.w||0, r.h||0,
        kl, sl, r.price||0, kl*sl*(r.price||0), r.note||''
      ]);
    });
  }

  writeLog({user:data.staff||'?', action: existing>0 ? 'Cập nhật BG' : 'Tạo BG', quoteId:data.id, detail:data.cust});
  return {ok:true, id:data.id};
}

function getQuotes(params) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_QUOTES);
  const data = sh.getDataRange().getValues();
  if (data.length < 2) return {ok:true, quotes:[]};
  const headers = data[0];
  let quotes = data.slice(1)
    .filter(row => row[0]) // bỏ dòng trống
    .map(row => {
      const obj = {};
      headers.forEach((h,i) => obj[h] = row[i]);
      return obj;
    });
  if (params && params.status) quotes = quotes.filter(q => q['Trạng thái'] === params.status);
  return {ok:true, quotes};
}

function updateStatus(data) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_QUOTES);
  const row = findRow(sh, data.id, 0);
  if (row < 2) return {ok:false, error:'Không tìm thấy báo giá '+data.id};
  const H = HEADERS[SHEET_QUOTES];
  sh.getRange(row, H.indexOf('Trạng thái')+1).setValue(data.status);
  if (data.approvedBy) sh.getRange(row, H.indexOf('Người duyệt')+1).setValue(data.approvedBy);
  if (data.signedBy)   sh.getRange(row, H.indexOf('Người ký')+1).setValue(data.signedBy);
  applyStatusColor(sh, row, data.status);
  writeLog({user:data.by||'?', action:'Trạng thái → '+data.status, quoteId:data.id, detail:''});
  return {ok:true};
}

function deleteQuote(id) {
  const ss  = SpreadsheetApp.getActiveSpreadsheet();
  deleteRowsByKey(ss.getSheetByName(SHEET_QUOTES), id, 0);
  deleteRowsByKey(ss.getSheetByName(SHEET_ROWS),   id, 0);
  writeLog({user:'admin', action:'Xóa BG', quoteId:id, detail:''});
  return {ok:true};
}

// ─────────────────────────────────────────────────────────────
// VẬT TƯ
// ─────────────────────────────────────────────────────────────
function getMaterials() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MATERIALS);
  const data = sh.getDataRange().getValues();
  if (data.length < 2) return {ok:true, materials:[]};
  const headers = data[0];
  const mats = data.slice(1).filter(r => r[0]).map(row => {
    const o = {};
    headers.forEach((h,i) => o[h] = row[i]);
    return {id:o['ID'], name:o['Tên vật tư'], desc:o['Mô tả chi tiết']||'', cat:o['Danh mục'], unit:o['ĐVT'], price:o['Đơn giá'], note:o['Ghi chú']||''};
  });
  return {ok:true, materials:mats};
}

function saveMaterial(data) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MATERIALS);
  const row = [data.id, data.name, data.desc||'', data.cat, data.unit, data.price, data.note||'', new Date().toLocaleDateString('vi-VN')];
  const existing = findRow(sh, data.id, 0);
  if (existing > 0) sh.getRange(existing,1,1,row.length).setValues([row]);
  else sh.appendRow(row);
  return {ok:true};
}

function deleteMaterial(id) {
  deleteRowsByKey(SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MATERIALS), id, 0);
  return {ok:true};
}

function syncMaterials(mats) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MATERIALS);
  const last = sh.getLastRow();
  if (last > 1) sh.deleteRows(2, last-1);
  if (!mats || !mats.length) return {ok:true, count:0};
  const rows = mats.map(m => [m.id, m.name, m.desc||'', m.cat, m.unit, m.price, m.note||'', new Date().toLocaleDateString('vi-VN')]);
  sh.getRange(2,1,rows.length,rows[0].length).setValues(rows);
  return {ok:true, count:rows.length};
}

// ─────────────────────────────────────────────────────────────
// NGƯỜI DÙNG
// ─────────────────────────────────────────────────────────────
function getUsers() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
  const data = sh.getDataRange().getValues();
  if (data.length < 2) return {ok:true, users:[]};
  const headers = data[0];
  const users = data.slice(1).filter(r => r[0]).map(row => {
    const o = {};
    headers.forEach((h,i) => o[h] = row[i]);
    return {id:o['ID'], name:o['Họ tên'], email:o['Email'], role:o['Vai trò'], status:o['Trạng thái'], created:o['Ngày tạo'], password:o['Mật khẩu']||''};
  });
  return {ok:true, users};
}

function saveUser(data) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
  const row = [data.id, data.name, data.email, data.role, data.status||'active', data.created||new Date().toLocaleDateString('vi-VN'), data.password||''];
  const existing = findRow(sh, data.id, 0);
  if (existing > 0) sh.getRange(existing,1,1,row.length).setValues([row]);
  else sh.appendRow(row);
  return {ok:true};
}

function deleteUser(id) {
  deleteRowsByKey(SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS), id, 0);
  return {ok:true};
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function findRow(sh, key, col) {
  const vals = sh.getDataRange().getValues();
  for (let i=1; i<vals.length; i++) {
    if (String(vals[i][col]) === String(key)) return i+1;
  }
  return -1;
}

function deleteRowsByKey(sh, key, col) {
  const vals = sh.getDataRange().getValues();
  for (let i=vals.length-1; i>=1; i--) {
    if (String(vals[i][col]) === String(key)) sh.deleteRow(i+1);
  }
}

function applyStatusColor(sh, row, status) {
  const colors = {draft:'#f5f3ef', pending:'#fef9ec', approved:'#edf4fc', signed:'#edf7ed'};
  sh.getRange(row, 1, 1, HEADERS[SHEET_QUOTES].length)
    .setBackground(colors[status] || '#ffffff');
}

function calcKL(r) {
  const u = (r.unit||'').toLowerCase().replace(/\s/g,'');
  if (u==='m²'||u==='m2') return Math.round((r.d||0)*(r.h||0)/1000000*1000)/1000;
  if (u==='mdài'||u==='mdai'||u==='ml') {
    const t = r.kitchenType||'I';
    const d1=r.d||0, d2=r.d2||0, d3=r.d3||0, deep=r.w||0;
    const mm = t==='L' ? (d1+d2-deep) : t==='U' ? (d1+d2+d3-2*deep) : d1;
    return Math.round(Math.max(0,mm)/1000*1000)/1000;
  }
  return r.qty||1;
}

function writeLog(data) {
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_LOG)
    .appendRow([new Date().toLocaleString('vi-VN'), data.user||'', data.action||'', data.quoteId||'', data.detail||'']);
}

// ─────────────────────────────────────────────────────────────
// MENU GOOGLE SHEET
// ─────────────────────────────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🛋️ Nội Thất Đồng Nai')
    .addItem('⚙️ Khởi tạo Sheet lần đầu',       'setupSheets')
    .addSeparator()
    .addItem('📄 Xuất báo giá đang chọn ra sheet', 'exportSelectedQuote')
    .addSeparator()
    .addItem('📊 Thống kê tháng này',             'showMonthlyStats')
    .addItem('🗑️ Xóa log cũ (>90 ngày)',          'cleanOldLogs')
    .addToUi();
}

function exportSelectedQuote() {
  const sh  = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_QUOTES);
  const row = sh.getActiveRange().getRow();
  if (row < 2) { SpreadsheetApp.getUi().alert('Vui lòng click vào hàng báo giá cần xuất'); return; }
  const id = sh.getRange(row, 1).getValue();
  if (!id)  { SpreadsheetApp.getUi().alert('Hàng này không có mã báo giá'); return; }
  exportQuoteToSheet(String(id));
}

function exportQuoteToSheet(quoteId) {
  const ss  = SpreadsheetApp.getActiveSpreadsheet();
  const qSh = ss.getSheetByName(SHEET_QUOTES);
  const rSh = ss.getSheetByName(SHEET_ROWS);

  // Lấy header báo giá
  const qVals = qSh.getDataRange().getValues();
  const qHdr  = qVals[0];
  let qt = null;
  for (let i=1; i<qVals.length; i++) {
    if (String(qVals[i][0]) === quoteId) {
      qt = {};
      qHdr.forEach((h,j) => qt[h] = qVals[i][j]);
      break;
    }
  }
  if (!qt) { SpreadsheetApp.getUi().alert('Không tìm thấy báo giá '+quoteId); return; }

  // Lấy hạng mục
  const rVals = rSh.getDataRange().getValues();
  const rows  = rVals.slice(1).filter(r => String(r[0]) === quoteId);

  // Tạo/xóa sheet xuất
  let expSh = ss.getSheetByName(quoteId);
  if (expSh) expSh.clearContents(); else expSh = ss.insertSheet(quoteId);

  // Header công ty
  const info = [
    ['CÔNG TY TNHH NỘI THẤT ĐỒNG NAI','','','','','','','','','','',''],
    ['Số 56A Đường 518 Xa Lộ Hà Nội, KP5, P. Tân Hiệp, TP. Biên Hòa, Đồng Nai','','','','','','','','','','',''],
    ['Hotline: 0932.60.70.60  |  Gmail: Noithatdongnai.info@gmail.com','','','','','','','','','','',''],
    ['','','','','','','','','','','',''],
    ['BẢNG BÁO GIÁ NỘI THẤT','','','','','','','','','','',''],
    ['Mã: '+quoteId+'   |   Ngày: '+qt['Ngày tạo']+'   |   Hiệu lực: '+qt['Hiệu lực'],'','','','','','','','','','',''],
    ['','','','','','','','','','','',''],
    ['Kính gửi: '+qt['Khách hàng'],'','','','','NV phụ trách: '+qt['NV phụ trách'],'','','','','',''],
    ['ĐT: '+qt['Điện thoại']+'   |   Địa chỉ: '+qt['Địa chỉ'],'','','','','','','','','','',''],
    ['','','','','','','','','','','',''],
  ];
  expSh.getRange(1,1,info.length,12).setValues(info);
  expSh.getRange(1,1).setFontWeight('bold').setFontSize(13).setFontColor('#1a1a2e');
  expSh.getRange(1,1,1,12).merge();
  expSh.getRange(5,1).setFontWeight('bold').setFontSize(14);
  expSh.getRange(5,1,1,12).merge().setHorizontalAlignment('center');
  [2,3,6,8,9].forEach(r => expSh.getRange(r,1,1,12).merge());

  // Header bảng
  const tStart = info.length + 1;
  const tHdr = ['STT','Tên hạng mục / vật tư','Mô tả chi tiết','ĐVT','Rộng','Sâu','Cao','KL','SL','Đơn giá','Thành tiền','Ghi chú'];
  expSh.getRange(tStart,1,1,tHdr.length).setValues([tHdr])
    .setBackground('#1a1a2e').setFontColor('#c9a96e').setFontWeight('bold');

  // Hạng mục
  let rNum = tStart+1;
  let curSec = '';
  rows.forEach(r => {
    const sec = r[2];
    if (sec && sec !== curSec) {
      curSec = sec;
      expSh.getRange(rNum,1,1,12).setValues([[sec,'','','','','','','','','','','']])
        .setBackground('#f0ece4').setFontWeight('bold');
      expSh.getRange(rNum,1,1,12).merge();
      rNum++;
    }
    expSh.getRange(rNum,1,1,12).setValues([[r[1],r[3],r[4],r[5],r[6],r[7],r[8],r[9],r[10],r[11],r[12],r[13]]]);
    if (rNum%2===0) expSh.getRange(rNum,1,1,12).setBackground('#faf9f7');
    rNum++;
  });

  // Totals
  const sub=qt['Tạm tính']||0, vat=qt['VAT']||0, disc=qt['Giảm giá %']||0;
  let tr = rNum+1;
  expSh.getRange(tr,10,1,2).setValues([['Tạm tính:', sub]]);
  if (disc>0) { expSh.getRange(tr+1,10,1,2).setValues([['Giảm giá '+disc+'%:', -Math.round(sub*disc/100)]]); tr++; }
  expSh.getRange(tr+1,10,1,2).setValues([['VAT '+qt['VAT %']+'%:', vat]]);
  const totalRange = expSh.getRange(tr+2,10,1,2);
  totalRange.setValues([['TỔNG CỘNG:', qt['Tổng cộng']||0]]).setFontWeight('bold').setBackground('#1a1a2e').setFontColor('#c9a96e');

  // Ghi chú
  const noteR = tr+4;
  expSh.getRange(noteR,1,1,12).setValues([['Ghi chú: Giá đã bao gồm vận chuyển & lắp đặt. Báo giá có hiệu lực 07 ngày. Đơn giá không thay đổi trong quá trình thi công. Mọi phát sinh phải được hai bên thỏa thuận.']]).merge().setWrap(true).setFontColor('#666').setFontSize(9);

  // Bank info
  expSh.getRange(noteR+2,1,1,12).setValues([['TK cá nhân (không VAT): 41007793979 MBBANK – LE THI MY DUYEN  |  TK công ty (có VAT): 183838686888 MBBANK – CONG TY TNHH NOI THAT DONG NAI']]).merge().setFontColor('#555').setFontSize(9);

  // Column widths
  [40,210,250,50,55,55,55,55,45,100,110,120].forEach((w,i) => expSh.setColumnWidth(i+1,w));

  // Border
  expSh.getRange(tStart,1,rNum-tStart,12).setBorder(true,true,true,true,true,true,'#ddd',SpreadsheetApp.BorderStyle.SOLID);

  ss.setActiveSheet(expSh);
  SpreadsheetApp.getUi().alert('✅ Đã xuất báo giá '+quoteId+' vào sheet "'+quoteId+'"!\nBạn có thể in trực tiếp hoặc Export PDF.');
}

function showMonthlyStats() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_QUOTES);
  const vals = sh.getDataRange().getValues();
  const now = new Date(), month = now.getMonth(), year = now.getFullYear();
  let total=0, count=0, signed=0, signedVal=0;
  vals.slice(1).forEach(r => {
    const d = new Date(r[7]);
    if (d.getMonth()===month && d.getFullYear()===year) {
      count++; total += r[14]||0;
      if (r[9]==='signed') { signed++; signedVal += r[14]||0; }
    }
  });
  SpreadsheetApp.getUi().alert(
    `📊 THỐNG KÊ THÁNG ${month+1}/${year}\n\n` +
    `Tổng số báo giá: ${count}\n` +
    `Đã ký hợp đồng: ${signed} (${count>0?Math.round(signed/count*100):0}%)\n\n` +
    `Tổng giá trị báo giá: ${total.toLocaleString('vi-VN')} đ\n` +
    `Giá trị đã ký: ${signedVal.toLocaleString('vi-VN')} đ`
  );
}

function cleanOldLogs() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_LOG);
  const vals = sh.getDataRange().getValues();
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate()-90);
  for (let i=vals.length-1; i>=1; i--) {
    if (new Date(vals[i][0]) < cutoff) sh.deleteRow(i+1);
  }
  SpreadsheetApp.getUi().alert('Đã xóa log cũ hơn 90 ngày.');
}
