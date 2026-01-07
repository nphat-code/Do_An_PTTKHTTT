const fs = require('fs');
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: 'public/uploads/', // Ảnh sẽ lưu vào thư mục này
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Đặt tên file theo thời gian để tránh trùng
    }
});

const upload = multer({ storage: storage });
router.get('/', async (req, res) => {
    const { search } = req.query;
    try {
        let result;
        if (search) {
            // Sử dụng ILIKE để tìm kiếm không phân biệt hoa thường trong Postgres
            const sql = "SELECT * FROM products WHERE name ILIKE $1 ORDER BY id DESC";
            result = await pool.query(sql, [`%${search}%`]);
        } else {
            result = await pool.query("SELECT * FROM products ORDER BY id DESC");
        }
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', upload.single('image'), async (req, res) => {
    const { name, cpu, ram, price, stock } = req.body;
    const imagePath = req.file ? `uploads/${req.file.filename}` : null;
    try {
        const sql = "INSERT INTO products (name, cpu, ram, price, stock, image) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *";
        const result = await pool.query(sql, [name, cpu, ram, price, stock, imagePath]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).send("Lỗi Database");
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const productResult = await pool.query("SELECT image FROM products WHERE id = $1", [id]);
        const imagePath = productResult.rows[0]?.image;
        await pool.query("DELETE FROM products WHERE id = $1", [id]);
        if (imagePath) {
            const fullPath = path.join(__dirname, '../../public', imagePath);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath); // Xóa file
            }
        }
        res.json({ message: "Đã xóa sản phẩm thành công" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { name, cpu, ram, price, stock } = req.body;
    try {
        let result;
        if (req.file) {
            const oldProduct = await pool.query("SELECT image FROM products WHERE id = $1", [id]);
            const oldImagePath = oldProduct.rows[0]?.image;

            if (oldImagePath) {
                const oldFullPath = path.join(__dirname, '../public', oldImagePath);
                if (fs.existsSync(oldFullPath)) {
                    fs.unlinkSync(oldFullPath);
                }
            }

            const newImagePath = `uploads/${req.file.filename}`;
            const sql = "UPDATE products SET name=$1, cpu=$2, ram=$3, price=$4, stock=$5, image=$6 WHERE id=$7";
            await pool.query(sql, [name, cpu, ram, price, stock, newImagePath, id]);
        } else {
            const sql = "UPDATE products SET name=$1, cpu=$2, ram=$3, price=$4, stock=$5 WHERE id=$6";
            await pool.query(sql, [name, cpu, ram, price, stock, id]);
        }
        res.json({ message: "Cập nhật thành công", product: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;