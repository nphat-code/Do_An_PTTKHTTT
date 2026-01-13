const sequelize = require('../config/database');
const Product = require('./product.model');
const User = require('./user.model');
const Order = require('./order.model');
const OrderItem = require('./orderItem.model');

const ImportReceipt = require('./importReceipt.model');
const ImportReceiptItem = require('./importReceiptItem.model');

// 1. Quan hệ User - Order (1 - N)
User.hasMany(Order);
Order.belongsTo(User);

// 2. Quan hệ Order - Product (N - N) thông qua OrderItem
Order.belongsToMany(Product, { through: OrderItem });
Product.belongsToMany(Order, { through: OrderItem });

// (Tùy chọn) Để truy vấn dễ hơn từ bảng trung gian
Order.hasMany(OrderItem);
OrderItem.belongsTo(Order);
Product.hasMany(OrderItem);
OrderItem.belongsTo(Product);

// 3. Quan hệ ImportReceipt - Product (N - N) thông qua ImportReceiptItem
ImportReceipt.belongsToMany(Product, { through: ImportReceiptItem, foreignKey: 'importReceiptId' });
Product.belongsToMany(ImportReceipt, { through: ImportReceiptItem, foreignKey: 'productId' });

ImportReceipt.hasMany(ImportReceiptItem, { foreignKey: 'importReceiptId' });
ImportReceiptItem.belongsTo(ImportReceipt, { foreignKey: 'importReceiptId' });

Product.hasMany(ImportReceiptItem, { foreignKey: 'productId' });
ImportReceiptItem.belongsTo(Product, { foreignKey: 'productId' });

module.exports = {
    sequelize,
    Product,
    User,
    Order,
    OrderItem,
    ImportReceipt,
    ImportReceiptItem
};