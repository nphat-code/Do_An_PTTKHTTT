const {
    sequelize,
    PhieuNhap,
    CtNhapMay,
    CtNhapLk,
    ChiTietMay,
    DongMay,
    KhoLinhKien
} = require('./models/index');

async function resetImports() {
    const transaction = await sequelize.transaction();
    try {
        console.log('--- Đang reset dữ liệu nhập hàng ---');

        // 1. Xóa chi tiết nhập
        await CtNhapMay.destroy({ where: {}, transaction });
        await CtNhapLk.destroy({ where: {}, transaction });
        console.log('✓ Đã xóa chi tiết nhập hàng');

        // 2. Xóa phiếu nhập
        await PhieuNhap.destroy({ where: {}, transaction });
        console.log('✓ Đã xóa phiếu nhập');

        // 3. Xóa tất cả ChiTietMay (vì máy được tạo từ phiếu nhập)
        // Lưu ý: Nếu có máy đang trong hóa đơn hoặc bảo hành, có thể bị lỗi FK. 
        // Tuy nhiên thường reset nhập là muốn xóa sạch inventory.
        await ChiTietMay.destroy({ where: {}, transaction });
        console.log('✓ Đã xóa tất cả máy tính (số serial)');

        // 4. Reset số lượng tồn máy tính về 0
        await DongMay.update({ soLuongTon: 0 }, { where: {}, transaction });
        console.log('✓ Đã reset số lượng tồn dòng máy về 0');

        // 5. Reset số lượng tồn linh kiện về 0
        await KhoLinhKien.update({ soLuongTon: 0 }, { where: {}, transaction });
        console.log('✓ Đã reset số lượng tồn linh kiện trong kho về 0');

        await transaction.commit();
        console.log('--- Hoàn tất reset nhập hàng ---');
    } catch (error) {
        await transaction.rollback();
        console.error('Lỗi khi reset nhập hàng:', error);
    } finally {
        process.exit();
    }
}

resetImports();
