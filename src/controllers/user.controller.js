const { KhachHang, HoaDon, CtHoaDon, DongMay } = require('../models/index');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// 0. Tạo khách hàng mới (Dành cho Admin)
const createCustomer = async (req, res) => {
    try {
        const { maKh, hoTen, sdt, email, diaChi, matKhau, ngaySinh, gioiTinh } = req.body;

        // Check if ID exists
        const existingId = await KhachHang.findByPk(maKh);
        if (existingId) return res.status(400).json({ success: false, message: "Mã khách hàng đã tồn tại" });

        const hashedPassword = matKhau ? await bcrypt.hash(matKhau, 10) : await bcrypt.hash('123456', 10);

        const customer = await KhachHang.create({
            maKh, hoTen, sdt, email, diaChi, ngaySinh, gioiTinh,
            matKhau: hashedPassword
        });

        return res.status(201).json({ success: true, message: "Thêm khách hàng thành công", data: customer });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

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

// 5. Khóa / Mở khóa tài khoản
const toggleUserLock = async (req, res) => {
    try {
        const user = await KhachHang.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "Không tìm thấy khách hàng" });
        }

        const newStatus = !user.trangThai;
        await user.update({ trangThai: newStatus });

        return res.status(200).json({
            success: true,
            message: `Đã ${newStatus ? 'mở khóa' : 'khóa'} tài khoản khách hàng`,
            data: user
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 6. Xóa khách hàng (Dùng cẩn thận)
const deleteUser = async (req, res) => {
    try {
        const user = await KhachHang.findByPk(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy khách hàng" });

        await user.destroy();
        return res.status(200).json({ success: true, message: "Đã xóa khách hàng khỏi hệ thống" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 7. Lấy mã khách hàng tiếp theo
const getNextMaKh = async (req, res) => {
    try {
        const lastUser = await KhachHang.findOne({
            order: [['maKh', 'DESC']]
        });

        if (!lastUser) {
            return res.status(200).json({ success: true, nextId: 'KH001' });
        }

        const lastId = lastUser.maKh; // e.g., "KH005"
        const numberPart = parseInt(lastId.substring(2));
        const nextId = `KH${(numberPart + 1).toString().padStart(3, '0')}`;

        return res.status(200).json({ success: true, nextId });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createCustomer,
    getAllUsers,
    getUserDetails,
    updateUser,
    searchUsers,
    toggleUserLock,
    deleteUser,
    getNextMaKh
};
