const { sequelize, Quyen, ChucVu, ChiTietQuyen } = require('./models');

const permissions = [
    { maQuyen: 'PRODUCT_MANAGE', tenQuyen: 'Quản lý sản phẩm', moTa: 'Xem, thêm, sửa, xóa sản phẩm' },
    { maQuyen: 'ORDER_PROCESS', tenQuyen: 'Xử lý đơn hàng', moTa: 'Duyệt đơn, cập nhật trạng thái đơn hàng' },
    { maQuyen: 'INVENTORY_VIEW', tenQuyen: 'Xem tồn kho', moTa: 'Xem danh sách tồn kho máy và linh kiện' },
    { maQuyen: 'IMPORT_MANAGE', tenQuyen: 'Quản lý nhập hàng', moTa: 'Tạo và xem phiếu nhập hàng' },
    { maQuyen: 'WARRANTY_MANAGE', tenQuyen: 'Quản lý bảo hành', moTa: 'Tạo phiếu, cập nhật tiến trình bảo hành' },
    { maQuyen: 'USER_MANAGE', tenQuyen: 'Quản lý người dùng', moTa: 'Quản lý nhân viên và khách hàng' },
    { maQuyen: 'SYSTEM_SETTINGS', tenQuyen: 'Cài đặt hệ thống', moTa: 'Cấu hình hệ thống, phân quyền' },
    { maQuyen: 'REPORT_VIEW', tenQuyen: 'Xem báo cáo', moTa: 'Xem các báo cáo doanh thu, tồn kho và hiệu suất' }
];

async function seedRBAC() {
    try {
        await sequelize.authenticate();
        console.log('Connected to Database.');
        await sequelize.sync(); // Create tables if not exists
        console.log('Tables synced.');

        // 1. Create permissions
        for (const p of permissions) {
            await Quyen.findOrCreate({
                where: { maQuyen: p.maQuyen },
                defaults: p
            });
        }
        console.log('Permissions seeded.');

        // 2. Assign default permissions to existing roles
        // Assuming roles: 'Admin', 'Kỹ thuật', 'Bán hàng', 'Kho' exist from previous data

        const roles = await ChucVu.findAll();
        for (const role of roles) {
            // Cấp toàn bộ quyền cho Admin/Quản lý
            if (role.tenCv.toLowerCase().includes('quản lý') || role.tenCv.toLowerCase().includes('giám đốc')) {
                for (const p of permissions) {
                    await ChiTietQuyen.findOrCreate({
                        where: { maCv: role.maCv, maQuyen: p.maQuyen }
                    });
                }
            } else {
                // Các vai trò khác: Cấp quyền xem báo cáo để demo
                await ChiTietQuyen.findOrCreate({
                    where: { maCv: role.maCv, maQuyen: 'REPORT_VIEW' }
                });

                if (role.tenCv.toLowerCase().includes('kỹ thuật')) {
                    const techPerms = ['WARRANTY_MANAGE', 'INVENTORY_VIEW'];
                    for (const p of techPerms) {
                        await ChiTietQuyen.findOrCreate({
                            where: { maCv: role.maCv, maQuyen: p }
                        });
                    }
                } else if (role.tenCv.toLowerCase().includes('bán')) {
                    const salesPerms = ['ORDER_PROCESS', 'INVENTORY_VIEW', 'PRODUCT_MANAGE'];
                    for (const p of salesPerms) {
                        await ChiTietQuyen.findOrCreate({
                            where: { maCv: role.maCv, maQuyen: p }
                        });
                    }
                }
            }
        }
        console.log('Role-Permission mappings seeded.');

    } catch (err) {
        console.error('Error seeding RBAC:', err);
    } finally {
        process.exit();
    }
}

seedRBAC();
