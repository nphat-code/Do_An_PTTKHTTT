const { NhanVien, ChucVu } = require('./models');
const sequelize = require('./config/database');
const bcrypt = require('bcryptjs');

const seedMissingEmployees = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB...');

        const roles = await ChucVu.findAll();
        const hashedPassword = await bcrypt.hash('123456', 10);

        const missingEmployees = [
            {
                maNv: 'NV003',
                hoTen: 'Nguyễn Văn Bán',
                email: 'sales@ptech.com',
                matKhau: hashedPassword,
                sdt: '0901234567',
                diaChi: '123 Đường Bán Hàng, TP.HCM',
                gioiTinh: 'Nam',
                maCv: 'SALES',
                trangThai: true
            },
            {
                maNv: 'NV004',
                hoTen: 'Trần Văn Kho',
                email: 'warehouse@ptech.com',
                matKhau: hashedPassword,
                sdt: '0907654321',
                diaChi: '456 Đường Kho Bãi, TP.HCM',
                gioiTinh: 'Nam',
                maCv: 'WAREHOUSE',
                trangThai: true
            },
            {
                maNv: 'NV005',
                hoTen: 'Lê Văn Máy',
                email: 'tech@ptech.com',
                matKhau: hashedPassword,
                sdt: '0988888888',
                diaChi: '789 Đường Kỹ Thuật, TP.HCM',
                gioiTinh: 'Nam',
                maCv: 'TECHNICIAN',
                trangThai: true
            }
        ];

        console.log('Seeding missing employees...');
        for (const nv of missingEmployees) {
            const existing = await ChucVu.findByPk(nv.maCv);
            if (existing) {
                await NhanVien.upsert(nv);
                console.log(`✅ Seeded ${nv.maCv}: ${nv.hoTen}`);
            } else {
                console.log(`❌ Role ${nv.maCv} not found, skipping.`);
            }
        }

        console.log('✅ All missing roles now have employees!');
        process.exit();
    } catch (error) {
        console.error('Seed Failed:', error);
        process.exit(1);
    }
};

seedMissingEmployees();
