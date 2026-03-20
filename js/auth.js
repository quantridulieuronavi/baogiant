/**
 * AUTH — Nội Thất Đồng Nai
 * Đăng nhập: Google OAuth2 (ưu tiên) + Email/Mật khẩu (fallback)
 */

// ══ CẤU HÌNH ══════════════════════════════════════════
// ⚠️ Thay bằng Google Client ID của bạn:
// console.cloud.google.com → APIs & Services → Credentials
// → Create OAuth 2.0 Client ID → Web application
var GOOGLE_CLIENT_ID = '359579898140-o91uuu3hu11jaeghqmcnq6kfve14aaed.apps.googleusercontent.com';

// ══ TOGGLE FORM ════════════════════════════════════════
function showPasswordForm() {
  document.getElementById('google-login-section').style.display = 'none';
  document.getElementById('password-login-section').style.display = 'block';
  document.getElementById('btn-back-google').style.display = 'block';
  document.getElementById('login-error').textContent = '';
}
function showGoogleForm() {
  document.getElementById('google-login-section').style.display = 'block';
  document.getElementById('password-login-section').style.display = 'none';
  document.getElementById('btn-back-google').style.display = 'none';
  document.getElementById('login-error').textContent = '';
}

// ══ GOOGLE SIGN-IN ══════════════════════════════════════
function initGoogleSignIn() {
  if (typeof google === 'undefined' || !google.accounts) return;
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes('YOUR_GOOGLE')) return;
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleCredential,
    auto_select: false,
    cancel_on_tap_outside: true
  });
  var btnEl = document.getElementById('google-signin-btn');
  if (btnEl) {
    google.accounts.id.renderButton(btnEl, {
      type: 'standard', theme: 'outline', size: 'large',
      text: 'signin_with', shape: 'rectangular', locale: 'vi', width: 300
    });
  }
}

function handleGoogleCredential(response) {
  try {
    var payload = JSON.parse(atob(response.credential.split('.')[1]));
    var email   = (payload.email || '').toLowerCase();

    function checkAndLogin() {
      var found = users.find(function(u) {
        return u.email.replace('\u0040', '@').toLowerCase() === email;
      });
      if (found) {
        currentUser = Object.assign({}, found, {
          roleKey:     found.role,
          googleToken: response.credential,
          avatar:      payload.picture || ''
        });
        loginSuccess();
      } else {
        showLoginError(
          'Email ' + email + ' chưa được cấp quyền.\n' +
          'Kiểm tra lại cột Email trong sheet NguoiDung.'
        );
      }
    }

    // users[] vẫn là dữ liệu hardcode → tải từ Sheet trước
    if (users.length === 0 || users.every(function(u) {
      return !u.email || u.email.includes('noithatdn.vn');
    })) {
      showLoginError('⏳ Đang tải danh sách nhân viên...');
      loadUsersFromSheet(function() {
        document.getElementById('login-error').textContent = '';
        checkAndLogin();
      });
    } else {
      checkAndLogin();
    }

  } catch (err) {
    showLoginError('Lỗi xác thực Google. Vui lòng thử lại.');
    console.error(err);
  }
}

// ══ EMAIL + MẬT KHẨU ════════════════════════════════════
function doPasswordLogin() {
  var email = (document.getElementById('login-email').value || '').trim().toLowerCase();
  var pass  = (document.getElementById('login-pass').value  || '').trim();
  if (!email || !pass) { showLoginError('Vui lòng nhập đầy đủ thông tin.'); return; }

  function checkAndLogin() {
    var found = users.find(function(u) {
      return u.email.replace('\u0040', '@').toLowerCase() === email
          && u.password === pass;
    });
    if (found) {
      currentUser = Object.assign({}, found, { roleKey: found.role });
      loginSuccess();
    } else {
      showLoginError('Email hoặc mật khẩu không đúng.');
      document.getElementById('login-pass').value = '';
      document.getElementById('login-pass').focus();
    }
  }

  // users[] vẫn là dữ liệu hardcode → tải từ Sheet trước
  if (users.length === 0 || users.every(function(u) {
    return !u.email || u.email.includes('noithatdn.vn');
  })) {
    showLoginError('⏳ Đang tải danh sách nhân viên...');
    loadUsersFromSheet(function() {
      document.getElementById('login-error').textContent = '';
      checkAndLogin();
    });
  } else {
    checkAndLogin();
  }
}
function loginKeydown(e) { if (e.key === 'Enter') doPasswordLogin(); }



// ══ HELPERS ════════════════════════════════════════════
function showLoginError(msg) {
  var el = document.getElementById('login-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}
function loginSuccess() {
  document.getElementById('login-error').textContent = '';
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').classList.add('visible');
  try { sessionStorage.setItem('ntdn_user', JSON.stringify(currentUser)); } catch(e) {}
  initApp();
}

// ══ ĐĂNG XUẤT ══════════════════════════════════════════
function doLogout() {
  if (currentUser && currentUser.googleToken) {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      google.accounts.id.disableAutoSelect();
    }
  }
  currentUser = null;
  quoteRows = [];
  try { sessionStorage.removeItem('ntdn_user'); } catch(e) {}
  document.getElementById('app').classList.remove('visible');
  document.getElementById('login-screen').style.display = 'flex';
  showGoogleForm();
  var e = document.getElementById('login-email'); if (e) e.value = '';
  var p = document.getElementById('login-pass');  if (p) p.value = '';
}

// ══ KHỞI TẠO APP ════════════════════════════════════════
function initApp() {
  var r = currentUser.roleKey, rd = ROLES[r];
  var avatarEl = document.getElementById('sb-avatar');
  if (currentUser.avatar) {
    avatarEl.innerHTML = '<img src="' + currentUser.avatar + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
  } else {
    var initials = currentUser.name.split(' ').slice(-2).map(function(w){return w[0];}).join('').toUpperCase().slice(0,2);
    avatarEl.textContent = initials;
  }
  document.getElementById('sb-uname').textContent = currentUser.name;
  document.getElementById('sb-role').textContent  = rd.tag;
  document.getElementById('top-role-badge').innerHTML = '<span class="badge '+rd.color+'" style="margin-right:4px;">'+rd.tag+'</span>';
  document.getElementById('btn-top-mat').style.display = (r==='admin'||r==='manager') ? '' : 'none';
  var nav = document.getElementById('sb-nav');
  nav.innerHTML = '';
  var sections = {dashboard:'CHÍNH',quotes:'CHÍNH','new-quote':'CHÍNH',materials:'DANH MỤC',reports:'PHÂN TÍCH',users:'HỆ THỐNG',preview:'CÔNG CỤ'};
  var lastSec = '';
  NAV_DEF.forEach(function(n) {
    if (sections[n.id] !== lastSec) {
      var s = document.createElement('div'); s.className='sb-section'; s.textContent=sections[n.id]; nav.appendChild(s); lastSec=sections[n.id];
    }
    var el = document.createElement('div');
    el.className = 'nav-item' + (rd.nav.indexOf(n.id)<0 ? ' disabled' : '');
    el.id = 'nav-'+n.id;
    el.innerHTML = '<span class="nav-icon">'+n.icon+'</span>'+n.label;
    el.onclick = (function(id){ return function(){ if(rd.nav.indexOf(id)>=0) gotoPage(id); }; })(n.id);
    nav.appendChild(el);
  });
  applyPermissions();
  gotoPage('dashboard');
}

function applyPermissions() {
  var r = currentUser.roleKey;
  document.getElementById('stat-revenue').style.display = (r==='staff') ? 'none' : '';
  document.getElementById('btn-approve').style.display  = (r==='admin'||r==='manager') ? '' : 'none';
  var btnAM = document.getElementById('btn-add-mat');
  var btnIM = document.getElementById('btn-import-mat');
  if (btnAM) btnAM.style.display = (r==='admin'||r==='manager') ? '' : 'none';
  if (btnIM) btnIM.style.display = (r==='admin'||r==='manager') ? '' : 'none';
  renderUsersTable();
  renderQuotesList();
}

// Khôi phục session khi reload
(function() {
  try {
    var saved = sessionStorage.getItem('ntdn_user');
    if (saved) {
      currentUser = JSON.parse(saved);
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('app').classList.add('visible');
      document.addEventListener('DOMContentLoaded', function() { initApp(); });
    }
  } catch(e) {}
})();
