const express = require('express');
const router = express.Router();
const importController = require('../controllers/import.controller');

// GET /api/imports - Lấy lịch sử nhập hàng
router.get('/', importController.getImportHistory);

// POST /api/imports - Tạo phiếu nhập hàng mới
router.post('/', importController.createImportReceipt);

// GET /api/imports/:id - Lấy chi tiết phiếu nhập
router.get('/:id', importController.getImportReceiptById);

module.exports = router;
