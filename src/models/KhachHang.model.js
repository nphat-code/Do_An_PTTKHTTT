const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const KhachHang = sequelize.define('KhachHang', {
    maKh: { type: DataTypes.STRING(20), primaryKey: true },
    hoTen: { type: DataTypes.STRING, allowNull: false },
    ngaySinh: { type: DataTypes.DATEONLY },
    gioiTinh: { type: DataTypes.ENUM('Nam', 'Nữ', 'Khác') },
    sdt: { type: DataTypes.STRING(15) },
    email: { type: DataTypes.STRING },
    diaChi: { type: DataTypes.TEXT },
    matKhau: { type: DataTypes.STRING },
    trangThai: { type: DataTypes.BOOLEAN, defaultValue: true },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW
    }
}, { tableName: 'KHACH_HANG', timestamps: true });

module.exports = KhachHang;