const express = require('express');
const router = express.Router();
const sparePartController = require('../controllers/sparepart.controller');

router.get('/', sparePartController.getAllParts);
router.get('/:id', sparePartController.getPartById);
router.post('/', sparePartController.createPart);
router.put('/:id', sparePartController.updatePart);
router.delete('/:id', sparePartController.deletePart);

module.exports = router;
