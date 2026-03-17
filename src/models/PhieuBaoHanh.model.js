const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PhieuBaoHanh = sequelize.define('PhieuBaoHanh', {
    maPbh: { type: DataTypes.STRING(20), primaryKey: true },
    ngayLap: { type: DataTypes.DATE },
    moTaLoi: { type: DataTypes.TEXT },
    ketLuanKyThuat: { type: DataTypes.TEXT },
    ngayTraMay: { type: DataTypes.DATE },
    chiPhiSuaChua: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    phiDichVu: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    loaiPhieu: { type: DataTypes.ENUM('Bảo hành', 'Sửa chữa'), defaultValue: 'Bảo hành' },
    daXacNhanBaoGia: { type: DataTypes.BOOLEAN, defaultValue: false },
    trangThaiQc: { type: DataTypes.BOOLEAN, defaultValue: false },
    trangThai: {
        type: DataTypes.ENUM('Chờ kiểm tra', 'Đang sửa', 'Đã xong', 'Đã trả máy'),
        defaultValue: 'Chờ kiểm tra'
    }
    // soSerial, maNvTiepNhan, maNvKyThuat, maHttt FK
}, { tableName: 'PHIEU_BAO_HANH', timestamps: false });

module.exports = PhieuBaoHanh;