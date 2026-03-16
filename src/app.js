const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use('/public', express.static(path.join(__dirname, '../public')));

const { sequelize } = require('./models/index');
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const userRoutes = require('./routes/user.routes');
const authRoutes = require('./routes/auth.routes');
const importRoutes = require('./routes/import.routes');
const employeeRoutes = require('./routes/employee.routes');
const supplierRoutes = require('./routes/supplier.routes');
const brandRoutes = require('./routes/brand.routes');
const warehouseRoutes = require('./routes/warehouse.routes');
const roleRoutes = require('./routes/role.routes');
const warrantyRoutes = require('./routes/warranty.routes');
const sparepartRoutes = require('./routes/sparepart.routes');
const categoryRoutes = require('./routes/category.routes');
const inspectionRoutes = require('./routes/inspection.routes');

app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/imports', importRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/warranties', warrantyRoutes);
app.use('/api/spareparts', sparepartRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/inspections', inspectionRoutes);

sequelize.authenticate()
    .then(() => {
        console.log('Kết nối Database thành công!');
        // Đồng bộ các bảng (bao gồm cả bảng trung gian OrderItems)
        return sequelize.sync({ alter: true });
    })
    .then(() => {
        console.log('Các bảng đã được đồng bộ hóa!');


        const PORT = process.env.PORT || 3001;
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(err => console.error('Lỗi Database:', err));