const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HoaDon = sequelize.define('HoaDon', {
    maHd: { type: DataTypes.STRING(20), primaryKey: true },
    ngayLap: { type: DataTypes.DATE },
    tongTien: { type: DataTypes.DECIMAL(15, 2) },
    tiLeGiamGiaHang: { type: DataTypes.FLOAT, defaultValue: 0 },
    soTienGiamGiaHang: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    soTienGiamGia: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    ghiChu: { type: DataTypes.TEXT },
    trangThai: { type: DataTypes.STRING }
    // maKh, maNv, maHttt, maKm FK
}, { tableName: 'HOA_DON', timestamps: false });

module.exports = HoaDon;