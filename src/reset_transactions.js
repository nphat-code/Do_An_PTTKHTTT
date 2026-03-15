const {
    sequelize,
    PhieuBaoHanh,
    ChiTietSuaChua,
    HoaDon,
    CtHoaDon,
    PhieuNhap,
    CtNhapMay,
    CtNhapLk,
    DongMay,
    ChiTietMay,
    LinhKien,
    KhoLinhKien,
    PhieuKiemKe,
    CtKiemKeMay,
    CtKiemKeLk
} = require('./models');

async function resetTransactions() {
    const t = await sequelize.transaction();
    try {
        console.log('--- BẮT ĐẦU RESET DỮ LIỆU GIAO DỊCH ---');

        // 1. Xóa chi tiết sửa chữa và phiếu bảo hành
        console.log('1. Xóa dữ liệu Bảo hành & Sửa chữa...');
        await ChiTietSuaChua.destroy({ where: {}, transaction: t });
        await PhieuBaoHanh.destroy({ where: {}, transaction: t });

        // 2. Xóa dữ liệu kiểm kê
        console.log('2. Xóa dữ liệu Kiểm kê...');
        await CtKiemKeMay.destroy({ where: {}, transaction: t });
        await CtKiemKeLk.destroy({ where: {}, transaction: t });
        await PhieuKiemKe.destroy({ where: {}, transaction: t });

        // 3. Xóa dữ liệu Hóa đơn (Bán hàng)
        console.log('3. Xóa dữ liệu Hóa đơn...');
        // Cần reset maHd trong ChiTietMay trước nếu có ràng buộc (thường thì delete CASCADE hoặc set null)
        // Ở đây ta sẽ xóa máy sau, nên xóa chi tiết hóa đơn trước
        await CtHoaDon.destroy({ where: {}, transaction: t });

        // 4. Xóa dữ liệu Nhập hàng
        console.log('4. Xóa dữ liệu Nhập hàng...');
        await CtNhapMay.destroy({ where: {}, transaction: t });
        await CtNhapLk.destroy({ where: {}, transaction: t });

        // Cập nhật null cho maHd trong ChiTietMay để có thể xóa HoaDon
        await ChiTietMay.update({ maHd: null }, { where: {}, transaction: t });
        await HoaDon.destroy({ where: {}, transaction: t });
        await PhieuNhap.destroy({ where: {}, transaction: t });

        // 5. Xóa chi tiết máy (Vì máy được tạo ra từ phiếu nhập)
        console.log('5. Xóa danh sách Máy tính (Số Serial)...');
        await ChiTietMay.destroy({ where: {}, transaction: t });

        // 6. Reset tồn kho linh kiện và máy tính về 0
        console.log('6. Reset tồn kho (Laptop & Linh kiện) về 0...');
        await DongMay.update({ soLuongTon: 0 }, { where: {}, transaction: t });
        await LinhKien.update({ soLuongTon: 0 }, { where: {}, transaction: t });
        await KhoLinhKien.update({ soLuongTon: 0 }, { where: {}, transaction: t });

        await t.commit();
        console.log('--- RESET THÀNH CÔNG! ---');
        process.exit(0);
    } catch (error) {
        await t.rollback();
        console.error('--- LỖI KHI RESET: ---', error);
        process.exit(1);
    }
}

resetTransactions();
