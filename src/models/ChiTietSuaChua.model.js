const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChiTietSuaChua = sequelize.define('ChiTietSuaChua', {
    soLuong: { type: DataTypes.INTEGER },
    donGia: { type: DataTypes.DECIMAL(15, 2) }
    // maPbh, maLk, maKhoXuat FK
}, { tableName: 'CHI_TIET_SUA_CHUA', timestamps: false });

module.exports = ChiTietSuaChua;