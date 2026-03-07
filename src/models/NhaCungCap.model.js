const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NhaCungCap = sequelize.define('NhaCungCap', {
    maNcc: { type: DataTypes.STRING(20), primaryKey: true },
    tenNcc: { type: DataTypes.STRING, allowNull: false },
    diaChi: { type: DataTypes.TEXT },
    sdt: { type: DataTypes.STRING(15) },
    email: { type: DataTypes.STRING },
    trangThai: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'NHA_CUNG_CAP', timestamps: false });

module.exports = NhaCungCap;