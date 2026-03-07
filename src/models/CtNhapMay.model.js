const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CtNhapMay = sequelize.define('CtNhapMay', {
    maPn: { type: DataTypes.STRING(20), primaryKey: true, references: { model: 'PHIEU_NHAP', key: 'maPn' } },
    maModel: { type: DataTypes.STRING(50), primaryKey: true, references: { model: 'DONG_MAY', key: 'maModel' } },
    soLuong: { type: DataTypes.INTEGER },
    donGia: { type: DataTypes.DECIMAL(15, 2) }
}, { tableName: 'CT_NHAP_MAY', timestamps: false });

module.exports = CtNhapMay;