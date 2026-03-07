const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChiNhanh = sequelize.define('ChiNhanh', {
    maCn: { type: DataTypes.STRING(20), primaryKey: true },
    tenCn: { type: DataTypes.STRING, allowNull: false },
    diaChi: { type: DataTypes.TEXT }
    // maNvQuanLy FK
}, { tableName: 'CHI_NHANH', timestamps: false });

module.exports = ChiNhanh;