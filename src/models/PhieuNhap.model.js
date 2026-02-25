const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PhieuNhap = sequelize.define('PhieuNhap', {
    maPn: { type: DataTypes.STRING(20), primaryKey: true },
    ngayNhap: { type: DataTypes.DATE },
    tongTien: { type: DataTypes.DECIMAL(15, 2) }
    // maNcc, maNv, maHttt FK
}, { tableName: 'PHIEU_NHAP', timestamps: false });

module.exports = PhieuNhap;