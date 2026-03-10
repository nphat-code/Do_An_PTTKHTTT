const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LinhKienTuongThich = sequelize.define('LinhKienTuongThich', {
    maModel: {
        type: DataTypes.STRING(50),
        primaryKey: true,
        references: {
            model: 'DONG_MAY',
            key: 'maModel'
        }
    },
    maLk: {
        type: DataTypes.STRING(20),
        primaryKey: true,
        references: {
            model: 'LINH_KIEN',
            key: 'maLk'
        }
    },
    ghiChu: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'LINH_KIEN_TUONG_THICH',
    timestamps: false
});

module.exports = LinhKienTuongThich;
