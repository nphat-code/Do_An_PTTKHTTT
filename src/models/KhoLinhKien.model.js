const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const KhoLinhKien = sequelize.define('KhoLinhKien', {
    maLk: {
        type: DataTypes.STRING(20),
        primaryKey: true,
        references: { model: 'LINH_KIEN', key: 'maLk' }
    },
    maKho: {
        type: DataTypes.STRING(20),
        primaryKey: true,
        references: { model: 'KHO', key: 'maKho' }
    },
    soLuongTon: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { tableName: 'KHO_LINH_KIEN', timestamps: false });

module.exports = KhoLinhKien;
