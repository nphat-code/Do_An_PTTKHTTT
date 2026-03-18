const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { verifyToken, authorize } = require('../middleware/auth.middleware');

router.get('/sales', verifyToken, authorize('REPORT_VIEW'), reportController.getSalesReport);
router.get('/inventory', verifyToken, authorize('REPORT_VIEW'), reportController.getInventoryReport);
router.get('/staff', verifyToken, authorize('REPORT_VIEW'), reportController.getStaffPerformance);

// Advanced Analytics (Module 4.0)
router.get('/financial', verifyToken, authorize('REPORT_VIEW'), reportController.getFinancialReport);
router.get('/inventory-advanced', verifyToken, authorize('REPORT_VIEW'), reportController.getInventoryAdvancedReport);
router.get('/warranty-quality', verifyToken, authorize('REPORT_VIEW'), reportController.getWarrantyQualityReport);
router.get('/performance', verifyToken, authorize('REPORT_VIEW'), reportController.getPerformanceAnalytics);
router.get('/customer-growth', verifyToken, authorize('REPORT_VIEW'), reportController.getCustomerGrowth);

module.exports = router;
