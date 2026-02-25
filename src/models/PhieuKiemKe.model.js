const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PhieuKiemKe = sequelize.define('PhieuKiemKe', {
    maPk: { type: DataTypes.STRING(20), primaryKey: true },
    ngayKiemKe: { type: DataTypes.DATE },
    ghiChu: { type: DataTypes.TEXT }
    // maNv, maKho FK
}, { tableName: 'PHIEU_KIEM_KE', timestamps: false });

module.exports = PhieuKiemKe;