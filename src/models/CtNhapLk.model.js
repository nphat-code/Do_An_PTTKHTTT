const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CtNhapLk = sequelize.define('CtNhapLk', {
    soLuong: { type: DataTypes.INTEGER },
    donGia: { type: DataTypes.DECIMAL(15, 2) }
    // maPn, maLk FK as composite PK
}, { tableName: 'CT_NHAP_LK', timestamps: false });

module.exports = CtNhapLk;