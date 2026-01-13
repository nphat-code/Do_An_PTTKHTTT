const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ImportReceipt = sequelize.define('ImportReceipt', {
    totalBox: { type: DataTypes.INTEGER, defaultValue: 0 },
    totalAmount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    note: { type: DataTypes.TEXT }
}, {
    tableName: 'import_receipts'
});

module.exports = ImportReceipt;
