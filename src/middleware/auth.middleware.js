const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey123');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ success: false, message: "Token không hợp lệ" });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập Admin" });
    }
};

module.exports = {
    verifyToken,
    isAdmin
};
