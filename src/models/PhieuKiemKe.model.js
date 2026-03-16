const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PhieuKiemKe = sequelize.define('PhieuKiemKe', {
    maPk: { type: DataTypes.STRING(20), primaryKey: true },
    maNv: { type: DataTypes.STRING(20) },
    maKho: { type: DataTypes.STRING(20) },
    ngayKiemKe: { type: DataTypes.DATE },
    ghiChu: { type: DataTypes.TEXT }
}, { tableName: 'PHIEU_KIEM_KE', timestamps: false });

module.exports = PhieuKiemKe;