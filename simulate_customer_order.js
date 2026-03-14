const {
    KhachHang,
    HoaDon,
    CtHoaDon,
    ChiTietMay,
    DongMay,
    sequelize
} = require('./src/models');
const bcrypt = require('bcryptjs');

async function simulate() {
    const transaction = await sequelize.transaction();
    try {
        // 1. Create Customer (KH001)
        const hashedPassword = await bcrypt.hash('123456', 10);
        const [customer, customerCreated] = await KhachHang.findOrCreate({
            where: { maKh: 'KH001' },
            defaults: {
                hoTen: 'Trần Thị Khách Hàng',
                ngaySinh: '1995-05-20',
                gioiTinh: 'Nữ',
                sdt: '0911223344',
                email: 'khachhang01@gmail.com',
                diaChi: '123 Đường Nguyễn Trãi, Quận 1, TP.HCM',
                matKhau: hashedPassword,
                trangThai: true
            },
            transaction
        });
        console.log(customerCreated ? 'Customer KH001 created.' : 'Customer KH001 already exists.');

        // 2. Select Machines (Pick 2 different available models)
        const availableModels = await DongMay.findAll({
            where: { soLuongTon: { [sequelize.Sequelize.Op.gt]: 0 } },
            limit: 2,
            transaction
        });

        if (availableModels.length < 2) {
            throw new Error('Not enough available machine models for simulation.');
        }

        const maHd = `HD_SIM_${Date.now().toString().slice(-10)}`;
        const phieuNhap = await HoaDon.create({
            maHd: maHd,
            ngayLap: new Date(),
            maKh: 'KH001',
            maNv: 'NV001',
            maHttt: 'TM',
            tongTien: 0,
            trangThai: 'Đã thanh toán',
            ghiChu: 'Đơn hàng mô phỏng cho khách hàng mới.'
        }, { transaction });

        let totalAmount = 0;

        for (const model of availableModels) {
            const quantity = 1;
            const price = parseFloat(model.giaBan) || 20000000; // Default price if missing

            // Create CtHoaDon
            await CtHoaDon.create({
                maHd: maHd,
                maModel: model.maModel,
                soLuong: quantity,
                donGia: price,
                thanhTien: price * quantity
            }, { transaction });

            // Update ChiTietMay (Find 1 unit 'Trong kho')
            const machineUnit = await ChiTietMay.findOne({
                where: { maModel: model.maModel, trangThai: 'Trong kho' },
                transaction
            });

            if (machineUnit) {
                await machineUnit.update({
                    trangThai: 'Đã bán',
                    maHd: maHd
                }, { transaction });
            } else {
                throw new Error(`No individual unit available for model ${model.maModel}`);
            }

            // Decrement DongMay stock
            await model.decrement('soLuongTon', { by: quantity, transaction });

            totalAmount += price * quantity;
        }

        await phieuNhap.update({ tongTien: totalAmount }, { transaction });

        await transaction.commit();
        console.log('Customer creation and order simulation completed successfully.');
        process.exit(0);
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('Simulation failed:', error);
        process.exit(1);
    }
}

simulate();
