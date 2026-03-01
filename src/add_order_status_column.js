/**
 * Script thêm cột trangThai vào bảng HOA_DON (chạy 1 lần khi nâng cấp).
 * - Xóa cột TRANG_THAI cũ (nếu có) do đặt sai tên.
 * - Thêm cột trangThai (camelCase) cho Sequelize.
 * Chạy: node src/add_order_status_column.js
 */
require('dotenv').config();
const { sequelize } = require('./models/index');

async function addColumn() {
    try {
        await sequelize.authenticate();

        // Xóa cột TRANG_THAI cũ (nếu từng chạy script cũ)
        await sequelize.query(`
            ALTER TABLE "HOA_DON" DROP COLUMN IF EXISTS "TRANG_THAI";
        `);
        console.log('✅ Đã xóa cột TRANG_THAI cũ (nếu có).');

        await sequelize.query(`
            ALTER TABLE "HOA_DON"
            ADD COLUMN IF NOT EXISTS "trangThai" VARCHAR(50) DEFAULT 'Chờ xử lý';
        `);
        console.log('✅ Đã thêm cột trangThai vào bảng HOA_DON (hoặc cột đã tồn tại).');
        await sequelize.query(`
            UPDATE "HOA_DON" SET "trangThai" = 'Chờ xử lý' WHERE "trangThai" IS NULL;
        `);
        console.log('✅ Đã cập nhật giá trị mặc định cho các dòng cũ.');
    } catch (err) {
        console.error('❌ Lỗi:', err.message);
    } finally {
        process.exit();
    }
}

addColumn();
