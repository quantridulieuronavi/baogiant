/**
 * DATA — Nội Thất Đồng Nai
 *
 * Chiến lược dữ liệu:
 *  - quotes[]    : LUÔN tải từ Google Sheets (rỗng mặc định)
 *  - materials[] : Fallback hardcode nếu Sheet chưa có dữ liệu,
 *                  sau đó tải từ Sheet khi app khởi động
 *  - users[]     : Fallback hardcode, tải từ Sheet khi khởi động
 *
 * Dữ liệu KHÔNG lưu localStorage — mọi thay đổi đều ghi thẳng
 * lên Google Sheets qua api.js
 */

// ── DATA ──
var EMOJI = {
  'Phòng khách':'🛋️','Phòng ngủ':'🛏️','Phòng bếp':'🍳',
  'Nhà vệ sinh':'🚿','Vật liệu':'🪵','Phụ kiện tủ':'⚙️',
  'Rèm':'🪟','Thi công':'🔧'
};
var materials = [
  // Phòng khách
  {id:1,  name:'Vách ốp tường MDF phủ Melamine (tivi/sofa)',  cat:'Phòng khách', unit:'m²',    price:1300000, note:'MDF Ba Thanh/An Cường chống ẩm, đèn led hắt sáng'},
  {id:2,  name:'Tủ tivi treo MDF phủ Melamine',              cat:'Phòng khách', unit:'m dài', price:2000000, note:'Đèn led hắt sáng'},
  {id:3,  name:'Tủ trang trí cánh nhôm kính + led',          cat:'Phòng khách', unit:'m²',    price:3600000, note:'Cánh tủ trên hệ nhôm kính, đèn led hắt sáng, bản lề giảm chấn'},
  {id:4,  name:'Tủ gầm cầu thang MDF + led',                 cat:'Phòng khách', unit:'m²',    price:2400000, note:'MDF Ba Thanh chống ẩm, đèn led hắt sáng, bản lề & ray trượt'},
  {id:5,  name:'Sofa bọc simili/vải',                         cat:'Phòng khách', unit:'Bộ',    price:20600000,note:'Khung gỗ thông, đan thun & lò xo, nệm mút D38, bọc simili/vải'},
  {id:6,  name:'Bàn sofa MDF + khung sắt sơn tĩnh điện',     cat:'Phòng khách', unit:'m dài', price:3500000, note:'Ray bi giảm chấn'},
  // Phòng ngủ
  {id:7,  name:'Giường ngủ bọc vải/simili + sắt hộp',        cat:'Phòng ngủ',   unit:'Bộ',    price:9000000, note:'Khung MDF/MDF Thái bọc vải hoặc DA simili, vạt thang sắt hộp 30x60mm, không kèm nệm'},
  {id:8,  name:'Giường ngủ bọc vải nhung cao cấp',            cat:'Phòng ngủ',   unit:'Bộ',    price:12000000,note:'MDF An Cường bọc vải nhung, inox mạ PVD vàng, vạt thang sắt hộp 30x60mm'},
  {id:9,  name:'Vách ốp đầu giường bọc vải nhung + inox PVD',cat:'Phòng ngủ',   unit:'m²',    price:6500000, note:'Khung MDF An Cường chống ẩm bọc vải nhung Cỏ May, la inox dập hộp mạ PVD vàng'},
  {id:10, name:'Vách ốp đầu giường bọc DA simili + inox PVD',cat:'Phòng ngủ',   unit:'m²',    price:5500000, note:'Khung MDF An Cường chống ẩm bọc DA simili, la inox mạ PVD vàng'},
  {id:11, name:'Vách đầu giường MDF lam sóng PVC + led',      cat:'Phòng ngủ',   unit:'m²',    price:1400000, note:'MDF An Cường chống ẩm phủ Melamine, lam sóng PVC, CNC + đợt kệ sách'},
  {id:12, name:'Vách ốp đầu giường MDF + tấm PVC lam sóng',  cat:'Phòng ngủ',   unit:'m²',    price:1300000, note:'MDF chống ẩm phủ Melamine, ốp PVC lam sóng, hắt đèn led'},
  {id:13, name:'Tab đầu giường MDF phủ Melamine',             cat:'Phòng ngủ',   unit:'Bộ',    price:1900000, note:'Ván MDF An Cường chống ẩm phủ Melamine, ray bi giảm chấn Hafele'},
  {id:14, name:'Tab đầu giường MDF + inox PVD vàng',          cat:'Phòng ngủ',   unit:'Bộ',    price:4900000, note:'MDF An Cường phủ Melamine, mặt hộc bọc vải, chân inox mạ PVD vàng, ray Hafele'},
  {id:15, name:'Tab đầu giường + ngăn kéo (ray Hafele)',      cat:'Phòng ngủ',   unit:'Bộ',    price:1900000, note:'MDF An Cường phủ Melamine, ngăn kéo tay nắm âm, ray trượt giảm chấn Hafele'},
  {id:16, name:'Sàn nâng giường ngủ MDF + sắt hộp',           cat:'Phòng ngủ',   unit:'m²',    price:2000000, note:'Khung xương sắt hộp, ván Plywood/MDF phủ Melamine An Cường'},
  {id:17, name:'Tủ quần áo MDF phủ Melamine (ray & bản lề Hafele)',cat:'Phòng ngủ',unit:'m²', price:3900000, note:'Ván Plywood/MDF An Cường phủ Melamine, bản lề & ray bi giảm chấn Hafele'},
  {id:18, name:'Tủ quần áo Plywood sơn Pu trắng (Hafele)',    cat:'Phòng ngủ',   unit:'m²',    price:5300000, note:'Ván Plywood An Cường sơn Pu màu trắng, ray bi & bản lề giảm chấn Hafele'},
  {id:19, name:'Tủ quần áo MDF cánh nhôm kính + led',         cat:'Phòng ngủ',   unit:'m²',    price:4600000, note:'MDF Ba Thanh/An Cường chống ẩm phủ Melamine, cánh nhôm kính, đèn led hắt sáng'},
  {id:20, name:'Tủ quần áo cánh ốp kính soi + Hafele',        cat:'Phòng ngủ',   unit:'m²',    price:3900000, note:'Ván Plywood phủ Melamine, 1 cánh ốp kính soi toàn thân 5ly, bản lề & ray Hafele'},
  {id:21, name:'Tủ trang trí MDF Acrylic + inox PVD + led',   cat:'Phòng ngủ',   unit:'m²',    price:6500000, note:'MDF An Cường chống ẩm phủ Acrylic, la inox mạ PVD vàng, đợt kệ led, bản lề Hafele'},
  {id:22, name:'Tủ trang trí liên kết tủ quần áo + kính mờ', cat:'Phòng ngủ',   unit:'m²',    price:4300000, note:'MDF An Cường phủ Melamine, tay nắm âm, bản lề Hafele, led, khung kính đúc mờ'},
  {id:23, name:'Tủ thấp trang trí Plywood sơn trắng + inox', cat:'Phòng ngủ',   unit:'Bộ',    price:5400000, note:'Ván Plywood An Cường sơn trắng, chân gỗ tiện, nẹp inox vàng đồng, bản lề Hafele'},
  {id:24, name:'Bàn trang điểm MDF phủ Melamine',             cat:'Phòng ngủ',   unit:'m dài', price:2500000, note:'MDF An Cường chống ẩm phủ Melamine, ray bi giảm chấn Hafele'},
  {id:25, name:'Bàn trang điểm inox PVD + kính cường lực',   cat:'Phòng ngủ',   unit:'Bộ',    price:9000000, note:'Khung inox PVD vàng đồng, mặt kính 8mm sơn đen vát lá hẹ, bọc vải nhung Cỏ Mây, ray Hafele'},
  {id:26, name:'Bàn trang điểm gỗ Ash sơn PU',                cat:'Phòng ngủ',   unit:'Bộ',    price:7500000, note:'Gỗ Ash sơn màu/Pu trắng, kết hợp nệm vải Cỏ Mây'},
  {id:27, name:'Ghế trang điểm bọc vải nhung Cỏ Mây',        cat:'Phòng ngủ',   unit:'Bộ',    price:4500000, note:'Khung gỗ/Ash, bọc vải nhung, chân viền inox'},
  {id:28, name:'Bàn làm việc MDF + khung sắt',                 cat:'Phòng ngủ',   unit:'m dài', price:2500000, note:'MDF An Cường phủ Melamine, khung sắt hộp chịu lực, ray bi Hafele'},
  {id:29, name:'Bàn làm việc treo MDF',                        cat:'Phòng ngủ',   unit:'m dài', price:1900000, note:'MDF Ba Thanh/An Cường chống ẩm phủ Melamine, ray ngăn kéo'},
  {id:30, name:'Tủ dưới bàn học có cánh MDF (Hafele)',        cat:'Phòng ngủ',   unit:'m dài', price:2600000, note:'MDF An Cường phủ Melamine, bản lề giảm chấn Hafele, tay nắm vát'},
  {id:31, name:'Tủ kệ sách trên bàn học + led',               cat:'Phòng ngủ',   unit:'m²',    price:2500000, note:'MDF An Cường phủ Melamine, tấm hậu sơn xám nhạt, đèn led hắt sáng'},
  {id:32, name:'Tủ kệ sách MDF phủ Melamine (Hafele)',        cat:'Phòng ngủ',   unit:'m²',    price:2800000, note:'Ván Plywood/MDF An Cường phủ Melamine, bản lề giảm chấn Hafele, tay nắm vát'},
  {id:33, name:'Kệ sách treo tường MDF CNC trang trí',        cat:'Phòng ngủ',   unit:'m²',    price:2400000, note:'MDF An Cường phủ Melamine, cắt lỗ tròn CNC trang trí'},
  {id:34, name:'Vách ốp MDF cửa sổ bàn học',                  cat:'Phòng ngủ',   unit:'m²',    price:1200000, note:'MDF An Cường chống ẩm phủ Melamine'},
  {id:35, name:'Gương soi led cảm biến + khung inox PVD',     cat:'Phòng ngủ',   unit:'Bộ',    price:7500000, note:'Đèn led cảm biến chạm, khung viền inox mạ PVD vàng'},
  {id:36, name:'Gương soi bọc nỉ toàn thân lượn sóng',       cat:'Phòng ngủ',   unit:'Bộ',    price:4500000, note:'Gương bọc nỉ lượn sóng'},
  {id:37, name:'Gương tròn led + cảm biến chạm',              cat:'Phòng ngủ',   unit:'Bộ',    price:3500000, note:'Gương soi D700, đèn led hắt cảm biến chạm'},
  {id:38, name:'Gương trang điểm led hắt + cảm biến',        cat:'Phòng ngủ',   unit:'Bộ',    price:4500000, note:'Gương + led hắt trang trí, cảm biến chạm'},
  {id:39, name:'Gương soi toàn thân khung nhôm đen',          cat:'Phòng ngủ',   unit:'Bộ',    price:3000000, note:'Khung viền nhôm đen, W510xH2060mm'},
  // Phòng bếp
  {id:40, name:'Tủ bếp dưới MDF phủ Melamine (Hafele/Ivan)',  cat:'Phòng bếp',   unit:'m dài', price:2000000, note:'MDF Ba Thanh chống ẩm phủ Melamine, bản lề & ray giảm chấn, không gồm: chậu rửa, đá, thiết bị điện'},
  {id:41, name:'Tủ bếp dưới cánh Acrylic (Ivan)',             cat:'Phòng bếp',   unit:'m dài', price:3600000, note:'Thùng MDF Ba Thanh phủ Melamine, thùng chậu ván nhựa Picomat, cánh Acrylic, không gồm: chậu, đá, thiết bị điện'},
  {id:42, name:'Tủ bếp trên MDF phủ Melamine + led (Hafele)', cat:'Phòng bếp',   unit:'m dài', price:2600000, note:'MDF Ba Thanh chống ẩm phủ Melamine, đèn led hắt sáng, bản lề, không gồm máy hút mùi'},
  {id:43, name:'Tủ bếp trên cánh Acrylic + led (Ivan)',       cat:'Phòng bếp',   unit:'m dài', price:3300000, note:'MDF Ba Thanh phủ Melamine, cánh Acrylic, đèn led hắt sáng, không gồm máy hút mùi'},
  {id:44, name:'Mặt đá bếp granite trắng vân mây',            cat:'Phòng bếp',   unit:'m dài', price:1600000, note:'Đá trắng vân mây, ghép cạnh giả dày 40mm'},
  {id:45, name:'Mặt đá dựng bếp granite',                     cat:'Phòng bếp',   unit:'m dài', price:1600000, note:'Đá trắng vân mây'},
  // Nhà vệ sinh & lavabo
  {id:46, name:'Tủ gương WPB phủ Melamine (Hafele)',          cat:'Nhà vệ sinh', unit:'m²',    price:2600000, note:'Ván WPB/WPC An Cường phủ Melamine, cánh mở tay nắm âm, mặt gương soi 5mm, bản lề Hafele'},
  {id:47, name:'Tủ dưới lavabo WPB phủ Melamine (Hafele)',    cat:'Nhà vệ sinh', unit:'m dài', price:2400000, note:'Ván nhựa WPB An Cường phủ Melamine/Acrylic, cánh mở tay nắm âm, bản lề Hafele'},
  {id:48, name:'Đá ốp lavabo men sứ vân mây Ấn Độ',          cat:'Nhà vệ sinh', unit:'m dài', price:1800000, note:'Đá men sứ vân mây, xuất xứ Ấn Độ loại I, dày 18mm'},
  // Vật liệu & ván gỗ
  {id:49, name:'Ván MDF An Cường chống ẩm phủ Melamine',      cat:'Vật liệu',    unit:'m²',    price:1300000, note:'Dày 18mm, hai mặt chống trầy'},
  {id:50, name:'Ván Plywood An Cường phủ Melamine',           cat:'Vật liệu',    unit:'m²',    price:1200000, note:'Dày 18mm'},
  {id:51, name:'Ván MDF An Cường phủ Acrylic',                cat:'Vật liệu',    unit:'m²',    price:1800000, note:'Nhiều màu theo mẫu chọn'},
  {id:52, name:'Ván WPB/WPC (nhà vệ sinh/lavabo)',            cat:'Vật liệu',    unit:'m²',    price:1500000, note:'Chống nước hoàn toàn'},
  {id:53, name:'Ván MDF Ba Thanh chống ẩm phủ Melamine',      cat:'Vật liệu',    unit:'m²',    price:1100000, note:'Kim Tín lõi xanh kháng ẩm, hai mặt chống trầy'},
  {id:54, name:'Kính cường lực 5mm (pano tủ)',                cat:'Vật liệu',    unit:'m²',    price:750000,  note:''},
  {id:55, name:'Kính cường lực 8mm (mặt bàn)',               cat:'Vật liệu',    unit:'m²',    price:950000,  note:'Cắt theo kích thước, vát lá hẹ'},
  {id:56, name:'Inox mạ PVD vàng đồng',                       cat:'Vật liệu',    unit:'m dài', price:350000,  note:'Nẹp/la/chân, mạ PVD bền màu'},
  {id:57, name:'Tấm PVC lam sóng trang trí',                  cat:'Vật liệu',    unit:'m²',    price:280000,  note:'Nhiều màu, ốp đầu giường/vách trang trí'},
  {id:58, name:'Chỉ tường PVC trang trí',                     cat:'Vật liệu',    unit:'m dài', price:45000,   note:''},
  {id:59, name:'Giấy dán tường',                               cat:'Vật liệu',    unit:'m²',    price:280000,  note:'Theo mẫu chọn'},
  // Phụ kiện tủ
  {id:60, name:'Bản lề giảm chấn Hafele 110°',               cat:'Phụ kiện tủ', unit:'Cái',   price:85000,   note:'Nhập khẩu Đức, êm ái'},
  {id:61, name:'Ray bi giảm chấn Hafele (ngăn kéo)',          cat:'Phụ kiện tủ', unit:'Bộ',    price:180000,  note:'Âm sàn, nhập Đức'},
  {id:62, name:'Bản lề giảm chấn GROB inox',                  cat:'Phụ kiện tủ', unit:'Cái',   price:65000,   note:'110°'},
  {id:63, name:'Ray bi sơn tĩnh điện (ngăn kéo)',             cat:'Phụ kiện tủ', unit:'Bộ',    price:95000,   note:''},
  {id:64, name:'Tay nắm âm (inox/nhựa)',                      cat:'Phụ kiện tủ', unit:'Cái',   price:25000,   note:'Nhiều kích thước'},
  {id:65, name:'Chân tủ inox điều chỉnh',                     cat:'Phụ kiện tủ', unit:'Cái',   price:25000,   note:'Chỉnh cao 10–15cm'},
  {id:66, name:'Vít & ốc inox bộ 100 cái',                   cat:'Phụ kiện tủ', unit:'Gói',   price:25000,   note:''},
  // Rèm
  {id:67, name:'Rèm vải cầu vòng Modero (Hàn Quốc)',          cat:'Rèm',         unit:'m²',    price:1100000, note:'Rèm vải che nắng, xuất xứ Hàn Quốc'},
  {id:68, name:'Rèm vải 1 lớp cản sáng 80-90% (Hàn Quốc)',  cat:'Rèm',         unit:'m²',    price:1000000, note:'Vải Hàn Quốc, cản sáng 80–90%'},
  {id:69, name:'Rèm vải 2 lớp cản sáng + voan trang trí',   cat:'Rèm',         unit:'m²',    price:1700000, note:'Lớp 1 cản sáng 80–90%, lớp voan trang trí 40–50%, Hàn Quốc'},
  // Thi công
  {id:70, name:'Phí vận chuyển & lắp đặt',                    cat:'Thi công',    unit:'Gói',   price:0,       note:'Bao gồm trong đơn giá sản phẩm'},
  {id:71, name:'Phí thiết kế & phối cảnh 3D',                  cat:'Thi công',    unit:'Gói',   price:5000000, note:'Bản vẽ 2D/3D + phối cảnh theo thực tế'},
  {id:72, name:'Giám sát thi công',                             cat:'Thi công',    unit:'Gói',   price:3000000, note:'Theo dõi tiến độ toàn bộ công trình'},
];
var users = [
  {id:1,name:'Nguyễn Văn Tổng',email:'admin@noithatdn.vn',role:'admin',password:'admin123',status:'active',created:'01/01/2025'},
  {id:2,name:'Trần Thị Hoa',email:'hoa.tran@noithatdn.vn',role:'manager',password:'manager123',status:'active',created:'15/03/2025'},
  {id:3,name:'Lê Minh Đức',email:'duc.le@noithatdn.vn',role:'staff',password:'staff123',status:'active',created:'01/06/2025'},
  {id:4,name:'Phạm Văn Bình',email:'binh.pham@noithatdn.vn',role:'staff',password:'staff123',status:'inactive',created:'20/09/2025'},
];
var quoteNextId = 1;  // Tự cập nhật từ Sheet
var quotes = [];  // Tải từ Google Sheets khi khởi động

var matNextId = 73, userNextId = 5;
var pickerSel = {}, quoteRows = [];
var currentUser = null, editingMatId = null;

var ROLES = {
  admin:   {label:'👑 Admin',    tag:'Admin',     color:'badge-admin',   nav:['dashboard','quotes','new-quote','materials','reports','users','preview']},
  manager: {label:'📊 Quản lý', tag:'Quản lý',   color:'badge-manager', nav:['dashboard','quotes','new-quote','materials','reports','preview']},
  staff:   {label:'✏️ Nhân viên',tag:'Nhân viên', color:'badge-staff',   nav:['dashboard','quotes','new-quote','materials','preview']}
};
var NAV_DEF = [
  {id:'dashboard',  icon:'◈', label:'Tổng quan'},
  {id:'quotes',     icon:'◻', label:'Danh sách báo giá'},
  {id:'new-quote',  icon:'＋', label:'Tạo báo giá'},
  {id:'materials',  icon:'▦', label:'Vật tư & phụ kiện'},
  {id:'reports',    icon:'📈', label:'Báo cáo & thống kê'},
  {id:'users',      icon:'👥', label:'Tài khoản & phân quyền'},
  {id:'preview',    icon:'⊡', label:'Xem PDF'}
];
var PAGE_TITLES = {
  dashboard:'Tổng quan', quotes:'Danh sách báo giá', 'new-quote':'Tạo báo giá mới',
  materials:'Vật tư & phụ kiện', reports:'Báo cáo & thống kê',
  users:'Tài khoản & phân quyền', preview:'Xem trước PDF'
};
var STATUS_LABELS = {draft:'Nháp', pending:'Chờ duyệt', approved:'Đã duyệt', signed:'Đã ký'};
var STATUS_BADGE  = {draft:'badge-draft', pending:'badge-pending', approved:'badge-admin', signed:'badge-done'};

function fmt(n) { return Math.round(n).toLocaleString('vi-VN'); }
