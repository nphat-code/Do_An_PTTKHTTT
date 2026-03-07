const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CtKiemKeLk = sequelize.define('CtKiemKeLk', {
    slHeThong: { type: DataTypes.INTEGER },
    slThucTe: { type: DataTypes.INTEGER },
    ghiChu: { type: DataTypes.TEXT }
    // maPk, maLk FK as composite PK
}, { tableName: 'CT_KIEM_KE_LK', timestamps: false });

module.exports = CtKiemKeLk;