const { DataTypes } = require('sequelize');
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

module.exports = PhieuBaoHanh;