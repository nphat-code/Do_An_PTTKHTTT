const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Đường dẫn: /api/orders

// 1. Khách hàng đặt hàng (Checkout)
router.post('/', orderController.createOrder);

// 2. Đơn hàng của khách hàng đang đăng nhập
router.get('/my-orders', verifyToken, orderController.getMyOrders);

// 3. Cập nhật hồ sơ khách hàng
router.put('/profile', verifyToken, orderController.updateProfile);

// 4. Admin lấy danh sách toàn bộ đơn hàng
router.get('/', orderController.getAllOrders);

// 5. Thống kê Dashboard (Phải đặt trước /:id)
router.get('/stats', orderController.getDashboardStats);

// 6. Admin hoặc Khách hàng xem chi tiết một đơn hàng cụ thể
router.get('/:id', orderController.getOrderById);
router.put('/:id/status', orderController.updateOrderStatus);
module.exports = router;