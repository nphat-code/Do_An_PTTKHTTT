const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CtKiemKeMay = sequelize.define('CtKiemKeMay', {
    ttHeThong: { type: DataTypes.STRING },
    ttThucTe: { type: DataTypes.STRING }
    // maPk, soSerial FK as composite PK
}, { tableName: 'CT_KIEM_KE_MAY', timestamps: false });

module.exports = CtKiemKeMay;