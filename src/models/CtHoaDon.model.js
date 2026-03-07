const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CtHoaDon = sequelize.define('CtHoaDon', {
    maHd: { type: DataTypes.STRING(20), primaryKey: true, references: { model: 'HOA_DON', key: 'maHd' } },
    maModel: { type: DataTypes.STRING(50), primaryKey: true, references: { model: 'DONG_MAY', key: 'maModel' } },
    soLuong: { type: DataTypes.INTEGER },
    donGia: { type: DataTypes.DECIMAL(15, 2) },
    thanhTien: { type: DataTypes.DECIMAL(15, 2) }
}, { tableName: 'CT_HOA_DON', timestamps: false });

module.exports = CtHoaDon;