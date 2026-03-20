/**
 * PICKER — Nội Thất Đồng Nai
 * PICKER — Chọn vật tư vào báo giá
 */

// ══════════════════════════════════════════════════════
// PICKER VẬT TƯ
// ══════════════════════════════════════════════════════
function openPicker() {
  pickerSel = {};
  document.getElementById('picker-q').value   = '';
  document.getElementById('picker-cat').value = '';
  renderPicker();
  document.getElementById('picker-overlay').classList.add('open');
}
function closePicker() { document.getElementById('picker-overlay').classList.remove('open'); }
function renderPicker() {
  var q   = (document.getElementById('picker-q').value||'').toLowerCase();
  var cat = document.getElementById('picker-cat').value;
  var list = materials.filter(function(m){ return (!q||m.name.toLowerCase().includes(q)) && (!cat||m.cat===cat); });
  document.getElementById('picker-grid').innerHTML = list.length
    ? list.map(function(m){
        return '<div class="mat-card'+(pickerSel[m.id]?' sel':'')+'" onclick="togglePick('+m.id+')">' +
          '<div class="mat-emoji">'+(EMOJI[m.cat]||'📦')+'</div>' +
          '<div class="mat-info"><div class="mat-nm">'+m.name+'</div><div class="mat-ct">'+m.cat+' · '+m.unit+'</div><div class="mat-pr">'+fmt(m.price)+' đ/'+m.unit+'</div></div>' +
          '<div class="mat-chk">'+(pickerSel[m.id]?'✓':'')+'</div>' +
        '</div>';
      }).join('')
    : '<div style="padding:24px;text-align:center;color:var(--text3);font-size:12px;">Không tìm thấy vật tư</div>';
  var n = Object.keys(pickerSel).length;
  document.getElementById('picker-count').textContent = n ? 'Đã chọn '+n+' vật tư' : 'Chưa chọn vật tư nào';
}
function togglePick(id) { pickerSel[id]=!pickerSel[id]; if(!pickerSel[id])delete pickerSel[id]; renderPicker(); }
function confirmPicker() {
  Object.keys(pickerSel).map(Number).forEach(function(id) {
    var m = materials.find(function(x){return x.id===id;});
    if (m) quoteRows.push({id:Date.now()+Math.random(), name:m.name, desc:m.desc||'', unit:m.unit, price:m.price, d:0, w:0, h:0, d2:0, d3:0, qty:1, sl:1, note:'', img:null, kitchenType:'I'});
  });
  renderQuoteTable(); closePicker();
}

