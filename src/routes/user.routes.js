const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Đường dẫn gốc: /api/users

// 1. Tạo khách hàng mới
router.post('/', userController.createCustomer);

// 2. Lấy mã khách hàng tiếp theo
router.get('/next-id', userController.getNextMaKh);

// 3. Tìm kiếm khách hàng (Phải đặt trước các route có tham số)
router.get('/search', userController.searchUsers);

// 3. Lấy danh sách toàn bộ khách hàng
router.get('/', userController.getAllUsers);

// 4. Xem chi tiết / Cập nhật / Xóa / Khóa
router.get('/:id', userController.getUserDetails);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.put('/:id/lock', userController.toggleUserLock);
router.put('/:id/reset-password', userController.resetUserPassword);
router.post('/change-password', verifyToken, userController.changePassword);

module.exports = router;