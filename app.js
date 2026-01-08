const express = require('express');
const cors = require('cors');
const productRoutes = require('./src/routes/productRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Phục vụ các file tĩnh trong thư mục public (quan trọng!)
app.use(express.static('public'));

// Sử dụng routes
app.use('/api/products', productRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server chạy tại http://localhost:${PORT}`));