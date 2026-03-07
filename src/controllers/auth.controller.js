const { NhanVien, KhachHang } = require('../models/index');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');

const register = async (req, res) => {
    try {
        const { fullName, email, password, phone, address, ngaySinh, gioiTinh } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập đầy đủ họ tên, email và mật khẩu" });
        }

        // Check if user exists
        const existingUser = await KhachHang.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Email đã tồn tại" });
        }

        // Sequential maKh generation
        const lastUser = await KhachHang.findOne({ order: [['maKh', 'DESC']] });
        let maKh = 'KH001';
        if (lastUser && lastUser.maKh.startsWith('KH')) {
            const lastNum = parseInt(lastUser.maKh.substring(2));
            if (!isNaN(lastNum)) {
                maKh = `KH${(lastNum + 1).toString().padStart(3, '0')}`;
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = await KhachHang.create({
            maKh,
            hoTen: fullName,
            sdt: phone || null,
            email,
            diaChi: address || null,
            ngaySinh: ngaySinh || null,
            gioiTinh: gioiTinh || 'Khác',
            matKhau: hashedPassword,
            trangThai: true
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
            // Kiểm tra mật khẩu bằng bcrypt
            if (!customer.matKhau) {
                return res.status(400).json({ success: false, message: "Tài khoản chưa có mật khẩu. Vui lòng liên hệ Admin." });
            }

            const isMatch = await bcrypt.compare(password, customer.matKhau);
            if (!isMatch) {
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
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ success: false, message: "Không tìm thấy thông tin người dùng" });
        }

        if (user.role === 'employee') {
            return res.status(200).json({
                success: true,
                user: {
                    id: user.maNv,
                    fullName: user.hoTen,
                    email: user.email,
                    role: 'employee'
                }
            });
        } else {
            return res.status(200).json({
                success: true,
                user: {
                    id: user.maKh,
                    fullName: user.hoTen,
                    email: user.email,
                    phone: user.sdt,
                    address: user.diaChi,
                    role: 'customer'
                }
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword,
    getMe
};
