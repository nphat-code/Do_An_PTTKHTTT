const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('user', {
    fullName: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, defaultValue: 'customer' }, // 'admin' | 'customer'
    phone: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.TEXT }
});

module.exports = User;