const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'src', 'models');

// Delete existing models
if (fs.existsSync(modelsDir)) {
    const files = fs.readdirSync(modelsDir);
    for (const file of files) {
        fs.unlinkSync(path.join(modelsDir, file));
    }
} else {
    fs.mkdirSync(modelsDir, { recursive: true });
}

// Model definitions
const models = {
    NhaCungCap: `const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NhaCungCap = sequelize.define('NhaCungCap', {
    maNcc: { type: DataTypes.STRING(20), primaryKey: true },
    tenNcc: { type: DataTypes.STRING, allowNull: false },
    diaChi: { type: DataTypes.TEXT },
    sdt: { type: DataTypes.STRING(15) },
    email: { type: DataTypes.STRING },
    trangThai: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'NHA_CUNG_CAP', timestamps: false });

module.exports = NhaCungCap;`,

    HangSanXuat: `const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HangSanXuat = sequelize.define('HangSanXuat', {
    maHang: { type: DataTypes.STRING(20), primaryKey: true },
    tenHang: { type: DataTypes.STRING, allowNull: false },
    quocGia: { type: DataTypes.STRING }
}, { tableName: 'HANG_SAN_XUAT', timestamps: false });

module.exports = HangSanXuat;`,

    ChiNhanh: `const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChiNhanh = sequelize.define('ChiNhanh', {
    maCn: { type: DataTypes.STRING(20), primaryKey: true },
    tenCn: { type: DataTypes.STRING, allowNull: false },
    diaChi: { type: DataTypes.TEXT }
    // maNvQuanLy FK
}, { tableName: 'CHI_NHANH', timestamps: false });

module.exports = ChiNhanh;`,

    NhanVien: `const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NhanVien = sequelize.define('NhanVien', {
    maNv: { type: DataTypes.STRING(20), primaryKey: true },
    hoTen: { type: DataTypes.STRING, allowNull: false },
    ngaySinh: { type: DataTypes.DATEONLY },
    gioiTinh: { type: DataTypes.ENUM('Nam', 'Nữ', 'Khác') },
    sdt: { type: DataTypes.STRING(15) },
    email: { type: DataTypes.STRING },
    diaChi: { type: DataTypes.TEXT },
    trangThai: { type: DataTypes.BOOLEAN, defaultValue: true },
    matKhau: { type: DataTypes.STRING }
    // maCv, maCn FK
}, { tableName: 'NHAN_VIEN', timestamps: false });

module.exports = NhanVien;`,

    ChucVu: `const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChucVu = sequelize.define('ChucVu', {
    maCv: { type: DataTypes.STRING(20), primaryKey: true },
    tenCv: { type: DataTypes.STRING, allowNull: false },
    moTa: { type: DataTypes.TEXT },
    luongCoBan: { type: DataTypes.DECIMAL(15, 2) }
}, { tableName: 'CHUC_VU', timestamps: false });

module.exports = ChucVu;`,

    KhachHang: `const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const KhachHang = sequelize.define('KhachHang', {
    maKh: { type: DataTypes.STRING(20), primaryKey: true },
    hoTen: { type: DataTypes.STRING, allowNull: false },
    ngaySinh: { type: DataTypes.DATEONLY },
    gioiTinh: { type: DataTypes.ENUM('Nam', 'Nữ', 'Khác') },
    sdt: { type: DataTypes.STRING(15) },
    email: { type: DataTypes.STRING },
    diaChi: { type: DataTypes.TEXT },
    matKhau: { type: DataTypes.STRING },
    trangThai: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'KHACH_HANG', timestamps: false });

module.exports = KhachHang;`,

    LoaiMay: `const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LoaiMay = sequelize.define('LoaiMay', {
    maLoai: { type: DataTypes.STRING(20), primaryKey: true },
    tenLoai: { type: DataTypes.STRING, allowNull: false }
}, { tableName: 'LOAI_MAY', timestamps: false });

module.exports = LoaiMay;`,

    DongMay: `const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DongMay = sequelize.define('DongMay', {
    maModel: { type: DataTypes.STRING(50), primaryKey: true },
    tenModel: { type: DataTypes.STRING, allowNull: false },
    giaNhap: { type: DataTypes.DECIMAL(15, 2) },
    giaBan: { type: DataTypes.DECIMAL(15, 2) },
    soLuongTon: { type: DataTypes.INTEGER, defaultValue: 0 },
    hinhAnh: { type: DataTypes.TEXT }
    // maCh, maHang, maLoai FK
}, { tableName: 'DONG_MAY', timestamps: false });

module.exports = DongMay;`,

    CauHinh: `const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CauHinh = sequelize.define('CauHinh', {
    maCh: { type: DataTypes.STRING(50), primaryKey: true },
    cpu: { type: DataTypes.STRING },
    ram: { type: DataTypes.STRING },
    oCung: { type: DataTypes.STRING },
    vga: { type: DataTypes.STRING },
    manHinh: { type: DataTypes.STRING },
    pin: { type: DataTypes.STRING },
    trongLuong: { type: DataTypes.FLOAT }
}, { tableName: 'CAU_HINH', timestamps: false });

module.exports = CauHinh;`,

    Kho: `const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Kho = sequelize.define('Kho', {
    maKho: { type: DataTypes.STRING(20), primaryKey: true },
    tenKho: { type: DataTypes.STRING, allowNull: false },
    diaChi: { type: DataTypes.TEXT },
    sdt: { type: DataTypes.STRING(15) },
    loaiKho: { type: DataTypes.ENUM('Kho tổng', 'Kho bán lẻ', 'Kho bảo hành', 'Kho online') },
    trangThai: { type: DataTypes.BOOLEAN, defaultValue: true }
    // maCn FK
}, { tableName: 'KHO', timestamps: false });

module.exports = Kho;`,

    ChiTietMay: `const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChiTietMay = sequelize.define('ChiTietMay', {
    soSerial: { type: DataTypes.STRING(50), primaryKey: true },
    trangThai: { type: DataTypes.ENUM('Trong kho', 'Đã bán', 'Đang bảo hành', 'Thất lạc') }
    // maModel, maKho, maHd FK
}, { tableName: 'CHI_TIET_MAY', timestamps: false });

module.exports = ChiTietMay;`,

    LinhKien: `const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LinhKien = sequelize.define('LinhKien', {
    maLk: { type: DataTypes.STRING(20), primaryKey: true },
    tenLk: { type: DataTypes.STRING, allowNull: false },
    loaiLk: { type: DataTypes.STRING },
    giaNhap: { type: DataTypes.DECIMAL(15, 2) }
    // maHang FK
}, { tableName: 'LINH_KIEN', timestamps: false });

module.exports = LinhKien;`,

    KhoLinhKien: `const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const KhoLinhKien = sequelize.define('KhoLinhKien', {
    soLuongTon: { type: DataTypes.INTEGER, defaultValue: 0 }
    // maLk, maKho FK as composite PK
}, { tableName: 'KHO_LINH_KIEN', timestamps: false });

module.exports = KhoLinhKien;`,

    HoaDon: `const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HoaDon = sequelize.define('HoaDon', {
    maHd: { type: DataTypes.STRING(20), primaryKey: true },
    ngayLap: { type: DataTypes.DATE },
    tongTien: { type: DataTypes.DECIMAL(15, 2) },
    ghiChu: { type: DataTypes.TEXT },
    trangThai: { type: DataTypes.STRING }
    // maKh, maNv, maHttt, maKm FK
}, { tableName: 'HOA_DON', timestamps: false });

module.exports = HoaDon;`,

    CtHoaDon: `const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CtHoaDon = sequelize.define('CtHoaDon', {
    soLuong: { type: DataTypes.INTEGER },
    donGia: { type: DataTypes.DECIMAL(15, 2) },
    thanhTien: { type: DataTypes.DECIMAL(15, 2) }
    // maHd, maModel FK as composite PK
}, { tableName: 'CT_HOA_DON', timestamps: false });

module.exports = CtHoaDon;`,

    PhieuNhap: `const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PhieuNhap = sequelize.define('PhieuNhap', {
    maPn: { type: DataTypes.STRING(20), primaryKey: true },
    ngayNhap: { type: DataTypes.DATE },
    tongTien: { type: DataTypes.DECIMAL(15, 2) }
    // maNcc, maNv, maHttt FK
}, { tableName: 'PHIEU_NHAP', timestamps: false });

module.exports = PhieuNhap;`,

    CtNhapMay: `const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CtNhapMay = sequelize.define('CtNhapMay', {
    soLuong: { type: DataTypes.INTEGER },
    donGia: { type: DataTypes.DECIMAL(15, 2) }
    // maPn, maModel FK as composite PK
}, { tableName: 'CT_NHAP_MAY', timestamps: false });

module.exports = CtNhapMay;`,

    CtNhapLk: `const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CtNhapLk = sequelize.define('CtNhapLk', {
    soLuong: { type: DataTypes.INTEGER },
    donGia: { type: DataTypes.DECIMAL(15, 2) }
    // maPn, maLk FK as composite PK
}, { tableName: 'CT_NHAP_LK', timestamps: false });

module.exports = CtNhapLk;`,

    PhieuKiemKe: `const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PhieuKiemKe = sequelize.define('PhieuKiemKe', {
    maPk: { type: DataTypes.STRING(20), primaryKey: true },
    ngayKiemKe: { type: DataTypes.DATE },
    ghiChu: { type: DataTypes.TEXT }
    // maNv, maKho FK
}, { tableName: 'PHIEU_KIEM_KE', timestamps: false });

module.exports = PhieuKiemKe;`,

    CtKiemKeMay: `const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CtKiemKeMay = sequelize.define('CtKiemKeMay', {
    ttHeThong: { type: DataTypes.STRING },
    ttThucTe: { type: DataTypes.STRING }
    // maPk, soSerial FK as composite PK
}, { tableName: 'CT_KIEM_KE_MAY', timestamps: false });

module.exports = CtKiemKeMay;`,

    CtKiemKeLk: `const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CtKiemKeLk = sequelize.define('CtKiemKeLk', {
    slHeThong: { type: DataTypes.INTEGER },
    slThucTe: { type: DataTypes.INTEGER },
    ghiChu: { type: DataTypes.TEXT }
    // maPk, maLk FK as composite PK
}, { tableName: 'CT_KIEM_KE_LK', timestamps: false });

module.exports = CtKiemKeLk;`,

    PhieuBaoHanh: `const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PhieuBaoHanh = sequelize.define('PhieuBaoHanh', {
    maPbh: { type: DataTypes.STRING(20), primaryKey: true },
    ngayLap: { type: DataTypes.DATE },
    moTaLoi: { type: DataTypes.TEXT },
    ketLuanKyThuat: { type: DataTypes.TEXT },
    ngayTraMay: { type: DataTypes.DATE },
    chiPhiSuaChua: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    trangThai: { type: DataTypes.ENUM('Chờ kiểm tra', 'Đang sửa', 'Đã xong', 'Đã trả máy') }
    // soSerial, maNvTiepNhan, maNvKyThuat, maHttt FK
}, { tableName: 'PHIEU_BAO_HANH', timestamps: false });

module.exports = PhieuBaoHanh;`,

    ChiTietSuaChua: `const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChiTietSuaChua = sequelize.define('ChiTietSuaChua', {
    soLuong: { type: DataTypes.INTEGER },
    donGia: { type: DataTypes.DECIMAL(15, 2) }
    // maPbh, maLk, maKhoXuat FK
}, { tableName: 'CHI_TIET_SUA_CHUA', timestamps: false });

module.exports = ChiTietSuaChua;`,

    ChuongTrinhKm: `const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChuongTrinhKm = sequelize.define('ChuongTrinhKm', {
    maKm: { type: DataTypes.STRING(20), primaryKey: true },
    tenKm: { type: DataTypes.STRING, allowNull: false },
    ngayBatDau: { type: DataTypes.DATE },
    ngayKetThuc: { type: DataTypes.DATE },
    loaiKm: { type: DataTypes.ENUM('Phần trăm', 'Số tiền cố định') },
    giaTriKm: { type: DataTypes.DECIMAL(15, 2) },
    dieuKienApDung: { type: DataTypes.DECIMAL(15, 2) },
    trangThai: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'CHUONG_TRINH_KM', timestamps: false });

module.exports = ChuongTrinhKm;`,

    DongMayKm: `const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DongMayKm = sequelize.define('DongMayKm', {
    ngayThem: { type: DataTypes.DATE }
    // maKm, maModel FK as composite PK
}, { tableName: 'DONG_MAY_KM', timestamps: false });

module.exports = DongMayKm;`,

    HinhThucThanhToan: `const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HinhThucThanhToan = sequelize.define('HinhThucThanhToan', {
    maHttt: { type: DataTypes.STRING(20), primaryKey: true },
    tenHttt: { type: DataTypes.STRING, allowNull: false },
    moTa: { type: DataTypes.TEXT }
}, { tableName: 'HINH_THUC_THANH_TOAN', timestamps: false });

module.exports = HinhThucThanhToan;`
};

for (const [modelName, content] of Object.entries(models)) {
    fs.writeFileSync(path.join(modelsDir, modelName + '.model.js'), content);
}

// index.js creation
const indexContent = `const sequelize = require('../config/database');

const NhaCungCap = require('./NhaCungCap.model');
const HangSanXuat = require('./HangSanXuat.model');
const ChiNhanh = require('./ChiNhanh.model');
const NhanVien = require('./NhanVien.model');
const ChucVu = require('./ChucVu.model');
const KhachHang = require('./KhachHang.model');
const LoaiMay = require('./LoaiMay.model');
const DongMay = require('./DongMay.model');
const CauHinh = require('./CauHinh.model');
const Kho = require('./Kho.model');
const ChiTietMay = require('./ChiTietMay.model');
const LinhKien = require('./LinhKien.model');
const KhoLinhKien = require('./KhoLinhKien.model');
const HoaDon = require('./HoaDon.model');
const CtHoaDon = require('./CtHoaDon.model');
const PhieuNhap = require('./PhieuNhap.model');
const CtNhapMay = require('./CtNhapMay.model');
const CtNhapLk = require('./CtNhapLk.model');
const PhieuKiemKe = require('./PhieuKiemKe.model');
const CtKiemKeMay = require('./CtKiemKeMay.model');
const CtKiemKeLk = require('./CtKiemKeLk.model');
const PhieuBaoHanh = require('./PhieuBaoHanh.model');
const ChiTietSuaChua = require('./ChiTietSuaChua.model');
const ChuongTrinhKm = require('./ChuongTrinhKm.model');
const DongMayKm = require('./DongMayKm.model');
const HinhThucThanhToan = require('./HinhThucThanhToan.model');

// Relationships

// ChiNhanh - NhanVien (người quản lý)
NhanVien.hasOne(ChiNhanh, { foreignKey: 'maNvQuanLy', as: 'ChiNhanhQuanLy' });
ChiNhanh.belongsTo(NhanVien, { foreignKey: 'maNvQuanLy', as: 'QuanLy' });

// ChucVu - NhanVien
ChucVu.hasMany(NhanVien, { foreignKey: 'maCv' });
NhanVien.belongsTo(ChucVu, { foreignKey: 'maCv' });

// ChiNhanh - NhanVien (nơi làm việc)
ChiNhanh.hasMany(NhanVien, { foreignKey: 'maCn' });
NhanVien.belongsTo(ChiNhanh, { foreignKey: 'maCn' });

// ChiNhanh - Kho
ChiNhanh.hasMany(Kho, { foreignKey: 'maCn' });
Kho.belongsTo(ChiNhanh, { foreignKey: 'maCn' });

// DongMay relationships
CauHinh.hasMany(DongMay, { foreignKey: 'maCh' });
DongMay.belongsTo(CauHinh, { foreignKey: 'maCh' });

HangSanXuat.hasMany(DongMay, { foreignKey: 'maHang' });
DongMay.belongsTo(HangSanXuat, { foreignKey: 'maHang' });

LoaiMay.hasMany(DongMay, { foreignKey: 'maLoai' });
DongMay.belongsTo(LoaiMay, { foreignKey: 'maLoai' });

// ChiTietMay relationships
DongMay.hasMany(ChiTietMay, { foreignKey: 'maModel' });
ChiTietMay.belongsTo(DongMay, { foreignKey: 'maModel' });

Kho.hasMany(ChiTietMay, { foreignKey: 'maKho' });
ChiTietMay.belongsTo(Kho, { foreignKey: 'maKho' });

HoaDon.hasMany(ChiTietMay, { foreignKey: 'maHd' });
ChiTietMay.belongsTo(HoaDon, { foreignKey: 'maHd' });

// LinhKien
HangSanXuat.hasMany(LinhKien, { foreignKey: 'maHang' });
LinhKien.belongsTo(HangSanXuat, { foreignKey: 'maHang' });

// KhoLinhKien
LinhKien.belongsToMany(Kho, { through: KhoLinhKien, foreignKey: 'maLk' });
Kho.belongsToMany(LinhKien, { through: KhoLinhKien, foreignKey: 'maKho' });

LinhKien.hasMany(KhoLinhKien, { foreignKey: 'maLk' });
KhoLinhKien.belongsTo(LinhKien, { foreignKey: 'maLk' });
Kho.hasMany(KhoLinhKien, { foreignKey: 'maKho' });
KhoLinhKien.belongsTo(Kho, { foreignKey: 'maKho' });

// HoaDon
KhachHang.hasMany(HoaDon, { foreignKey: 'maKh' });
HoaDon.belongsTo(KhachHang, { foreignKey: 'maKh' });

NhanVien.hasMany(HoaDon, { foreignKey: 'maNv' });
HoaDon.belongsTo(NhanVien, { foreignKey: 'maNv' });

HinhThucThanhToan.hasMany(HoaDon, { foreignKey: 'maHttt' });
HoaDon.belongsTo(HinhThucThanhToan, { foreignKey: 'maHttt' });

ChuongTrinhKm.hasMany(HoaDon, { foreignKey: 'maKm' });
HoaDon.belongsTo(ChuongTrinhKm, { foreignKey: 'maKm' });

// CtHoaDon
HoaDon.belongsToMany(DongMay, { through: CtHoaDon, foreignKey: 'maHd' });
DongMay.belongsToMany(HoaDon, { through: CtHoaDon, foreignKey: 'maModel' });

HoaDon.hasMany(CtHoaDon, { foreignKey: 'maHd' });
CtHoaDon.belongsTo(HoaDon, { foreignKey: 'maHd' });
DongMay.hasMany(CtHoaDon, { foreignKey: 'maModel' });
CtHoaDon.belongsTo(DongMay, { foreignKey: 'maModel' });

// PhieuNhap
NhaCungCap.hasMany(PhieuNhap, { foreignKey: 'maNcc' });
PhieuNhap.belongsTo(NhaCungCap, { foreignKey: 'maNcc' });

NhanVien.hasMany(PhieuNhap, { foreignKey: 'maNv' });
PhieuNhap.belongsTo(NhanVien, { foreignKey: 'maNv' });

HinhThucThanhToan.hasMany(PhieuNhap, { foreignKey: 'maHttt' });
PhieuNhap.belongsTo(HinhThucThanhToan, { foreignKey: 'maHttt' });

// CtNhapMay
PhieuNhap.belongsToMany(DongMay, { through: CtNhapMay, foreignKey: 'maPn' });
DongMay.belongsToMany(PhieuNhap, { through: CtNhapMay, foreignKey: 'maModel' });

PhieuNhap.hasMany(CtNhapMay, { foreignKey: 'maPn' });
CtNhapMay.belongsTo(PhieuNhap, { foreignKey: 'maPn' });
DongMay.hasMany(CtNhapMay, { foreignKey: 'maModel' });
CtNhapMay.belongsTo(DongMay, { foreignKey: 'maModel' });

// CtNhapLk
PhieuNhap.belongsToMany(LinhKien, { through: CtNhapLk, foreignKey: 'maPn' });
LinhKien.belongsToMany(PhieuNhap, { through: CtNhapLk, foreignKey: 'maLk' });

PhieuNhap.hasMany(CtNhapLk, { foreignKey: 'maPn' });
CtNhapLk.belongsTo(PhieuNhap, { foreignKey: 'maPn' });
LinhKien.hasMany(CtNhapLk, { foreignKey: 'maLk' });
CtNhapLk.belongsTo(LinhKien, { foreignKey: 'maLk' });

// PhieuKiemKe
NhanVien.hasMany(PhieuKiemKe, { foreignKey: 'maNv' });
PhieuKiemKe.belongsTo(NhanVien, { foreignKey: 'maNv' });

Kho.hasMany(PhieuKiemKe, { foreignKey: 'maKho' });
PhieuKiemKe.belongsTo(Kho, { foreignKey: 'maKho' });

// CtKiemKeMay
PhieuKiemKe.belongsToMany(ChiTietMay, { through: CtKiemKeMay, foreignKey: 'maPk', otherKey: 'soSerial' });
ChiTietMay.belongsToMany(PhieuKiemKe, { through: CtKiemKeMay, foreignKey: 'soSerial', otherKey: 'maPk' });

PhieuKiemKe.hasMany(CtKiemKeMay, { foreignKey: 'maPk' });
CtKiemKeMay.belongsTo(PhieuKiemKe, { foreignKey: 'maPk' });
ChiTietMay.hasMany(CtKiemKeMay, { foreignKey: 'soSerial' });
CtKiemKeMay.belongsTo(ChiTietMay, { foreignKey: 'soSerial' });

// CtKiemKeLk
PhieuKiemKe.belongsToMany(LinhKien, { through: CtKiemKeLk, foreignKey: 'maPk' });
LinhKien.belongsToMany(PhieuKiemKe, { through: CtKiemKeLk, foreignKey: 'maLk' });

PhieuKiemKe.hasMany(CtKiemKeLk, { foreignKey: 'maPk' });
CtKiemKeLk.belongsTo(PhieuKiemKe, { foreignKey: 'maPk' });
LinhKien.hasMany(CtKiemKeLk, { foreignKey: 'maLk' });
CtKiemKeLk.belongsTo(LinhKien, { foreignKey: 'maLk' });

// PhieuBaoHanh
ChiTietMay.hasMany(PhieuBaoHanh, { foreignKey: 'soSerial' });
PhieuBaoHanh.belongsTo(ChiTietMay, { foreignKey: 'soSerial' });

NhanVien.hasMany(PhieuBaoHanh, { foreignKey: 'maNvTiepNhan', as: 'PhieuTiepNhan' });
PhieuBaoHanh.belongsTo(NhanVien, { foreignKey: 'maNvTiepNhan', as: 'NvTiepNhan' });

NhanVien.hasMany(PhieuBaoHanh, { foreignKey: 'maNvKyThuat', as: 'PhieuSuaChua' });
PhieuBaoHanh.belongsTo(NhanVien, { foreignKey: 'maNvKyThuat', as: 'NvKyThuat' });

HinhThucThanhToan.hasMany(PhieuBaoHanh, { foreignKey: 'maHttt' });
PhieuBaoHanh.belongsTo(HinhThucThanhToan, { foreignKey: 'maHttt' });

// ChiTietSuaChua
// The model is ChiTietSuaChua, it has maPbh, maLk, and maKhoXuat
PhieuBaoHanh.hasMany(ChiTietSuaChua, { foreignKey: 'maPbh' });
ChiTietSuaChua.belongsTo(PhieuBaoHanh, { foreignKey: 'maPbh' });

LinhKien.hasMany(ChiTietSuaChua, { foreignKey: 'maLk' });
ChiTietSuaChua.belongsTo(LinhKien, { foreignKey: 'maLk' });

Kho.hasMany(ChiTietSuaChua, { foreignKey: 'maKhoXuat' });
ChiTietSuaChua.belongsTo(Kho, { foreignKey: 'maKhoXuat' });

// DongMayKm
ChuongTrinhKm.belongsToMany(DongMay, { through: DongMayKm, foreignKey: 'maKm' });
DongMay.belongsToMany(ChuongTrinhKm, { through: DongMayKm, foreignKey: 'maModel' });

ChuongTrinhKm.hasMany(DongMayKm, { foreignKey: 'maKm' });
DongMayKm.belongsTo(ChuongTrinhKm, { foreignKey: 'maKm' });
DongMay.hasMany(DongMayKm, { foreignKey: 'maModel' });
DongMayKm.belongsTo(DongMay, { foreignKey: 'maModel' });


module.exports = {
    sequelize,
    NhaCungCap,
    HangSanXuat,
    ChiNhanh,
    NhanVien,
    ChucVu,
    KhachHang,
    LoaiMay,
    DongMay,
    CauHinh,
    Kho,
    ChiTietMay,
    LinhKien,
    KhoLinhKien,
    HoaDon,
    CtHoaDon,
    PhieuNhap,
    CtNhapMay,
    CtNhapLk,
    PhieuKiemKe,
    CtKiemKeMay,
    CtKiemKeLk,
    PhieuBaoHanh,
    ChiTietSuaChua,
    ChuongTrinhKm,
    DongMayKm,
    HinhThucThanhToan
};
`;

fs.writeFileSync(path.join(modelsDir, 'index.js'), indexContent);
console.log('Database models successfully generated!');
