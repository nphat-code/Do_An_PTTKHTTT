const { DataTypes } = require('sequelize');
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

module.exports = DongMay;