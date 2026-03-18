const express = require('express');
const router = express.Router();
const warrantyController = require('../controllers/warranty.controller');
const { verifyToken, authorize } = require('../middleware/auth.middleware');


router.get('/', verifyToken, warrantyController.getAllWarranties);
router.get('/:id', verifyToken, warrantyController.getWarrantyById);
router.post('/', verifyToken, authorize('WARRANTY_MANAGE'), warrantyController.createWarranty);
router.put('/:id', verifyToken, authorize('WARRANTY_MANAGE'), warrantyController.updateWarranty);
router.put('/:id/confirm-quote', verifyToken, authorize('WARRANTY_MANAGE'), warrantyController.confirmQuote);
router.put('/:id/verify-qc', verifyToken, authorize('WARRANTY_MANAGE'), warrantyController.verifyQC);
router.post('/repair-detail', verifyToken, authorize('WARRANTY_MANAGE'), warrantyController.addRepairDetail);
router.get('/check/:serial', warrantyController.checkWarranty);

router.delete('/repair-detail/:id', verifyToken, authorize('WARRANTY_MANAGE'), warrantyController.deleteRepairDetail);

module.exports = router;
