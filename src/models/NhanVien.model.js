const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NhanVien = sequelize.define('NhanVien', {
    maNv: { type: DataTypes.STRING(20), primaryKey: true },
    hoTen: { type: DataTypes.STRING, allowNull: false },
    ngaySinh: { type: DataTypes.DATEONLY },
    gioiTinh: { type: DataTypes.ENUM('Nam', 'Nữ', 'Khác') },
    sdt: { type: DataTypes.STRING(15) },
    email: { type: DataTypes.STRING },
    diaChi: { type: DataTypes.TEXT },
    trangThai: { type: DataTypes.BOOLEAN, defaultValue: true },
    matKhau: { type: DataTypes.STRING },
    maCv: { type: DataTypes.STRING(20) }
}, { tableName: 'NHAN_VIEN', timestamps: false });

module.exports = NhanVien;