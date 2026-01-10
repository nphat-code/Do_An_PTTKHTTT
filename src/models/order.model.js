const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('order', {
    totalAmount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'pending' }, // pending, shipping, completed, cancelled
    orderDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

// Bạn cần thiết lập quan hệ trong app.js hoặc một file index models riêng:
// Order.belongsTo(User);
// Order.belongsToMany(Product, { through: 'OrderItems' });
module.exports = Order;