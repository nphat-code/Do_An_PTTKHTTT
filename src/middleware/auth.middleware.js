const jwt = require('jsonwebtoken');
const { NhanVien, KhachHang } = require('../models');

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey123');

        let user = null;
        if (decoded.role === 'employee') {
            user = await NhanVien.findByPk(decoded.id);
            if (user && !user.trangThai) {
                return res.status(403).json({ success: false, message: "Tài khoản của nhân viên đã bị khóa." });
            }
        } else {
            // Assume customer otherwise if we had token logic for them
            user = await KhachHang.findByPk(decoded.id);
        }

        if (!user) {
            return res.status(401).json({ success: false, message: "Người dùng không tồn tại" });
        }

        req.user = user; // Attach full user object
        req.user.role = decoded.role; // make sure role is attached
        next();
    } catch (error) {
        return res.status(403).json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn" });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'employee') {
        // Technically all 'employee' (NhanVien) could access admin or we check MA_CV
        // For now, any employee can access admin routes
        next();
    } else {
        return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập Admin" });
    }
};

module.exports = {
    verifyToken,
    isAdmin
};
