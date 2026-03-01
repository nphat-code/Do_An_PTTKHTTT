const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const productController = require('../controllers/product.controller');

// Cấu hình multer để upload ảnh sản phẩm
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../public/uploads/products'));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ hỗ trợ file ảnh: jpg, jpeg, png, webp, gif'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// GET /api/products - Lấy danh sách sản phẩm
router.get('/', productController.getAllProducts);

// GET /api/products/brands - Lấy danh sách hãng sản xuất
router.get('/brands', productController.getBrands);

// GET /api/products/categories - Lấy danh sách loại máy
router.get('/categories', productController.getCategories);

// GET /api/products/:id - Lấy chi tiết sản phẩm
router.get('/:id', productController.getProductById);

// POST /api/products - Thêm sản phẩm mới (có upload ảnh)
router.post('/', upload.single('hinhAnh'), productController.createProduct);

// PUT /api/products/:id - Cập nhật sản phẩm (có upload ảnh)
router.put('/:id', upload.single('hinhAnh'), productController.updateProduct);

// DELETE /api/products/:id - Xóa sản phẩm
router.delete('/:id', productController.deleteProduct);

module.exports = router;