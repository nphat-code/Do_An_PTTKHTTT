const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HinhThucThanhToan = sequelize.define('HinhThucThanhToan', {
    maHttt: { type: DataTypes.STRING(20), primaryKey: true },
    tenHttt: { type: DataTypes.STRING, allowNull: false },
    moTa: { type: DataTypes.TEXT }
}, { tableName: 'HINH_THUC_THANH_TOAN', timestamps: false });

module.exports = HinhThucThanhToan;