const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');

// Đường dẫn: /api/orders

// 1. Khách hàng đặt hàng (Checkout)
router.post('/', orderController.createOrder);

// 2. Admin lấy danh sách toàn bộ đơn hàng
router.get('/', orderController.getAllOrders);

// 3. Admin hoặc Khách hàng xem chi tiết một đơn hàng cụ thể
router.get('/:id', orderController.getOrderById);
router.put('/:id/status', orderController.updateOrderStatus);
module.exports = router;