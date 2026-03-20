/**
 * CALC — Nội Thất Đồng Nai
 * CALC — Tính toán kích thước, render bảng báo giá
 */

// ══════════════════════════════════════════════════════
// BẢNG HẠNG MỤC BÁO GIÁ
// ══════════════════════════════════════════════════════
function renderQuoteTable() {
  var tb = document.getElementById('quote-body');
  if (!quoteRows.length) {
    tb.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:32px;color:var(--text3);">Nhấn <strong style="color:var(--gold2);">+ Chọn từ danh mục vật tư</strong> để thêm hạng mục</td></tr>';
    recalc(); return;
  }
  var itemIdx = 0;
  tb.innerHTML = quoteRows.map(function(r) {
    // ── TIÊU ĐỀ PHÒNG ──
    if (r.isSection) {
      return '<tr data-rid="'+r.id+'" class="section-row">' +
        '<td colspan="10" style="padding:3px 0;">' +
          '<div style="display:flex;align-items:center;gap:6px;padding:7px 10px;background:linear-gradient(90deg,var(--navy) 0%,#1e2a4a 100%);border-radius:5px;">' +
            '<span style="color:var(--gold);font-size:14px;line-height:1;">▌</span>' +
            '<input type="text" value="'+escHtml(r.name)+'" oninput="updField('+r.id+',\'name\',this.value)"' +
              ' style="flex:1;background:transparent;border:none;border-bottom:1px solid rgba(201,169,110,0.35);color:#f5ecd4;font-weight:700;font-size:12.5px;padding:1px 4px;outline:none;">' +
            '<span onclick="removeRow('+r.id+')" style="color:rgba(255,255,255,0.35);cursor:pointer;padding:2px 6px;border-radius:3px;font-size:13px;" onmouseover="this.style.color=\'#ff7b7b\'" onmouseout="this.style.color=\'rgba(255,255,255,0.35)\'">✕</span>' +
          '</div>' +
        '</td>' +
      '</tr>';
    }

    // ── HÀNG THƯỜNG ──
    itemIdx++;
    var mode = unitMode(r.unit);
    var kl   = calcKL(r);
    var sl   = parseFloat(r.sl) || 1;
    var finalAmt = (mode==='manual') ? (r.qty||1)*(r.price||0) : kl*sl*(r.price||0);

    // KL cell
    var klCell;
    if (mode === 'm2') {
      klCell = (r.d>0 && r.h>0)
        ? '<span class="qty-calc" title="Rộng × Cao / 1,000,000">'+kl+' m²</span>'
        : '<span style="font-size:10px;color:var(--text3);">Nhập mm</span>';
    } else if (mode === 'ml') {
      klCell = (r.d>0)
        ? '<span class="qty-calc">'+kl+' m</span>'
        : '<span style="font-size:10px;color:var(--text3);">Nhập mm</span>';
    } else {
      klCell = '<input type="number" value="'+(r.qty||1)+'" min="0" step="0.5" style="width:52px;text-align:center;" oninput="updField('+r.id+',\'qty\',+this.value)" title="Số đơn vị">';
    }

    // SL cell
    var slCell = (mode==='manual')
      ? '<span style="font-size:10px;color:var(--text3);">—</span>'
      : '<input type="number" value="'+(r.sl||1)+'" min="0" step="0.5" style="width:52px;text-align:center;" oninput="updField('+r.id+',\'sl\',+this.value)" title="Số lượng sản phẩm">';

    // Dim cell
    var dimCell;
    if (mode === 'm2') {
      // m²: Rộng × Sâu × Cao (mm) — KL = Rộng × Cao
      dimCell =
        '<div class="dim-wrap">' +
          '<input type="number" value="'+(r.d||'')+'" min="0" step="1" placeholder="Rộng" title="Rộng (mm)" oninput="updField('+r.id+',\'d\',+this.value)">' +
          '<span class="dim-sep">×</span>' +
          '<input type="number" value="'+(r.w||'')+'" min="0" step="1" placeholder="Sâu" title="Sâu (mm) – ghi chú" oninput="updField('+r.id+',\'w\',+this.value)" style="opacity:0.55;border-style:dashed;">' +
          '<span class="dim-sep">×</span>' +
          '<input type="number" value="'+(r.h||'')+'" min="0" step="1" placeholder="Cao" title="Cao (mm) – tính KL" oninput="updField('+r.id+',\'h\',+this.value)">' +
        '</div>';
    } else if (mode === 'ml') {
      var ktype = r.kitchenType || 'I';
      // Dropdown loại tủ
      var ktypeSelect =
        '<select onchange="updField('+r.id+',\'kitchenType\',this.value)" style="width:44px;font-size:10px;padding:2px 2px;margin-bottom:2px;" title="Kiểu tủ bếp">' +
          ['I','L','U'].map(function(v){ return '<option'+(v===ktype?' selected':'')+'>'+v+'</option>'; }).join('') +
        '</select>';
      if (ktype === 'I') {
        dimCell =
          '<div class="dim-wrap">' + ktypeSelect +
            '<input type="number" value="'+(r.d||'')+'" min="0" step="1" placeholder="Dài" title="Chiều dài (mm)" oninput="updField('+r.id+',\'d\',+this.value)">' +
          '</div>';
      } else if (ktype === 'L') {
        dimCell =
          '<div class="dim-wrap" style="flex-direction:column;gap:2px;">' + ktypeSelect +
            '<div style="display:flex;align-items:center;gap:3px;">' +
              '<input type="number" value="'+(r.d||'')+'" min="0" step="1" placeholder="Cạnh 1" title="Cạnh 1 (mm)" oninput="updField('+r.id+',\'d\',+this.value)" style="width:58px;">' +
              '<span class="dim-sep">+</span>' +
              '<input type="number" value="'+(r.d2||'')+'" min="0" step="1" placeholder="Cạnh 2" title="Cạnh 2 (mm)" oninput="updField('+r.id+',\'d2\',+this.value)" style="width:58px;">' +
              '<span class="dim-sep">−</span>' +
              '<input type="number" value="'+(r.w||'')+'" min="0" step="1" placeholder="Sâu" title="Chiều sâu tủ (mm)" oninput="updField('+r.id+',\'w\',+this.value)" style="width:50px;">' +
            '</div>' +
          '</div>';
      } else { // U
        dimCell =
          '<div class="dim-wrap" style="flex-direction:column;gap:2px;">' + ktypeSelect +
            '<div style="display:flex;align-items:center;gap:2px;flex-wrap:wrap;">' +
              '<input type="number" value="'+(r.d||'')+'" min="0" step="1" placeholder="C.1" title="Cạnh 1 (mm)" oninput="updField('+r.id+',\'d\',+this.value)" style="width:50px;">' +
              '<span class="dim-sep">+</span>' +
              '<input type="number" value="'+(r.d2||'')+'" min="0" step="1" placeholder="C.2" title="Cạnh 2 (mm)" oninput="updField('+r.id+',\'d2\',+this.value)" style="width:50px;">' +
              '<span class="dim-sep">+</span>' +
              '<input type="number" value="'+(r.d3||'')+'" min="0" step="1" placeholder="C.3" title="Cạnh 3 (mm)" oninput="updField('+r.id+',\'d3\',+this.value)" style="width:50px;">' +
              '<span class="dim-sep" style="font-size:9px;">−2×</span>' +
              '<input type="number" value="'+(r.w||'')+'" min="0" step="1" placeholder="Sâu" title="Chiều sâu tủ (mm)" oninput="updField('+r.id+',\'w\',+this.value)" style="width:46px;">' +
            '</div>' +
          '</div>';
      }
    } else {
      dimCell = '<span style="font-size:10px;color:var(--text3);">—</span>';
    }

    // Ảnh
    var imgHtml = r.img
      ? '<img src="'+r.img+'" style="width:46px;height:46px;object-fit:cover;border-radius:4px;cursor:pointer;flex-shrink:0;border:1px solid var(--border);" onclick="pickImg('+r.id+')" title="Nhấn để đổi ảnh">'
      : '<label style="display:inline-flex;flex-direction:column;align-items:center;justify-content:center;width:46px;height:46px;border:1.5px dashed var(--border);border-radius:4px;cursor:pointer;color:var(--text3);font-size:10px;flex-shrink:0;gap:1px;">' +
          '<span style="font-size:16px;line-height:1;">📷</span>' +
          '<span style="font-size:8px;">ảnh</span>' +
          '<input type="file" accept="image/*" style="display:none;" onchange="loadImg('+r.id+',this)">' +
        '</label>';

    return '<tr data-rid="'+r.id+'">' +
      '<td style="color:var(--text3);font-size:10px;text-align:center;">'+itemIdx+'</td>' +
      '<td>' +
        '<div style="display:flex;align-items:flex-start;gap:6px;">' +
          imgHtml +
          '<div style="flex:1;min-width:0;">' +
            '<input type="text" value="'+escHtml(r.name)+'" oninput="updField('+r.id+',\'name\',this.value)" style="width:100%;">' +
            '<textarea rows="2" oninput="updField('+r.id+',\'desc\',this.value)" style="width:100%;margin-top:3px;font-size:10px;color:var(--text3);background:transparent;border:1px dashed var(--border);border-radius:4px;padding:2px 4px;resize:vertical;line-height:1.4;font-family:inherit;" placeholder="Mô tả chi tiết (có thể chỉnh sửa)...">'+escHtml(r.desc||'')+'</textarea>' +
          '</div>' +
        '</div>' +
      '</td>' +
      '<td>' +
        '<select onchange="updField('+r.id+',\'unit\',this.value)" style="width:70px;">' +
          ['m²','m dài','Cái','Bộ','Gói','Tuýp','Cuộn','Tấm','Thanh','Bản','Kg','Lít','Buổi']
            .map(function(u){ return '<option'+(u===r.unit?' selected':'')+'>'+u+'</option>'; }).join('') +
        '</select>' +
      '</td>' +
      '<td>'+dimCell+'</td>' +
      '<td style="text-align:center;">'+klCell+'</td>' +
      '<td style="text-align:center;">'+slCell+'</td>' +
      '<td><input type="number" value="'+(r.price||0)+'" min="0" oninput="updField('+r.id+',\'price\',+this.value)" style="width:104px;"></td>' +
      '<td style="font-weight:500;white-space:nowrap;color:var(--text);" class="row-sub">'+fmt(finalAmt)+' đ</td>' +
      '<td><input type="text" value="'+escHtml(r.note||'')+'" oninput="updField('+r.id+',\'note\',this.value)" style="width:100%;font-size:11px;" placeholder="Ghi chú..."></td>' +
      '<td><span class="del-x" onclick="removeRow('+r.id+')">✕</span></td>' +
    '</tr>';
  }).join('');
  recalc();
}

function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function pickImg(id) { var i=document.createElement('input'); i.type='file'; i.accept='image/*'; i.onchange=function(){if(i.files[0])loadImg(id,i);}; i.click(); }
function loadImg(id,inp) {
  var file=inp.files[0]; if(!file)return;
  var fr=new FileReader(); fr.onload=function(e){ var r=quoteRows.find(function(x){return x.id===id;}); if(r){r.img=e.target.result;renderQuoteTable();} }; fr.readAsDataURL(file);
}

// updField — cập nhật field và re-render nhanh
function updField(id, field, val) {
  var r = quoteRows.find(function(x){ return x.id===id; });
  if (!r) return;
  r[field] = val;
  // Unit change or kitchen type change → full re-render
  if (field==='unit' || field==='kitchenType') { renderQuoteTable(); return; }
  if (r.isSection) return;
  // Fast update subtotal
  var mode = unitMode(r.unit);
  var kl   = calcKL(r);
  var sl   = parseFloat(r.sl)||1;
  var sub  = (mode==='manual') ? (r.qty||1)*(r.price||0) : kl*sl*(r.price||0);
  var tr   = document.querySelector('[data-rid="'+id+'"]');
  if (tr) {
    var subCell = tr.querySelector('.row-sub');
    if (subCell) subCell.textContent = fmt(sub)+' đ';
    // Update KL display
    if (mode !== 'manual') {
      var klTd = tr.querySelectorAll('td')[4];
      if (klTd) {
        if (mode==='m2')
          klTd.innerHTML = (r.d>0&&r.h>0) ? '<span class="qty-calc">'+kl+' m²</span>' : '<span style="font-size:10px;color:var(--text3);">Nhập mm</span>';
        else
          klTd.innerHTML = r.d>0 ? '<span class="qty-calc">'+kl+' m</span>' : '<span style="font-size:10px;color:var(--text3);">Nhập mm</span>';
      }
    }
  }
  recalc();
}

function removeRow(id) {
  quoteRows = quoteRows.filter(function(x){ return x.id !== id; });
  renderQuoteTable();
}
function addManualRow() {
  quoteRows.push({id:Date.now()+Math.random(), name:'', desc:'', unit:'m²', price:0, d:0, w:0, h:0, d2:0, d3:0, qty:1, sl:1, note:'', img:null, kitchenType:'I'});
  renderQuoteTable();
}
function addSectionRow() {
  var n = quoteRows.filter(function(r){return r.isSection;}).length + 1;
  var names = ['I. Phòng ngủ master','II. Phòng khách','III. Phòng bếp','IV. Phòng ngủ 1','V. Phòng ngủ 2','VI. Phòng ngủ ông bà','VII. Phòng vệ sinh','VIII. Hành lang'];
  quoteRows.push({id:Date.now()+Math.random(), isSection:true, name:names[n-1]||'Mục '+n+'. Tên phòng'});
  renderQuoteTable();
}

function recalc() {
  var sub = quoteRows.reduce(function(s,r) {
    if (r.isSection) return s;
    var mode = unitMode(r.unit);
    var kl   = calcKL(r);
    var sl   = parseFloat(r.sl)||1;
    return s + (mode==='manual' ? (r.qty||1)*(r.price||0) : kl*sl*(r.price||0));
  }, 0);
  var vatEl  = document.getElementById('vat-rate');
  var vatRate= vatEl ? parseFloat(vatEl.value)||0 : 0.08;
  var vat    = Math.round(sub*vatRate);
  var discEl2= document.getElementById('discount');
  var dp     = discEl2 ? parseFloat(discEl2.value)||0 : 0;
  var disc   = Math.round(sub*dp/100);
  document.getElementById('s-sub').textContent  = fmt(sub)+' đ';
  document.getElementById('s-vat').textContent  = fmt(vat)+' đ';
  document.getElementById('s-disc').textContent = fmt(disc)+' đ';
  document.getElementById('s-grand').textContent= fmt(sub+vat-disc)+' đ';
}

