const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const productController = require('../controllers/product.controller');
const { verifyToken, authorize } = require('../middleware/auth.middleware');


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

// GET /api/products/details - Lấy chi tiết số serial theo kho
router.get('/details', productController.getAllProductDetails);

// GET /api/products/brands - Lấy danh sách hãng sản xuất
router.get('/brands', productController.getBrands);

// GET /api/products/categories - Lấy danh sách loại máy
router.get('/categories', productController.getCategories);

// GET /api/products/:id - Lấy chi tiết sản phẩm
router.get('/:id', productController.getProductById);

// GET /api/products/:id/serials - Lấy danh sách serial trong kho
router.get('/:id/serials', productController.getProductSerials);

// POST /api/products - Thêm sản phẩm mới (có upload ảnh)
router.post('/', verifyToken, authorize('PRODUCT_MANAGE'), upload.single('hinhAnh'), productController.createProduct);

// PUT /api/products/:id - Cập nhật sản phẩm (có upload ảnh)
router.put('/:id', verifyToken, authorize('PRODUCT_MANAGE'), upload.single('hinhAnh'), productController.updateProduct);

// DELETE /api/products/:id - Xóa sản phẩm
router.delete('/:id', verifyToken, authorize('PRODUCT_MANAGE'), productController.deleteProduct);

// Compatibility routes
router.get('/:id/compatible-parts', productController.getCompatibleParts);
router.post('/:id/compatible-parts', verifyToken, authorize('PRODUCT_MANAGE'), productController.addCompatiblePart);
router.delete('/:id/compatible-parts/:maLk', verifyToken, authorize('PRODUCT_MANAGE'), productController.removeCompatiblePart);

module.exports = router;