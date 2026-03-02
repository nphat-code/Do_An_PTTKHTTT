const { ChucVu } = require('./models');
const sequelize = require('./config/database');

const rolesData = [
    {
        maCv: 'ADMIN',
        tenCv: 'Quản trị viên hệ thống',
        moTa: 'Toàn quyền. Nhiệm vụ: Quản lý tài khoản nhân viên, thiết lập hệ thống, cấu hình danh mục, xem báo cáo và logs.',
        luongCoBan: 20000000
    },
    {
        maCv: 'MANAGER',
        tenCv: 'Quản lý cửa hàng',
        moTa: 'Quyền xem/sửa doanh số, kho hàng, nhân sự. Nhiệm vụ: Duyệt đơn nhập, thay đổi giá/khuyến mãi, theo dõi KPI, xuất báo cáo.',
        luongCoBan: 15000000
    },
    {
        maCv: 'SALES',
        tenCv: 'Nhân viên bán hàng',
        moTa: 'Tra cứu, tạo đơn, xem thông tin khách hàng. Nhiệm vụ: Tư vấn cấu hình, kiểm tra kho, lập hóa đơn, áp dụng giảm giá.',
        luongCoBan: 8000000
    },
    {
        maCv: 'WAREHOUSE',
        tenCv: 'Nhân viên kho',
        moTa: 'Quản lý phiếu nhập, xuất, kiểm kho. Nhiệm vụ: Cập nhật số lượng nhập, quản lý IMEI/Serial, chuyển trạng thái giao hàng.',
        luongCoBan: 9000000
    },
    {
        maCv: 'TECHNICIAN',
        tenCv: 'Nhân viên kỹ thuật / Bảo hành',
        moTa: 'Quản lý phiếu bảo hành, sửa chữa. Nhiệm vụ: Tiếp nhận máy lỗi, cập nhật tiến độ, tra cứu lịch sử mua hàng để bảo hành.',
        luongCoBan: 10000000
    }
];

const seedRoles = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB...');

        console.log('Inserting Roles...');
        for (const role of rolesData) {
            await ChucVu.upsert(role);
        }

        console.log('✅ 5 Roles seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('Seed Failed:', error);
        process.exit(1);
    }
};

seedRoles();
