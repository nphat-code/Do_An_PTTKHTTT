const {
    sequelize,
    HoaDon,
    CtHoaDon,
    ChiTietMay
} = require('./models/index');

async function resetOrders() {
    const transaction = await sequelize.transaction();
    try {
        console.log('--- Đang reset dữ liệu hóa đơn ---');

        // 1. Xóa chi tiết hóa đơn
        await CtHoaDon.destroy({ where: {}, transaction });
        console.log('✓ Đã xóa chi tiết hóa đơn');

        // 2. Cập nhật trạng thái máy tính (số serial) quay lại kho
        await ChiTietMay.update(
            { maHd: null, trangThai: 'Trong kho' },
            { where: {}, transaction }
        );
        console.log('✓ Đã cập nhật trạng thái máy về "Trong kho"');

        // 3. Xóa hóa đơn
        await HoaDon.destroy({ where: {}, transaction });
        console.log('✓ Đã xóa tất cả hóa đơn');

        await transaction.commit();
        console.log('--- Hoàn tất reset hóa đơn ---');
    } catch (error) {
        await transaction.rollback();
        console.error('Lỗi khi reset hóa đơn:', error);
    } finally {
        process.exit();
    }
}

resetOrders();
