const { NhanVien, KhachHang } = require('../models/index');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');

const register = async (req, res) => {
    try {
        const { fullName, email, phone, address } = req.body;

        if (!fullName || !email) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập đầy đủ họ tên và email" });
        }

        // Check if user exists
        const existingUser = await KhachHang.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Email đã tồn tại" });
        }

        // Auto generate maKh
        const maKh = 'KH_' + Date.now();

        // Create user
        const newUser = await KhachHang.create({
            maKh,
            hoTen: fullName,
            sdt: phone || null,
            email,
            diaChi: address || null
        });

        res.status(201).json({ success: true, message: "Đăng ký thành công!" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // First, check if it's an employee (NhanVien)
        const employee = await NhanVien.findOne({ where: { email } });
        if (employee) {
            if (!employee.trangThai) {
                return res.status(403).json({ success: false, message: "Tài khoản nhân viên đã ngừng hoạt động." });
            }

            // Check password
            const isMatch = await bcrypt.compare(password, employee.matKhau);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: "Email hoặc mật khẩu không đúng" });
            }

            // Generate Token for Employee
            const token = jwt.sign(
                { id: employee.maNv, role: 'employee' },
                process.env.JWT_SECRET || 'secretkey123',
                { expiresIn: '1d' }
            );

            return res.status(200).json({
                success: true,
                message: "Đăng nhập nhân viên thành công",
                token,
                user: {
                    id: employee.maNv,
                    fullName: employee.hoTen,
                    email: employee.email,
                    role: 'employee'
                }
            });
        }

        // If not employee, check if it's a customer
        const customer = await KhachHang.findOne({ where: { email } });
        if (customer) {
            // KhachHang không có trường mật khẩu, dùng SĐT làm mật khẩu đăng nhập
            if (password !== customer.sdt) {
                return res.status(400).json({ success: false, message: "Email hoặc mật khẩu không đúng" });
            }

            const token = jwt.sign(
                { id: customer.maKh, role: 'customer' },
                process.env.JWT_SECRET || 'secretkey123',
                { expiresIn: '1d' }
            );

            return res.status(200).json({
                success: true,
                message: "Đăng nhập thành công",
                token,
                user: {
                    id: customer.maKh,
                    fullName: customer.hoTen,
                    email: customer.email,
                    phone: customer.sdt,
                    address: customer.diaChi,
                    role: 'customer'
                }
            });
        }

        return res.status(400).json({ success: false, message: "Email hoặc mật khẩu không đúng" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const forgotPassword = async (req, res) => {
    res.status(501).json({ success: false, message: "Tính năng quên mật khẩu đang được cấu hình lại cho Database mới" });
};

const resetPassword = async (req, res) => {
    res.status(501).json({ success: false, message: "Tính năng này đang được bảo trì" });
};

const getMe = async (req, res) => {
    res.status(501).json({ success: false, message: "Tính năng lấy thông tin cá nhân đang được bảo trì" });
};

module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword,
    getMe
};
