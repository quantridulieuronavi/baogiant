/**
 * UTILS — Nội Thất Đồng Nai
 * UTILS — Toast, tiện ích
 */

// ══════════════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════════════
function showToast(msg) {
  var t=document.getElementById('toast');
  if(!t){t=document.createElement('div');t.id='toast';t.style.cssText='position:fixed;bottom:24px;right:24px;background:var(--navy);color:var(--gold);padding:10px 18px;border-radius:8px;font-size:12px;z-index:9999;opacity:0;transition:opacity 0.3s;pointer-events:none;';document.body.appendChild(t);}
  t.textContent=msg;t.style.opacity='1';
  clearTimeout(t._tmr);
  t._tmr=setTimeout(function(){t.style.opacity='0';},2800);
}
