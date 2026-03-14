const {
    DongMay,
    ChiTietMay,
    PhieuNhap,
    CtNhapMay,
    sequelize
} = require('./src/models');

async function importMachines() {
    const transaction = await sequelize.transaction();
    try {
        const models = await DongMay.findAll({ transaction });
        const maKho = 'KHO_Q1';
        const maNv = 'NV002'; // Manager created previously
        const maNcc = 'NCC002'; // Supplier created previously
        const maPn = `PN_MCH_${Date.now().toString().slice(-10)}`;

        // Create PhieuNhap
        const phieuNhap = await PhieuNhap.create({
            maPn,
            ngayNhap: new Date(),
            maNcc,
            maNv,
            maKho,
            tongTien: 0,
            maHttt: 'TM',
            ghiChu: 'Nhập kho lô máy tính xách tay mới cho Kho Quận 1.'
        }, { transaction });

        let totalAmount = 0;

        for (const model of models) {
            const quantity = 5;
            const price = parseFloat(model.giaNhap) || 0;

            // Create CtNhapMay
            await CtNhapMay.create({
                maPn,
                maModel: model.maModel,
                soLuong: quantity,
                donGia: price
            }, { transaction });

            // Create ChiTietMay (Individual serial numbers)
            for (let i = 1; i <= quantity; i++) {
                const timestamp = Date.now().toString().slice(-6);
                const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
                const soSerial = `${model.maModel.slice(0, 3)}_${timestamp}_${randomStr}_${i}`;

                await ChiTietMay.create({
                    soSerial,
                    maModel: model.maModel,
                    maKho,
                    trangThai: 'Trong kho'
                }, { transaction });
            }

            // Update DongMay total stock
            await model.increment('soLuongTon', { by: quantity, transaction });

            totalAmount += price * quantity;
        }

        await phieuNhap.update({ tongTien: totalAmount }, { transaction });

        await transaction.commit();
        console.log('Machine import completed successfully.');
        process.exit(0);
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('Machine import failed:', error);
        process.exit(1);
    }
}

importMachines();
