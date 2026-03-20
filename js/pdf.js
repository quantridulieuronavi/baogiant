/**
 * PDF — Nội Thất Đồng Nai
 * PDF — Build PDF preview
 */

// ══════════════════════════════════════════════════════
// BUILD PDF PREVIEW
// ══════════════════════════════════════════════════════
function buildPDF() {
  var vatRate  = parseFloat(document.getElementById('vat-rate').value)||0;
  var dp       = parseFloat(document.getElementById('discount').value)||0;
  var sub = quoteRows.reduce(function(s,r) {
    if (r.isSection) return s;
    var mode=unitMode(r.unit), kl=calcKL(r), sl=parseFloat(r.sl)||1;
    return s + (mode==='manual' ? (r.qty||1)*(r.price||0) : kl*sl*(r.price||0));
  }, 0);
  var vat  = Math.round(sub*vatRate);
  var disc = Math.round(sub*dp/100);
  var vatLabel = vatRate===0 ? 'Không VAT' : Math.round(vatRate*100)+'%';
  var rowNum = 0;
  document.getElementById('pdf-tbody').innerHTML = quoteRows.length
    ? quoteRows.map(function(r) {
        if (r.isSection) {
          return '<tr style="background:#1a1a2e;"><td colspan="9" style="padding:6px 10px;color:#c9a96e;font-weight:700;font-size:10.5px;letter-spacing:0.5px;">'+r.name+'</td></tr>';
        }
        rowNum++;
        var mode = unitMode(r.unit);
        var kl   = calcKL(r);
        var sl   = parseFloat(r.sl)||1;
        var klDisp = mode==='m2' ? kl+' m²' : mode==='ml' ? kl+' m' : (r.qty||1);
        var slDisp = mode==='manual' ? '—' : sl;
        var finalAmt = mode==='manual' ? (r.qty||1)*(r.price||0) : kl*sl*(r.price||0);
        var dim  = dimDisplay(r);
        var imgHtml = r.img
          ? '<img src="'+r.img+'" style="width:38px;height:38px;object-fit:cover;border-radius:3px;">'
          : '<div style="width:38px;height:38px;background:#f5f5f5;border-radius:3px;border:1px dashed #ddd;"></div>';
        return '<tr>' +
          '<td style="text-align:center;">'+rowNum+'</td>' +
          '<td style="text-align:center;">'+imgHtml+'</td>' +
          '<td>'+r.name+
            (r.desc ? '<br><span style="font-size:9px;color:#888;font-style:italic;line-height:1.5;">'+r.desc+'</span>' : '')+
            (dim ? '<br><span style="font-size:8px;color:#aaa;">'+dim+'</span>' : '')+
          '</td>' +
          '<td style="text-align:center;">'+r.unit+'</td>' +
          '<td style="text-align:center;">'+klDisp+'</td>' +
          '<td style="text-align:center;">'+slDisp+'</td>' +
          '<td style="text-align:right;">'+fmt(r.price)+'</td>' +
          '<td style="text-align:right;font-weight:600;">'+fmt(finalAmt)+'</td>' +
          '<td style="font-size:9px;color:#666;">'+(r.note||'')+'</td>' +
        '</tr>';
      }).join('')
    : '<tr><td colspan="9" style="text-align:center;padding:16px;color:#999;">Chưa có hạng mục</td></tr>';
  document.getElementById('pdf-sub').textContent  = fmt(sub)+' đ';
  document.getElementById('pdf-vat').textContent  = fmt(vat)+' đ';
  document.getElementById('pdf-vat-label').textContent = 'VAT '+vatLabel;
  var discEl = document.getElementById('pdf-disc-row');
  if (disc>0) { discEl.style.display='flex'; document.getElementById('pdf-disc').textContent='-'+fmt(disc)+' đ'; } else { discEl.style.display='none'; }
  document.getElementById('pdf-grand').textContent = fmt(sub+vat-disc)+' đ';
  document.getElementById('pdf-staff').textContent = currentUser.name+' · '+currentUser.email;
}

