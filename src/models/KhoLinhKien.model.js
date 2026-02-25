const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const KhoLinhKien = sequelize.define('KhoLinhKien', {
    soLuongTon: { type: DataTypes.INTEGER, defaultValue: 0 }
    // maLk, maKho FK as composite PK
}, { tableName: 'KHO_LINH_KIEN', timestamps: false });

module.exports = KhoLinhKien;