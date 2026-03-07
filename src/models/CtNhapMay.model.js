const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CtNhapMay = sequelize.define('CtNhapMay', {
    soLuong: { type: DataTypes.INTEGER },
    donGia: { type: DataTypes.DECIMAL(15, 2) }
    // maPn, maModel FK as composite PK
}, { tableName: 'CT_NHAP_MAY', timestamps: false });

module.exports = CtNhapMay;