const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChiTietMay = sequelize.define('ChiTietMay', {
    soSerial: { type: DataTypes.STRING(50), primaryKey: true },
    trangThai: { type: DataTypes.ENUM('Trong kho', 'Đã bán', 'Đang bảo hành', 'Thất lạc', 'Hàng lỗi') }
    // maModel, maKho, maHd FK
}, { tableName: 'CHI_TIET_MAY', timestamps: false });

module.exports = ChiTietMay;