const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CauHinh = sequelize.define('CauHinh', {
    maCh: { type: DataTypes.STRING(50), primaryKey: true },
    cpu: { type: DataTypes.STRING },
    ram: { type: DataTypes.STRING },
    oCung: { type: DataTypes.STRING },
    vga: { type: DataTypes.STRING },
    manHinh: { type: DataTypes.STRING },
    pin: { type: DataTypes.STRING },
    trongLuong: { type: DataTypes.FLOAT }
}, { tableName: 'CAU_HINH', timestamps: false });

module.exports = CauHinh;