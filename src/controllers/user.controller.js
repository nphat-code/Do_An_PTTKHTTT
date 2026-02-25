const { KhachHang, HoaDon, CtHoaDon, DongMay } = require('../models/index');
const { Op } = require('sequelize');

// 1. Lấy danh sách toàn bộ khách hàng (Dành cho Admin)
const getAllUsers = async (req, res) => {
    try {
        const users = await KhachHang.findAll();
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
        const user = await KhachHang.findByPk(req.params.id, {
            include: [
                {
                    model: HoaDon,
                    include: [
                        {
                            model: DongMay,
                            through: { attributes: ['soLuong', 'donGia', 'thanhTien'] }
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
        const user = await KhachHang.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "Không tìm thấy khách hàng" });
        }

        const updateData = req.body;

        await user.update(updateData);

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

        const users = await KhachHang.findAll({
            where: {
                [Op.or]: [
                    { hoTen: { [Op.iLike]: `%${query}%` } },
                    { sdt: { [Op.iLike]: `%${query}%` } }
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

// 5. Khóa / Mở khóa tài khoản (Tính năng này có thể cần cập nhật model KhachHang nếu bạn muốn thiết kế)
const toggleUserLock = async (req, res) => {
    try {
        res.status(501).json({ success: false, message: 'Bảng Khách Hàng hiện chưa có cờ trangThai, tính năng bị tạm dừng' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllUsers,
    getUserDetails,
    updateUser,
    searchUsers,
    toggleUserLock
};
