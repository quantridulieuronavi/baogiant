# 🏠 Nội Thất Đồng Nai — Phần Mềm Báo Giá v2.0

Phần mềm quản lý báo giá nội thất chạy hoàn toàn trên **trình duyệt** (GitHub Pages).  
Dữ liệu lưu trên **Google Sheets** qua Google Apps Script.

---

## 📁 Cấu trúc dự án

```
noithat-dongnai/
├── index.html          ← App chính
├── Code.gs             ← Dán vào Google Apps Script
│
├── css/
│   ├── variables.css   ← Màu sắc, font, CSS variables
│   ├── login.css       ← Màn hình đăng nhập
│   ├── layout.css      ← Sidebar, Topbar
│   ├── components.css  ← Bảng, Form, Badge
│   ├── quote.css       ← Bảng báo giá
│   ├── modal.css       ← Popup, PDF preview
│   └── misc.css        ← Print, Search, ...
│
└── js/
    ├── api.js          ← ⭐ Giao tiếp Google Sheets (sửa GAS_URL ở đây)
    ├── data.js         ← Dữ liệu mặc định (fallback)
    ├── auth.js         ← Đăng nhập Google / Email
    ├── app.js          ← Khởi tạo app, điều hướng
    ├── calc.js         ← Tính toán kích thước mm, bảng báo giá
    ├── picker.js       ← Chọn vật tư
    ├── quotes.js       ← Danh sách báo giá, CRUD
    ├── pdf.js          ← PDF preview
    ├── materials.js    ← Vật tư, người dùng, import Excel
    └── utils.js        ← Toast, tiện ích
```

---

## 🚀 Cách cài đặt

### Bước 1 — Tạo Google Sheet + Apps Script

1. Vào [sheets.google.com](https://sheets.google.com) → tạo spreadsheet mới  
   Đặt tên: **Nội Thất Đồng Nai — Báo Giá**

2. Trong Sheet: **Extensions → Apps Script**

3. Xóa code mặc định, dán toàn bộ nội dung file **`Code.gs`** vào, lưu lại

4. Chọn hàm **`setupSheets`** trong dropdown → nhấn **▶ Run**  
   *(Cấp quyền khi Google hỏi)*  
   → Tự động tạo 5 tab: BaoGia, HangMuc, VatTu, NguoiDung, NhatKy

### Bước 2 — Deploy Web App

1. Trong Apps Script: **Deploy → New deployment**
2. Chọn type: **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone**
5. Nhấn **Deploy** → Copy URL  
   *(dạng: `https://script.google.com/macros/s/ABC.../exec`)*

### Bước 3 — Cấu hình app

Mở file **`js/api.js`**, thay dòng đầu:
```js
var GAS_URL = 'https://script.google.com/macros/s/ABC.../exec';
```

### Bước 4 — Thêm nhân viên

Mở tab **NguoiDung** trong Google Sheet, thêm từng nhân viên:

| ID | Họ tên | Email | Vai trò | Trạng thái | Ngày tạo | Mật khẩu |
|----|--------|-------|---------|------------|----------|----------|
| 1 | Nguyễn Văn A | a@gmail.com | admin | active | 01/01/2025 | pass123 |
| 2 | Trần Thị B | b@gmail.com | manager | active | 01/01/2025 | pass123 |

> **Email phải là email Google thật** nếu muốn dùng đăng nhập bằng Google

### Bước 5 — Đưa lên GitHub Pages

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/noithat-dongnai.git
git push -u origin main
```

Vào **Settings → Pages → Source: main branch** → Save  
→ App chạy tại: `https://USERNAME.github.io/noithat-dongnai/`

---

## 🔐 Đăng nhập Google (tuỳ chọn)

Nếu muốn đăng nhập bằng nút Google:

1. Vào [console.cloud.google.com](https://console.cloud.google.com)
2. **APIs & Services → Credentials → Create OAuth 2.0 Client ID**
3. Type: **Web application**
4. Authorized JavaScript origins: thêm URL GitHub Pages của bạn
5. Copy **Client ID**
6. Mở `js/auth.js`, thay:
   ```js
   var GOOGLE_CLIENT_ID = '123456789-abc.apps.googleusercontent.com';
   ```

---

## 🗄️ Dữ liệu — Google Sheets

```
Trình duyệt (GitHub Pages)
        ↕  fetch HTTPS
Google Apps Script (Code.gs)
        ↕
Google Sheets
├── BaoGia      ← Danh sách báo giá
├── HangMuc     ← Chi tiết hạng mục
├── VatTu       ← Danh mục vật tư & đơn giá
├── NguoiDung   ← Tài khoản nhân viên
└── NhatKy      ← Log thao tác
```

Mọi thao tác (tạo/sửa/xóa báo giá, vật tư, nhân viên) đều ghi thẳng lên Sheet ngay lập tức.  
**Không localStorage, không server riêng.**

---

## 👥 Vai trò

| Vai trò | Quyền |
|---------|-------|
| **admin** | Toàn quyền — tạo/sửa/xóa tất cả |
| **manager** | Tạo báo giá, duyệt, xem báo cáo |
| **staff** | Tạo báo giá, chờ duyệt |

---

## 📞 Thông tin công ty

**Công ty TNHH Nội Thất Đồng Nai**  
📍 Số 56A Đường 518 Xa Lộ Hà Nội, KP5, P. Tân Hiệp, TP. Biên Hòa, Đồng Nai  
📞 0932.60.70.60  
📧 Noithatdongnai.info@gmail.com
