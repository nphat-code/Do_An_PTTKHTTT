const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { verifyToken, authorize } = require('../middleware/auth.middleware');

router.get('/sales', verifyToken, authorize('REPORT_VIEW'), reportController.getSalesReport);
router.get('/inventory', verifyToken, authorize('REPORT_VIEW'), reportController.getInventoryReport);
router.get('/staff', verifyToken, authorize('REPORT_VIEW'), reportController.getStaffPerformance);

module.exports = router;
