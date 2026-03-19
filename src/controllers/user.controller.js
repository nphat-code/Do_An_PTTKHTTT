const { KhachHang, HoaDon, CtHoaDon, DongMay } = require('../models/index');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { getCustomerRankInfo } = require('../utils/customerRank');

// 0. Tạo khách hàng mới (Dành cho Admin)
const createCustomer = async (req, res) => {
    try {
        const { maKh, hoTen, sdt, email, diaChi, matKhau, ngaySinh, gioiTinh } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: "Email là trường bắt buộc để tạo tài khoản đăng nhập" });
        }

        // Check if ID exists
        const existingId = await KhachHang.findByPk(maKh);
        if (existingId) return res.status(400).json({ success: false, message: "Mã khách hàng đã tồn tại" });

        // Check if Email exists
        const existingEmail = await KhachHang.findOne({ where: { email } });
        if (existingEmail) return res.status(400).json({ success: false, message: "Email đã được sử dụng, vui lòng chọn email khác" });

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
        const users = await KhachHang.findAll({
            include: [{ model: HoaDon, attributes: ['tongTien'] }],
            order: [['maKh', 'ASC']]
        });
        
        const formattedUsers = users.map(user => {
            const data = user.toJSON();
            if (data.trangThai === null) data.trangThai = true;
            
            // Calculate total spending
            const totalSpending = (data.HoaDons || []).reduce((sum, hd) => sum + Number(hd.tongTien || 0), 0);
            data.totalSpending = totalSpending;
            data.rank = getCustomerRankInfo(totalSpending);
            
            delete data.HoaDons; // Clean up response
            return data;
        });

        return res.status(200).json({
            success: true,
            data: formattedUsers
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

        const userData = user.toJSON();
        if (userData.trangThai === null) userData.trangThai = true;

        // Calculate total spending and rank
        const totalSpending = (userData.HoaDons || []).reduce((sum, hd) => sum + Number(hd.tongTien || 0), 0);
        userData.totalSpending = totalSpending;
        userData.rank = getCustomerRankInfo(totalSpending);

        return res.status(200).json({
            success: true,
            data: userData
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
            },
            order: [['maKh', 'ASC']]
        });

        const formattedUsers = users.map(user => {
            const data = user.toJSON();
            if (data.trangThai === null) data.trangThai = true;
            return data;
        });

        return res.status(200).json({
            success: true,
            data: formattedUsers
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

        const currentStatus = user.trangThai === null ? true : user.trangThai;
        const newStatus = !currentStatus;
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

// Cập nhật: Đặt lại mật khẩu khách hàng
const resetUserPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ success: false, message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
        }

        const user = await KhachHang.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "Không tìm thấy khách hàng" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await user.update({ matKhau: hashedPassword });

        return res.status(200).json({ success: true, message: "Đã đặt lại mật khẩu thành công" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 7. Khách hàng tự đổi mật khẩu
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const maKh = req.user.maKh; // Lấy từ verifyToken middleware

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
        }

        const user = await KhachHang.findByPk(maKh);
        if (!user) {
            return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
        }

        // Kiểm tra mật khẩu cũ
        const isMatch = await bcrypt.compare(currentPassword, user.matKhau);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Mật khẩu hiện tại không chính xác" });
        }

        // Mã hóa và cập nhật mật khẩu mới
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await user.update({ matKhau: hashedNewPassword });

        return res.status(200).json({ success: true, message: "Đổi mật khẩu thành công" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 8. Lấy mã khách hàng tiếp theo
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

const getUserByPhone = async (req, res) => {
    try {
        const { phone } = req.params;
        const user = await KhachHang.findOne({
            where: { sdt: phone },
            include: [{ 
                model: HoaDon, 
                attributes: ['tongTien'],
                where: { trangThai: { [Op.ne]: 'Đã hủy' } },
                required: false
            }]
        });

        if (!user) {
            return res.json({ success: false, message: "Không tìm thấy khách hàng" });
        }

        const data = user.toJSON();
        const totalSpending = (data.HoaDons || []).reduce((sum, hd) => sum + Number(hd.tongTien || 0), 0);
        data.totalSpending = totalSpending;
        data.rank = getCustomerRankInfo(totalSpending);

        delete data.HoaDons;
        return res.json({ success: true, data });
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
    resetUserPassword,
    changePassword,
    getNextMaKh,
    getUserByPhone
};
