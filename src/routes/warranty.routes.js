const express = require('express');
const router = express.Router();
const warrantyController = require('../controllers/warranty.controller');

router.get('/', warrantyController.getAllWarranties);
router.get('/:id', warrantyController.getWarrantyById);
router.post('/', warrantyController.createWarranty);
router.put('/:id', warrantyController.updateWarranty);
router.post('/repair-detail', warrantyController.addRepairDetail);
router.get('/check/:serial', warrantyController.checkWarranty);

module.exports = router;
