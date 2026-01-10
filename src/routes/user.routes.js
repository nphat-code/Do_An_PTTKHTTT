const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

// Đường dẫn gốc: /api/users

// 1. Tìm kiếm khách hàng (Phải đặt trước route /:id)
router.get('/search', userController.searchUsers);

// 2. Lấy danh sách toàn bộ khách hàng
router.get('/', userController.getAllUsers);

// 3. Xem chi tiết một khách hàng (bao gồm lịch sử mua hàng)
router.get('/:id', userController.getUserDetails);

// 4. Cập nhật thông tin khách hàng
router.put('/:id', userController.updateUser);

module.exports = router;