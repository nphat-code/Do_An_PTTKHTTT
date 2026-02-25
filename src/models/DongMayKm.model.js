const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DongMayKm = sequelize.define('DongMayKm', {
    ngayThem: { type: DataTypes.DATE }
    // maKm, maModel FK as composite PK
}, { tableName: 'DONG_MAY_KM', timestamps: false });

module.exports = DongMayKm;