const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ImportReceiptItem = sequelize.define('ImportReceiptItem', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    price: { type: DataTypes.DECIMAL(15, 2), allowNull: false }, // Giá nhập
    importReceiptId: { type: DataTypes.INTEGER, allowNull: false }, // Explicit FK
    productId: { type: DataTypes.INTEGER, allowNull: false }      // Explicit FK
}, {
    tableName: 'import_receipt_items',
    timestamps: false,
    freezeTableName: true
});



module.exports = ImportReceiptItem;
