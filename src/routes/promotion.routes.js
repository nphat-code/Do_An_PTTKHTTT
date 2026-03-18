const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotion.controller');

router.get('/', promotionController.getAllPromotions);
router.get('/:id', promotionController.getPromotionById);
router.post('/', promotionController.createPromotion);
router.put('/:id', promotionController.updatePromotion);
router.delete('/:id', promotionController.deletePromotion);
router.post('/:maKm/products', promotionController.linkProducts);
router.delete('/:maKm/products/:modelId', promotionController.unlinkProduct);

module.exports = router;
