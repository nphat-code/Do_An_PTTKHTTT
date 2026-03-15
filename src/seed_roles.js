const { ChucVu } = require('./models');
const sequelize = require('./config/database');

const rolesData = [
    {
        maCv: 'ADMIN',
        tenCv: 'Quản trị viên hệ thống',
        moTa: 'Người quản trị cấp cao nhất của hệ thống P-Tech Laptop. Có toàn quyền truy cập tất cả các tính năng bao gồm: quản lý tài khoản nhân viên, phân quyền truy cập, cấu hình thông tin cửa hàng, quản lý danh mục gốc, sao lưu dữ liệu và theo dõi nhật ký hệ thống (logs) để đảm bảo tính an toàn và ổn định.',
        luongCoBan: 20000000
    },
    {
        maCv: 'MANAGER',
        tenCv: 'Quản lý cửa hàng',
        moTa: 'Quản lý điều hành hoạt động kinh doanh tại cửa hàng. Chịu trách nhiệm giám sát doanh số, quản lý nhân sự, phê duyệt các phiếu nhập hàng giá trị lớn, thiết lập các chương trình khuyến mãi, điều chỉnh giá bán linh hoạt và theo dõi các chỉ số hiệu suất (KPI) để báo cáo cho ban giám đốc.',
        luongCoBan: 15000000
    },
    {
        maCv: 'SALES',
        tenCv: 'Nhân viên bán hàng',
        moTa: 'Đội ngũ trực diện tư vấn và chăm sóc khách hàng. Có nhiệm vụ tra cứu thông tin sản phẩm, cấu hình máy tính, kiểm tra tồn kho thời gian thực, lập đơn hàng, áp dụng các mã giảm giá hợp lệ và hỗ trợ khách hàng hoàn tất thủ tục thanh toán một cách chuyên nghiệp.',
        luongCoBan: 8000000
    },
    {
        maCv: 'WAREHOUSE',
        tenCv: 'Nhân viên kho',
        moTa: 'Chuyên viên quản lý chuỗi cung ứng và kho vận. Phụ trách tiếp nhận hàng từ nhà cung cấp, kiểm tra chất lượng đầu vào, quản lý số Serial/IMEI chính xác, thực hiện kiểm kê định kỳ, điều phối hàng hóa giữa các kho và đảm bảo quy trình đóng gói, xuất kho diễn ra đúng tiến độ.',
        luongCoBan: 9000000
    },
    {
        maCv: 'TECHNICIAN',
        tenCv: 'Nhân viên kỹ thuật / Bảo hành',
        moTa: 'Chuyên gia kỹ thuật và hỗ trợ sau bán hàng. Chịu trách nhiệm tiếp nhận và kiểm tra các thiết bị lỗi, thực hiện quy trình bảo hành, sửa chữa thay thế linh kiện, cập nhật trạng thái xử lý cho khách hàng và tư vấn kỹ thuật chuyên môn về nâng cấp cấu hình phần cứng.',
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
