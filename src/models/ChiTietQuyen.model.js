const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChiTietQuyen = sequelize.define('ChiTietQuyen', {
    maCv: {
        type: DataTypes.STRING(20),
        primaryKey: true,
        references: {
            model: 'CHUC_VU',
            key: 'maCv'
        }
    },
    maQuyen: {
        type: DataTypes.STRING(30),
        primaryKey: true,
        references: {
            model: 'QUYEN',
            key: 'maQuyen'
        }
    }
}, {
    tableName: 'CHI_TIET_QUYEN',
    timestamps: false
});

module.exports = ChiTietQuyen;
