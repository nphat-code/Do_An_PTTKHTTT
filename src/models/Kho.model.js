const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Kho = sequelize.define('Kho', {
    maKho: { type: DataTypes.STRING(20), primaryKey: true },
    tenKho: { type: DataTypes.STRING, allowNull: false },
    diaChi: { type: DataTypes.TEXT }
    // maCn FK
}, { tableName: 'KHO', timestamps: false });

module.exports = Kho;