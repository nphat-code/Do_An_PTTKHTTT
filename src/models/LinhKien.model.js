const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LinhKien = sequelize.define('LinhKien', {
    maLk: { type: DataTypes.STRING(20), primaryKey: true },
    tenLk: { type: DataTypes.STRING, allowNull: false },
    loaiLk: { type: DataTypes.STRING },
    giaNhap: { type: DataTypes.DECIMAL(15, 2) }
    // maHang FK
}, { tableName: 'LINH_KIEN', timestamps: false });

module.exports = LinhKien;