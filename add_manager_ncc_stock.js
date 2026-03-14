const {
    NhanVien,
    NhaCungCap,
    LinhKien,
    PhieuNhap,
    CtNhapLk,
    KhoLinhKien,
    sequelize
} = require('./src/models');
const bcrypt = require('bcryptjs');

async function execute() {
    const transaction = await sequelize.transaction();
    try {
        // 1. Create Store Manager (NV002)
        const hashedPassword = await bcrypt.hash('123456', 10);
        const [manager, managerCreated] = await NhanVien.findOrCreate({
            where: { maNv: 'NV002' },
            defaults: {
                hoTen: 'Nguyễn Văn Quản Lý',
                ngaySinh: '1990-01-01',
                gioiTinh: 'Nam',
                sdt: '0987654321',
                email: 'manager01@gmail.com',
                diaChi: '456 Đường Lê Lợi, Quận 1, TP.HCM',
                trangThai: true,
                matKhau: hashedPassword,
                maCv: 'MANAGER'
            },
            transaction
        });
        console.log(managerCreated ? 'Employee NV002 created.' : 'Employee NV002 already exists.');

        // 2. Create New Supplier (NCC002)
        const [supplier, supplierCreated] = await NhaCungCap.findOrCreate({
            where: { maNcc: 'NCC002' },
            defaults: {
                tenNcc: 'Công ty TNHH Linh Kiện Toàn Cầu',
                diaChi: '789 Đường Nguyễn Huệ, Quận 1, TP.HCM',
                sdt: '02838383838',
                trangThai: true
            },
            transaction
        });
        console.log(supplierCreated ? 'Supplier NCC002 created.' : 'Supplier NCC002 already exists.');

        // 3. Identify Zero-Stock Components
        const zeroStockComponents = await LinhKien.findAll({
            where: { soLuongTon: 0 },
            transaction
        });
        console.log(`Found ${zeroStockComponents.length} components with zero stock.`);

        if (zeroStockComponents.length > 0) {
            const maKho = 'KHO_Q1';
            const maPn = `PN_MAN_${Date.now().toString().slice(-10)}`;

            // 4. Create PhieuNhap
            const phieuNhap = await PhieuNhap.create({
                maPn: maPn,
                ngayNhap: new Date(),
                maNcc: 'NCC002',
                maNv: 'NV002',
                maKho: maKho,
                tongTien: 0,
                maHttt: 'TM',
                ghiChu: 'Nhập kho bổ sung linh kiện tồn kho bằng 0 cho Kho Quận 1.'
            }, { transaction });

            let totalAmount = 0;

            // 5 & 6. Import Details and Update Stock
            for (const comp of zeroStockComponents) {
                const quantity = 10;
                const price = parseFloat(comp.giaNhap) || 0;

                await CtNhapLk.create({
                    maPn: maPn,
                    maLk: comp.maLk,
                    soLuong: quantity,
                    donGia: price
                }, { transaction });

                // Update KhoLinhKien (Dist 1 Warehouse)
                let khoLk = await KhoLinhKien.findOne({
                    where: { maKho: maKho, maLk: comp.maLk },
                    transaction
                });

                if (!khoLk) {
                    await KhoLinhKien.create({
                        maKho: maKho,
                        maLk: comp.maLk,
                        soLuongTon: quantity
                    }, { transaction });
                } else {
                    await KhoLinhKien.update(
                        { soLuongTon: khoLk.soLuongTon + quantity },
                        { where: { maKho: maKho, maLk: comp.maLk }, transaction }
                    );
                }

                // Update LinhKien total stock
                await comp.increment('soLuongTon', { by: quantity, transaction });

                totalAmount += price * quantity;
            }

            await phieuNhap.update({ tongTien: totalAmount }, { transaction });
            console.log(`Imported stock for ${zeroStockComponents.length} components into ${maKho}.`);
        }

        await transaction.commit();
        console.log('Execution completed successfully.');
        process.exit(0);
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('Execution failed:', error);
        process.exit(1);
    }
}

execute();
