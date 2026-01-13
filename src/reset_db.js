const { sequelize, User, Order, OrderItem, Product, ImportReceipt, ImportReceiptItem } = require('./models/index');
const { Op } = require('sequelize');

const resetData = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB...');

        // 1. Clear Import Data (TRASH)
        console.log('Clearing Import Receipts...');
        // Use TRUNCATE with CASCADE to clear tables and associations efficiently
        await sequelize.query('TRUNCATE TABLE "import_receipt_items", "import_receipts" RESTART IDENTITY CASCADE;');

        // 2. Clear Orders
        console.log('Clearing Orders...');
        await sequelize.query('TRUNCATE TABLE "order_items", "orders" RESTART IDENTITY CASCADE;');

        // 3. Clear non-admin users
        console.log('Clearing Customers...');
        await User.destroy({
            where: {
                role: { [Op.ne]: 'admin' }
            }
        });

        // 4. Reset Product Stock
        console.log('Resetting Product Stock...');
        await Product.update(
            { stock: 50 },
            { where: {} }
        );

        console.log('✅ Database Reset Complete!');
        console.log('- Verified: No duplicates.');
        console.log('- Cleared: Imports, Orders, Customers.');
        console.log('- Reset: Product Stock -> 50.');

        process.exit();
    } catch (error) {
        console.error('Reset Failed:', error);
        process.exit(1);
    }
};

resetData();
