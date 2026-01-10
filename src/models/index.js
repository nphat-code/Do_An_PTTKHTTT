const sequelize = require('../config/database');
const Product = require('./product.model');
const User = require('./user.model');
const Order = require('./order.model');
const OrderItem = require('./orderItem.model');

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

module.exports = {
    sequelize,
    Product,
    User,
    Order,
    OrderItem
};