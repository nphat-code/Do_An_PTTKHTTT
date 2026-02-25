const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChucVu = sequelize.define('ChucVu', {
    maCv: { type: DataTypes.STRING(20), primaryKey: true },
    tenCv: { type: DataTypes.STRING, allowNull: false },
    moTa: { type: DataTypes.TEXT },
    luongCoBan: { type: DataTypes.DECIMAL(15, 2) }
}, { tableName: 'CHUC_VU', timestamps: false });

module.exports = ChucVu;