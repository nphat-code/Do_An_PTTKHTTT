const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const productRoutes = require('./routes/product.routes');
const sequelize = require('./config/database');

sequelize.authenticate()
    .then(() => console.log('Kết nối Database thành công!'))
    .catch(err => console.error('Không thể kết nối Database:', err));

app.use('/public', express.static(path.join(__dirname, '../public')));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/products', productRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});