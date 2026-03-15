const { NhanVien } = require('./models');
const sequelize = require('./config/database');

const seedProfessionalEmployees = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB...');

        const employees = [
            {
                maNv: 'NV001',
                hoTen: 'Phạm Minh Tuấn',
                email: 'admin@ptech.com'
            },
            {
                maNv: 'NV002',
                hoTen: 'Hoàng Gia Bảo',
                email: 'bao.hoang@ptech.com'
            },
            {
                maNv: 'NV003',
                hoTen: 'Nguyễn Thu Thảo',
                email: 'thao.nguyen@ptech.com'
            },
            {
                maNv: 'NV004',
                hoTen: 'Đặng Quốc Trung',
                email: 'trung.dang@ptech.com'
            },
            {
                maNv: 'NV005',
                hoTen: 'Lý Thanh Tùng',
                email: 'tung.ly@ptech.com'
            }
        ];

        console.log('Updating employees with professional names...');
        for (const emp of employees) {
            const nv = await NhanVien.findByPk(emp.maNv);
            if (nv) {
                await nv.update({
                    hoTen: emp.hoTen,
                    email: emp.email
                });
                console.log(`✅ Updated ${emp.maNv}: ${emp.hoTen} (${emp.email})`);
            } else {
                console.log(`⚠️  Employee ${emp.maNv} not found.`);
            }
        }

        console.log('✅ All employees renamed professionally!');
        process.exit();
    } catch (error) {
        console.error('Update Failed:', error);
        process.exit(1);
    }
};

seedProfessionalEmployees();
