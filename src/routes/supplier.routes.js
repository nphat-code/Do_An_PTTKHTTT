const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplier.controller');

router.get('/next-id', supplierController.getNextMaNcc);
router.get('/', supplierController.getAllSuppliers);
router.post('/', supplierController.createSupplier);
router.put('/:id', supplierController.updateSupplier);
router.delete('/:id', supplierController.deleteSupplier);

module.exports = router;
