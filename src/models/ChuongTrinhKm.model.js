const { DataTypes } = require('sequelize');
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

module.exports = ChuongTrinhKm;