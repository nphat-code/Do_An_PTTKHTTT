const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LoaiMay = sequelize.define('LoaiMay', {
    maLoai: { type: DataTypes.STRING(20), primaryKey: true },
    tenLoai: { type: DataTypes.STRING, allowNull: false }
}, { tableName: 'LOAI_MAY', timestamps: false });

module.exports = LoaiMay;