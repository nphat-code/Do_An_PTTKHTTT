const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Quyen = sequelize.define('Quyen', {
    maQuyen: {
        type: DataTypes.STRING(30),
        primaryKey: true
    },
    tenQuyen: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    moTa: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'QUYEN',
    timestamps: false
});

module.exports = Quyen;
