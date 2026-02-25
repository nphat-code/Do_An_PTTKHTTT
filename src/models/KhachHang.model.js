const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const KhachHang = sequelize.define('KhachHang', {
    maKh: { type: DataTypes.STRING(20), primaryKey: true },
    hoTen: { type: DataTypes.STRING, allowNull: false },
    ngaySinh: { type: DataTypes.DATEONLY },
    gioiTinh: { type: DataTypes.ENUM('Nam', 'Nữ', 'Khác') },
    sdt: { type: DataTypes.STRING(15) },
    email: { type: DataTypes.STRING },
    diaChi: { type: DataTypes.TEXT }
}, { tableName: 'KHACH_HANG', timestamps: false });

module.exports = KhachHang;