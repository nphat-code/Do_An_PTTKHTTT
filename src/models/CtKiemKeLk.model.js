const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CtKiemKeLk = sequelize.define('CtKiemKeLk', {
    maPk: { type: DataTypes.STRING(20), primaryKey: true, references: { model: 'PHIEU_KIEM_KE', key: 'maPk' } },
    maLk: { type: DataTypes.STRING(20), primaryKey: true, references: { model: 'LINH_KIEN', key: 'maLk' } },
    slHeThong: { type: DataTypes.INTEGER },
    slThucTe: { type: DataTypes.INTEGER },
    ghiChu: { type: DataTypes.TEXT }
}, { tableName: 'CT_KIEM_KE_LK', timestamps: false });

module.exports = CtKiemKeLk;