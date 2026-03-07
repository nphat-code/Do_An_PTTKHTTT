const sequelize = require('../config/database');

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
