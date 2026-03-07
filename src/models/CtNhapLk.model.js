const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CtNhapLk = sequelize.define('CtNhapLk', {
    maPn: { type: DataTypes.STRING(20), primaryKey: true, references: { model: 'PHIEU_NHAP', key: 'maPn' } },
    maLk: { type: DataTypes.STRING(20), primaryKey: true, references: { model: 'LINH_KIEN', key: 'maLk' } },
    soLuong: { type: DataTypes.INTEGER },
    donGia: { type: DataTypes.DECIMAL(15, 2) }
}, { tableName: 'CT_NHAP_LK', timestamps: false });

module.exports = CtNhapLk;