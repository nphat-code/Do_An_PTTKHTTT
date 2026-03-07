const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CtKiemKeMay = sequelize.define('CtKiemKeMay', {
    maPk: { type: DataTypes.STRING(20), primaryKey: true, references: { model: 'PHIEU_KIEM_KE', key: 'maPk' } },
    soSerial: { type: DataTypes.STRING(50), primaryKey: true, references: { model: 'CHI_TIET_MAY', key: 'soSerial' } },
    ttHeThong: { type: DataTypes.STRING },
    ttThucTe: { type: DataTypes.STRING }
}, { tableName: 'CT_KIEM_KE_MAY', timestamps: false });

module.exports = CtKiemKeMay;