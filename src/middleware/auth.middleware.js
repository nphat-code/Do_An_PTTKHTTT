const jwt = require('jsonwebtoken');
const { NhanVien, KhachHang, Quyen, ChiTietQuyen } = require('../models');

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

const authorize = (permissionCode) => {
    return async (req, res, next) => {
        // Only employees (NhanVien) have granular permissions in this system
        if (!req.user || req.user.role !== 'employee') {
            return res.status(403).json({ success: false, message: "Truy cập bị từ chối" });
        }

        try {
            // Check if the role (maCv) has the required maQuyen
            const hasPermission = await ChiTietQuyen.findOne({
                where: {
                    maCv: req.user.maCv,
                    maQuyen: permissionCode
                }
            });

            if (hasPermission) {
                return next();
            }

            return res.status(403).json({
                success: false,
                message: `Bạn không có quyền: ${permissionCode}`
            });
        } catch (error) {
            console.error('Authorization Error:', error);
            return res.status(500).json({ success: false, message: "Lỗi kiểm tra quyền hạn" });
        }
    };
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'employee') {
        next();
    } else {
        return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập Admin" });
    }
};

module.exports = {
    verifyToken,
    isAdmin,
    authorize
};
