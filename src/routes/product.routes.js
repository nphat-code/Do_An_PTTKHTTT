const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');

// GET /api/products - Lấy danh sách sản phẩm (DongMay + CauHinh + HangSanXuat + LoaiMay)
router.get('/', productController.getAllProducts);

// GET /api/products/brands - Lấy danh sách hãng sản xuất
router.get('/brands', productController.getBrands);

// GET /api/products/categories - Lấy danh sách loại máy
router.get('/categories', productController.getCategories);

// GET /api/products/:id - Lấy chi tiết sản phẩm
router.get('/:id', productController.getProductById);

// POST /api/products - Thêm sản phẩm mới
router.post('/', productController.createProduct);

// PUT /api/products/:id - Cập nhật sản phẩm
router.put('/:id', productController.updateProduct);

// DELETE /api/products/:id - Xóa sản phẩm
router.delete('/:id', productController.deleteProduct);

module.exports = router;