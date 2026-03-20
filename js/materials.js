/**
 * MATERIALS — Nội Thất Đồng Nai
 * MATERIALS — Vật tư, người dùng, import Excel
 */

// ══════════════════════════════════════════════════════
// VẬT TƯ
// ══════════════════════════════════════════════════════
function renderMatsTable() {
  var r   = currentUser.roleKey;
  var q   = (document.getElementById('mat-search').value||'').toLowerCase();
  var cat = document.getElementById('mat-cat-filter').value;
  var list = materials.filter(function(m){ return (!q||m.name.toLowerCase().includes(q))&&(!cat||m.cat===cat); });
  document.getElementById('mat-tbody').innerHTML = list.map(function(m) {
    return '<tr>' +
      '<td>'+(EMOJI[m.cat]||'📦')+' '+m.name+'</td>' +
      '<td>'+m.cat+'</td><td>'+m.unit+'</td>' +
      '<td style="color:var(--gold2);font-weight:500;">'+fmt(m.price)+' đ</td>' +
      '<td style="color:var(--text3);font-size:11px;">'+(m.note||'—')+'</td>' +
      '<td style="white-space:nowrap;">' +
        ((r==='admin'||r==='manager')
          ? '<span class="alink" onclick="editMat('+m.id+')">Sửa</span>'+(r==='admin'?' &nbsp;<span class="del-x" onclick="deleteMat('+m.id+')">✕</span>':'')
          : '<span style="color:var(--text3);font-size:11px;">Chỉ xem</span>')+
      '</td></tr>';
  }).join('') || '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text3);">Không tìm thấy</td></tr>';
}
function deleteMat(id) {
  if(currentUser.roleKey!=='admin') return;
  materials=materials.filter(function(m){return m.id!==id;});
  deleteMaterialFromSheet(id);
  renderMatsTable();
}
function openAddMat() {
  editingMatId=null;
  document.getElementById('add-mat-title').textContent='Thêm vật tư mới';
  ['nm-name','nm-note','nm-desc'].forEach(function(id){ document.getElementById(id).value=''; });
  document.getElementById('nm-cat').value='Phòng ngủ';
  document.getElementById('nm-unit').value='m²';
  document.getElementById('nm-price').value='';
  document.getElementById('add-mat-overlay').classList.add('open');
}
function closeAddMat() { document.getElementById('add-mat-overlay').classList.remove('open'); editingMatId=null; }
function editMat(id) {
  var m=materials.find(function(x){return x.id===id;}); if(!m)return;
  editingMatId=id;
  document.getElementById('add-mat-title').textContent='Chỉnh sửa vật tư';
  document.getElementById('nm-name').value=m.name;
  document.getElementById('nm-cat').value=m.cat;
  document.getElementById('nm-unit').value=m.unit;
  document.getElementById('nm-price').value=m.price;
  document.getElementById('nm-note').value=m.note||'';
  document.getElementById('nm-desc').value=m.desc||'';
  document.getElementById('add-mat-overlay').classList.add('open');
}
function saveMat() {
  var name=document.getElementById('nm-name').value.trim(); if(!name)return;
  var obj={cat:document.getElementById('nm-cat').value, unit:document.getElementById('nm-unit').value||'cái', price:parseFloat(document.getElementById('nm-price').value)||0, note:document.getElementById('nm-note').value.trim(), desc:document.getElementById('nm-desc').value.trim()};
  var mat;
  if(editingMatId){ mat=materials.find(function(x){return x.id===editingMatId;}); mat.name=name; Object.assign(mat,obj); }
  else { mat=Object.assign({id:matNextId++,name:name},obj); materials.push(mat); }
  saveMaterialToSheet(mat);
  closeAddMat(); renderMatsTable();
}

// ══════════════════════════════════════════════════════
// NGƯỜI DÙNG
// ══════════════════════════════════════════════════════
function renderUsersTable() {
  var r=currentUser.roleKey;
  document.getElementById('users-tbody').innerHTML = users.map(function(u) {
    return '<tr>' +
      '<td style="font-weight:500;">'+u.name+'</td>' +
      '<td style="color:var(--text3);">'+u.email+'</td>' +
      '<td><span class="badge badge-'+u.role+'">'+(u.role==='admin'?'👑 Admin':u.role==='manager'?'📊 Quản lý':'✏️ Nhân viên')+'</span></td>' +
      '<td><span class="badge '+(u.status==='active'?'badge-done':'badge-cancel')+'">'+(u.status==='active'?'Hoạt động':'Tạm khóa')+'</span></td>' +
      '<td style="color:var(--text3);">'+u.created+'</td>' +
      '<td><span style="font-size:11px;color:var(--text3);">'+(r==='admin'?'Xem · Sửa · Khóa':'Chỉ xem')+'</span></td>' +
      '<td>'+(r==='admin'&&u.id!==currentUser.id?'<span class="del-x" onclick="deleteUser('+u.id+')">✕</span>':'')+'</td>' +
    '</tr>';
  }).join('');
}
function openAddUser()  { document.getElementById('add-user-overlay').classList.add('open'); }
function closeAddUser() { document.getElementById('add-user-overlay').classList.remove('open'); }
function saveUser() {
  var name=document.getElementById('nu-name').value.trim(); if(!name)return;
  var u={id:userNextId++,name:name,email:document.getElementById('nu-email').value,role:document.getElementById('nu-role').value,status:'active',created:new Date().toLocaleDateString('vi-VN'),password:document.getElementById('nu-pass').value};
  users.push(u);
  saveUserToSheet(u);
  closeAddUser(); renderUsersTable();
}
function deleteUser(id) {
  users=users.filter(function(u){return u.id!==id;});
  deleteUserFromSheet(id);
  renderUsersTable();
}

// ══════════════════════════════════════════════════════
// IMPORT EXCEL & TEMPLATE
// ══════════════════════════════════════════════════════
var importBuffer = [];
var VALID_CATS = ['Phòng khách','Phòng ngủ','Phòng bếp','Nhà vệ sinh','Vật liệu','Phụ kiện tủ','Rèm','Thi công'];

function importExcel(input) {
  var file=input.files[0]; if(!file)return; input.value='';
  var reader=new FileReader();
  reader.onload=function(e){
    try {
      var wb=XLSX.read(e.target.result,{type:'array'});
      var ws=wb.Sheets[wb.SheetNames[0]];
      var rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
      var headerIdx=-1;
      for(var i=0;i<Math.min(rows.length,10);i++){
        var row=rows[i].map(function(c){return String(c).toLowerCase();});
        if(row.some(function(c){return c.includes('tên')&&c.includes('vật');})||row.some(function(c){return c.includes('name');})){headerIdx=i;break;}
      }
      if(headerIdx<0)headerIdx=3;
      importBuffer=[];
      rows.slice(headerIdx+1).forEach(function(row){
        var name=String(row[0]||'').trim(); if(!name)return;
        var cat=String(row[1]||'').trim();
        var unit=String(row[2]||'').trim();
        var price=parseFloat(String(row[3]||'').replace(/[^0-9.]/g,''))||0;
        var note=String(row[4]||'').trim();
        importBuffer.push({idx:importBuffer.length+1,name:name,cat:cat,unit:unit||'cái',price:price,note:note,ok:!!name&&!!unit&&price>0,catOk:VALID_CATS.indexOf(cat)>=0});
      });
      showImportPreview(0);
    }catch(err){ alert('Không đọc được file Excel. Vui lòng dùng đúng file mẫu.'); }
  };
  reader.readAsArrayBuffer(file);
}
function showImportPreview(skipped) {
  if(!importBuffer.length){alert('Không tìm thấy dữ liệu hợp lệ.');return;}
  var ok=importBuffer.filter(function(r){return r.ok;}).length;
  var warn=importBuffer.filter(function(r){return !r.ok;}).length;
  document.getElementById('import-summary').innerHTML='✓ Tìm thấy <strong>'+importBuffer.length+'</strong> dòng &nbsp;·&nbsp;<span style="color:var(--green-fg)">'+ok+' hợp lệ</span>'+(warn?' &nbsp;·&nbsp;<span style="color:var(--amber-fg)">'+warn+' cần kiểm tra</span>':'');
  document.getElementById('import-preview-body').innerHTML=importBuffer.map(function(r){
    var s=r.ok?'<span style="color:var(--green-fg);font-size:10px;">✓</span>':'<span style="color:var(--amber-fg);font-size:10px;">⚠</span>';
    return '<tr'+(r.ok?'':' style="background:var(--amber-bg);"')+'><td style="color:var(--text3);">'+r.idx+'</td><td>'+r.name+'</td><td>'+(r.catOk?r.cat:'<span style="color:var(--amber-fg);">'+r.cat+'</span>')+'</td><td>'+r.unit+'</td><td style="text-align:right;">'+fmt(r.price)+' đ</td><td style="font-size:10px;color:var(--text3);">'+r.note+'</td><td style="text-align:center;">'+s+'</td></tr>';
  }).join('');
  document.getElementById('import-overlay').classList.add('open');
}
function closeImport() { document.getElementById('import-overlay').classList.remove('open'); importBuffer=[]; }
function confirmImport() {
  importBuffer.forEach(function(r){
    if(!r.name)return;
    var cat=VALID_CATS.indexOf(r.cat)>=0?r.cat:'Phụ kiện tủ';
    materials.push({id:matNextId++,name:r.name,cat:cat,unit:r.unit||'cái',price:r.price||0,note:r.note||'',desc:''});
  });
  closeImport(); renderMatsTable();
}
function downloadTemplate() {
  var wb=XLSX.utils.book_new();
  var ws=XLSX.utils.aoa_to_sheet([
    ['Tên vật tư *','Danh mục *','Đơn vị tính *','Đơn giá (VNĐ) *','Ghi chú','Nhà cung cấp'],
    ['Tủ bếp dưới MDF Melamine','Phòng bếp','m dài',2000000,'MDF Ba Thanh chống ẩm',''],
    ['Tủ quần áo MDF Hafele','Phòng ngủ','m²',3900000,'Plywood An Cường',''],
    ['(Xóa dòng mẫu, điền dữ liệu từ hàng 2)','','','','','']
  ]);
  ws['!cols']=[{wch:42},{wch:20},{wch:14},{wch:16},{wch:35},{wch:20}];
  XLSX.utils.book_append_sheet(wb,ws,'Danh mục vật tư');
  XLSX.writeFile(wb,'mau_vat_tu_noi_that_dong_nai.xlsx');
}

