const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderItem = sequelize.define('order_item', {
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    price: { type: DataTypes.DECIMAL(15, 2), allowNull: false } // Lưu giá lúc mua để tránh sau này sp đổi giá làm sai báo cáo
});

module.exports = OrderItem;