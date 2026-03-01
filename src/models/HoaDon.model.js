const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HoaDon = sequelize.define('HoaDon', {
    maHd: { type: DataTypes.STRING(20), primaryKey: true },
    ngayLap: { type: DataTypes.DATE },
    tongTien: { type: DataTypes.DECIMAL(15, 2) },
    ghiChu: { type: DataTypes.TEXT },
    trangThai: { type: DataTypes.STRING(50), defaultValue: 'Chờ xử lý' }
    // maKh, maNv, maHttt, maKm FK
}, { tableName: 'HOA_DON', timestamps: false });

module.exports = HoaDon;