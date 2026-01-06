const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Cấu hình kết nối PostgreSQL
const pool = new Pool({
    user: 'postgres',          
    host: 'localhost',
    database: 'computer_store', // Tên DB bạn đã tạo
    password: 'nguyenphat1311',  // Thay bằng mật khẩu Postgres của bạn
    port: 5432,
});

// API Lấy danh sách sản phẩm (Dùng cho Preview)
app.get('/api/products', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM products ORDER BY id DESC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API Thêm sản phẩm mới
app.post('/api/products', async (req, res) => {
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

// API Xóa sản phẩm
app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("DELETE FROM products WHERE id = $1", [id]);
        res.json({ message: "Đã xóa sản phẩm thành công" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API Cập nhật sản phẩm
app.put('/api/products/:id', async (req, res) => {
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

app.listen(3000, () => {
    console.log("Server đang chạy tại http://localhost:3000");
});