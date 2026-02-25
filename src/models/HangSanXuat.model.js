const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HangSanXuat = sequelize.define('HangSanXuat', {
    maHang: { type: DataTypes.STRING(20), primaryKey: true },
    tenHang: { type: DataTypes.STRING, allowNull: false },
    quocGia: { type: DataTypes.STRING }
}, { tableName: 'HANG_SAN_XUAT', timestamps: false });

module.exports = HangSanXuat;