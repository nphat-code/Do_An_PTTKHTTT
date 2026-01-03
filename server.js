const express = require('express');
const { Pool } = require('pg'); // Sử dụng Pool để quản lý kết nối hiệu quả
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Cấu hình kết nối PostgreSQL
const pool = new Pool({
    user: 'postgres',           // User mặc định thường là postgres
    host: 'localhost',
    database: 'laptop_store',
    password: 'nguyenphat1311',  // Mật khẩu bạn đặt khi cài PostgreSQL
    port: 5432,                 // Cổng mặc định của PostgreSQL
});

// Kiểm tra kết nối
pool.connect((err) => {
    if (err) {
        console.error('Lỗi kết nối PostgreSQL:', err.stack);
    } else {
        console.log('Đã kết nối PostgreSQL thành công!');
    }
});

// API: Thêm sản phẩm
app.post('/add-laptop', async (req, res) => {
    const { name, cpu, ram, price, stock } = req.body;
    
    // Lưu ý: Dùng $1, $2... thay cho ?
    const sql = "INSERT INTO laptops (name, cpu, ram, price, stock) VALUES ($1, $2, $3, $4, $5) RETURNING *";
    
    try {
        const result = await pool.query(sql, [name, cpu, ram, price, stock]);
        res.json({ 
            message: "Đã lưu vào PostgreSQL!", 
            data: result.rows[0] 
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Lỗi Server" });
    }
});

// API: Lấy danh sách sản phẩm để hiển thị lên bảng
app.get('/laptops', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM laptops ORDER BY id DESC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => console.log("Server đang chạy tại port 3000"));