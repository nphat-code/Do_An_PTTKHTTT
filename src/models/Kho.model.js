const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Kho = sequelize.define('Kho', {
    maKho: { type: DataTypes.STRING(20), primaryKey: true },
    tenKho: { type: DataTypes.STRING, allowNull: false },
    diaChi: { type: DataTypes.TEXT },
    sdt: { type: DataTypes.STRING(15) },
    loaiKho: { type: DataTypes.ENUM('Kho tổng', 'Kho bán lẻ', 'Kho bảo hành', 'Kho online') },
    trangThai: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'KHO', timestamps: false });

module.exports = Kho;