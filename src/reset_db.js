const { sequelize, User, Order, OrderItem, Product } = require('./models/index');
const { Op } = require('sequelize');

const resetData = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB...');

        // 1. Xóa toàn bộ chi tiết đơn hàng và đơn hàng
        console.log('Đang xóa dữ liệu đơn hàng...');
        await OrderItem.destroy({ where: {}, truncate: true, cascade: true }); // Truncate might fail with foreign keys if not careful, force: true or cascade?
        // Sequelize truncate usually handles it if configured, but destroy with where {} is safer for associations
        await OrderItem.destroy({ where: {} });
        await Order.destroy({ where: {} });

        // 2. Xóa tài khoản khách hàng (giữ lại Admin)
        console.log('Đang xóa tài khoản khách hàng...');
        await User.destroy({
            where: {
                role: { [Op.ne]: 'admin' }
            }
        });

        // 3. Reset tồn kho sản phẩm
        console.log('Đang reset tồn kho sản phẩm...');
        await Product.update(
            { stock: 50 }, // Set default stock to 50
            { where: {} }
        );

        console.log('-------------------------------------------');
        console.log('✅ Đã reset dữ liệu thành công!');
        console.log('- Đã xóa tất cả đơn hàng.');
        console.log('- Đã xóa tất cả khách hàng (trừ Admin).');
        console.log('- Đã đặt lại tồn kho tất cả sản phẩm về 50.');
        console.log('-------------------------------------------');

        process.exit();
    } catch (error) {
        console.error('Lỗi khi reset dữ liệu:', error);
        process.exit(1);
    }
};

resetData();
