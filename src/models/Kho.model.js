const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Kho = sequelize.define('Kho', {
    maKho: { type: DataTypes.STRING(20), primaryKey: true },
    tenKho: { type: DataTypes.STRING, allowNull: false },
    diaChi: { type: DataTypes.TEXT },
    loaiKho: { type: DataTypes.ENUM('Kho lưu trữ', 'Kho trưng bày', 'Kho bảo hành') },
    trangThai: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'KHO', timestamps: false });

module.exports = Kho;