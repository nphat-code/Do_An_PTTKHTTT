const express = require('express');
const router = express.Router();
const pool = require('../config/db');

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
router.post('/', async (req, res) => {
    const { name, cpu, ram, price, stock } = req.body;
    try {
        const sql = "INSERT INTO products (name, cpu, ram, price, stock) VALUES ($1, $2, $3, $4, $5) RETURNING *";
        const result = await pool.query(sql, [name, cpu, ram, price, stock]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send("Lỗi Database");
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("DELETE FROM products WHERE id = $1", [id]);
        res.json({ message: "Đã xóa sản phẩm thành công" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, cpu, ram, price, stock } = req.body;
    try {
        const sql = "UPDATE products SET name=$1, cpu=$2, ram=$3, price=$4, stock=$5 WHERE id=$6";
        await pool.query(sql, [name, cpu, ram, price, stock, id]);
        res.json({ message: "Cập nhật thành công" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;