const { User, Order, Product } = require('../models/index');

// 1. Lấy danh sách toàn bộ khách hàng (Dành cho Admin)
const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Xem chi tiết một khách hàng và lịch sử mua hàng
const getUserDetails = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            include: [
                {
                    model: Order,
                    include: [
                        {
                            model: Product,
                            through: { attributes: ['quantity', 'price'] }
                        }
                    ]
                }
            ]
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "Không tìm thấy khách hàng" });
        }

        return res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Cập nhật thông tin khách hàng (Sửa địa chỉ, email...)
const updateUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "Không tìm thấy khách hàng" });
        }

        await user.update(req.body);
        return res.status(200).json({
            success: true,
            message: "Cập nhật thông tin khách hàng thành công",
            data: user
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

// 4. Tìm kiếm khách hàng theo số điện thoại hoặc tên
const searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        const { Op } = require('sequelize');
        
        const users = await User.findAll({
            where: {
                [Op.or]: [
                    { fullName: { [Op.iLike]: `%${query}%` } },
                    { phone: { [Op.iLike]: `%${query}%` } }
                ]
            }
        });

        return res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllUsers,
    getUserDetails,
    updateUser,
    searchUsers
};