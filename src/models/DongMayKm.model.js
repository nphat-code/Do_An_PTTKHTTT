const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DongMayKm = sequelize.define('DongMayKm', {
    maKm: { type: DataTypes.STRING(20), primaryKey: true, references: { model: 'CHUONG_TRINH_KM', key: 'maKm' } },
    maModel: { type: DataTypes.STRING(50), primaryKey: true, references: { model: 'DONG_MAY', key: 'maModel' } },
    ngayThem: { type: DataTypes.DATE }
}, { tableName: 'DONG_MAY_KM', timestamps: false });

module.exports = DongMayKm;