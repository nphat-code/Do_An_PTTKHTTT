const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CtHoaDon = sequelize.define('CtHoaDon', {
    soLuong: { type: DataTypes.INTEGER },
    donGia: { type: DataTypes.DECIMAL(15, 2) },
    thanhTien: { type: DataTypes.DECIMAL(15, 2) }
    // maHd, maModel FK as composite PK
}, { tableName: 'CT_HOA_DON', timestamps: false });

module.exports = CtHoaDon;