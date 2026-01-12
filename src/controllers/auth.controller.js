const { User } = require('../models/index');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try {
        const { fullName, email, password, phone, address } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Email đã tồn tại" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const newUser = await User.create({
            fullName,
            email,
            password: hashedPassword,
            phone,
            address,
            role: 'customer' // Default role
        });

        res.status(201).json({ success: true, message: "Đăng ký thành công!" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ success: false, message: "Email hoặc mật khẩu không đúng" });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Email hoặc mật khẩu không đúng" });
        }

        // Generate Token
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'secretkey123', // Use env in production
            { expiresIn: '1d' }
        );

        res.status(200).json({
            success: true,
            message: "Đăng nhập thành công",
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                address: user.address,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    register,
    login
};
