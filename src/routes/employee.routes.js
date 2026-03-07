const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');

// GET /api/employees/next-id - Lấy mã nhân viên tiếp theo
router.get('/next-id', employeeController.getNextMaNv);

// GET /api/employees - Danh sách nhân viên
router.get('/', employeeController.getAllEmployees);

// POST /api/employees - Tạo nhân viên mới
router.post('/', employeeController.createEmployee);

// PUT /api/employees/:id/toggle - Khóa/mở khóa
router.put('/:id/toggle', employeeController.toggleEmployeeStatus);

// PUT /api/employees/:id - Cập nhật thông tin cơ bản
router.put('/:id', employeeController.updateEmployee);

// PUT /api/employees/:id/reset-password - Đặt lại mật khẩu
router.put('/:id/reset-password', employeeController.resetEmployeePassword);

module.exports = router;
