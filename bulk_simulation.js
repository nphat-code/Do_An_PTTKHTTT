const {
    KhachHang,
    HoaDon,
    CtHoaDon,
    ChiTietMay,
    DongMay,
    PhieuNhap,
    CtNhapMay,
    sequelize
} = require('./src/models');
const bcrypt = require('bcryptjs');

async function bulkSimulate() {
    const maKho = 'KHO_Q1';
    const maNvAdmin = 'NV001';
    const maNvManager = 'NV002';
    const maNcc = 'NCC002';

    try {
        const hashedPassword = await bcrypt.hash('123456', 10);

        // 1. Create 5 additional customers
        const customersData = [
            { maKh: 'KH002', hoTen: 'Nguyễn Văn An', ngaySinh: '1990-01-01', gioiTinh: 'Nam', sdt: '0901234567', email: 'vnan@gmail.com' },
            { maKh: 'KH003', hoTen: 'Lê Thị Bình', ngaySinh: '1992-02-15', gioiTinh: 'Nữ', sdt: '0902345678', email: 'ltbinh@gmail.com' },
            { maKh: 'KH004', hoTen: 'Phạm Văn Cường', ngaySinh: '1988-03-20', gioiTinh: 'Nam', sdt: '0903456789', email: 'pvcuong@gmail.com' },
            { maKh: 'KH005', hoTen: 'Hoàng Thị Dung', ngaySinh: '1994-04-25', gioiTinh: 'Nữ', sdt: '0904567890', email: 'htdung@gmail.com' },
            { maKh: 'KH006', hoTen: 'Đỗ Văn Em', ngaySinh: '1996-05-30', gioiTinh: 'Nam', sdt: '0905678901', email: 'dvanem@gmail.com' }
        ];

        for (const cust of customersData) {
            await KhachHang.findOrCreate({
                where: { maKh: cust.maKh },
                defaults: { ...cust, matKhau: hashedPassword, diaChi: 'TP. Hồ Chí Minh', trangThai: true }
            });
        }
        console.log('5 new customers ensured.');

        const customerIds = ['KH001', 'KH002', 'KH003', 'KH004', 'KH005', 'KH006'];
        const models = await DongMay.findAll();

        // Helper to replenish stock
        async function replenish(modelId) {
            const transaction = await sequelize.transaction();
            try {
                const maPn = `PN_AUTO_${Date.now().toString().slice(-8)}_${Math.floor(Math.random() * 100)}`;
                const quantity = 10;
                const model = await DongMay.findByPk(modelId, { transaction });
                const price = parseFloat(model.giaNhap) || 15000000;

                await PhieuNhap.create({
                    maPn,
                    ngayNhap: new Date(),
                    maNcc,
                    maNv: maNvManager,
                    maKho,
                    tongTien: price * quantity,
                    maHttt: 'TM',
                    ghiChu: `Nhập kho tự động bổ sung cho model ${modelId} do tồn kho thấp.`
                }, { transaction });

                await CtNhapMay.create({
                    maPn,
                    maModel: modelId,
                    soLuong: quantity,
                    donGia: price
                }, { transaction });

                for (let i = 1; i <= quantity; i++) {
                    const soSerial = `${modelId.slice(0, 3)}_AUTO_${Date.now().toString().slice(-4)}_${Math.random().toString(36).substring(2, 5).toUpperCase()}_${i}`;
                    await ChiTietMay.create({
                        soSerial,
                        maModel: modelId,
                        maKho,
                        trangThai: 'Trong kho'
                    }, { transaction });
                }

                await model.increment('soLuongTon', { by: quantity, transaction });
                await transaction.commit();
                console.log(`Replenished 10 units for ${modelId}`);
            } catch (err) {
                if (transaction) await transaction.rollback();
                console.error(`Replenish failed for ${modelId}:`, err);
            }
        }

        // 2. Simulate 12 orders
        for (let i = 1; i <= 12; i++) {
            const transaction = await sequelize.transaction();
            try {
                const maKh = customerIds[Math.floor(Math.random() * customerIds.length)];
                const maHd = `HD_BULK_${Date.now().toString().slice(-8)}_${i}`;

                // Randomly pick 1-2 models
                const numItems = Math.floor(Math.random() * 2) + 1;
                const selectedModels = [];
                let tempModels = [...models];
                for (let j = 0; j < numItems; j++) {
                    const idx = Math.floor(Math.random() * tempModels.length);
                    selectedModels.push(tempModels[idx]);
                    tempModels.splice(idx, 1);
                }

                const hoaDon = await HoaDon.create({
                    maHd,
                    ngayLap: new Date(),
                    maKh,
                    maNv: maNvAdmin,
                    maHttt: 'TM',
                    tongTien: 0,
                    trangThai: 'Đã hoàn thành',
                    ghiChu: 'Đơn hàng mô phỏng hàng loạt.'
                }, { transaction });

                let totalAmount = 0;

                for (const model of selectedModels) {
                    // Check stock and replenish if necessary (BEFORE order)
                    // We use a fresh check outside the transaction to avoid lock nesting issues or just check within
                    const currentModel = await DongMay.findByPk(model.maModel, { transaction });
                    if (currentModel.soLuongTon <= 2) {
                        // We need to commit current transaction or run replenish in background/separate?
                        // Better to replenish in a separate transaction before this one.
                        // But we are ALREADY in a transaction. 
                        // Let's check stock OUTSIDE and replenish before starting this order transaction.
                    }

                    const quantity = 1;
                    const price = parseFloat(model.giaBan) || 20000000;

                    await CtHoaDon.create({
                        maHd,
                        maModel: model.maModel,
                        soLuong: quantity,
                        donGia: price,
                        thanhTien: price * quantity
                    }, { transaction });

                    const unit = await ChiTietMay.findOne({
                        where: { maModel: model.maModel, trangThai: 'Trong kho' },
                        transaction
                    });

                    if (unit) {
                        await unit.update({ trangThai: 'Đã bán', maHd }, { transaction });
                        await currentModel.decrement('soLuongTon', { by: quantity, transaction });
                        totalAmount += price * quantity;
                    }
                }

                await hoaDon.update({ tongTien: totalAmount }, { transaction });
                await transaction.commit();
                console.log(`Order ${maHd} created for ${maKh}`);

                // Post-order replenishment check
                for (const model of selectedModels) {
                    const checkModel = await DongMay.findByPk(model.maModel);
                    if (checkModel.soLuongTon <= 2) {
                        await replenish(model.maModel);
                    }
                }
            } catch (err) {
                if (transaction) await transaction.rollback();
                console.error(`Order simulation ${i} failed:`, err);
            }
        }

        console.log('Bulk simulation finished.');
        process.exit(0);
    } catch (error) {
        console.error('Bulk simulation crashed:', error);
        process.exit(1);
    }
}

bulkSimulate();
