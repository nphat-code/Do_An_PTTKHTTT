const {
    sequelize,
    ChucVu,
    NhanVien,
    Kho,
    HangSanXuat,
    LoaiMay,
    CauHinh,
    DongMay,
    HinhThucThanhToan,
    NhaCungCap,
    LinhKien,
    LinhKienTuongThich
} = require('./src/models');
const bcrypt = require('bcryptjs');

const rolesData = [
    { maCv: 'ADMIN', tenCv: 'Quản trị viên hệ thống', luongCoBan: 20000000 },
    { maCv: 'MANAGER', tenCv: 'Quản lý cửa hàng', luongCoBan: 15000000 },
    { maCv: 'SALES', tenCv: 'Nhân viên bán hàng', luongCoBan: 8000000 },
    { maCv: 'WAREHOUSE', tenCv: 'Nhân viên kho', luongCoBan: 9000000 },
    { maCv: 'TECHNICIAN', tenCv: 'Nhân viên kỹ thuật', luongCoBan: 10000000 }
];

const warehousesData = [
    { maKho: 'KHO_TT', tenKho: 'Kho Trung Tâm', loaiKho: 'Kho tổng' },
    { maKho: 'KHO_Q1', tenKho: 'Kho Quận 1', loaiKho: 'Kho bán lẻ' }
];

const brandsData = [
    { maHang: 'ASUS', tenHang: 'Asus' },
    { maHang: 'MSI', tenHang: 'MSI' },
    { maHang: 'DELL', tenHang: 'Dell' },
    { maHang: 'LENOVO', tenHang: 'Lenovo' },
    { maHang: 'APPLE', tenHang: 'Apple' },
    { maHang: 'HP', tenHang: 'HP' },
    { maHang: 'ACER', tenHang: 'Acer' }
];

const categoriesData = [
    { maLoai: 'GAMING', tenLoai: 'Laptop Gaming' },
    { maLoai: 'VANPHONG', tenLoai: 'Laptop Văn Phòng' },
    { maLoai: 'MONG_NHE', tenLoai: 'Laptop Mỏng Nhẹ' },
    { maLoai: 'DOHOA', tenLoai: 'Laptop Đồ Họa' }
];

const paymentMethodsData = [
    { maHttt: 'TM', tenHttt: 'Tiền mặt' },
    { maHttt: 'CK', tenHttt: 'Chuyển khoản' }
];

const products = [
    {
        maModel: 'ASUS_ROG_G16',
        tenModel: 'Asus ROG Strix G16 2024',
        giaNhap: 28000000, giaBan: 32990000, soLuongTon: 0,
        maHang: 'ASUS', maLoai: 'GAMING',
        config: { cpu: 'Intel Core i7-14700HX', ram: '16GB DDR5', oCung: '512GB SSD', vga: 'RTX 4060', manHinh: '16" 2K 165Hz', pin: '90Wh', trongLuong: 2.5 }
    },
    {
        maModel: 'MSI_KATANA_15',
        tenModel: 'MSI Katana 15 B13V',
        giaNhap: 22000000, giaBan: 25990000, soLuongTon: 0,
        maHang: 'MSI', maLoai: 'GAMING',
        config: { cpu: 'Intel Core i5-13420H', ram: '16GB DDR5', oCung: '512GB SSD', vga: 'RTX 4050', manHinh: '15.6" FHD 144Hz', pin: '53.5Wh', trongLuong: 2.25 }
    },
    {
        maModel: 'DELL_XPS_13',
        tenModel: 'Dell XPS 13 9340',
        giaNhap: 35000000, giaBan: 42000000, soLuongTon: 0,
        maHang: 'DELL', maLoai: 'MONG_NHE',
        config: { cpu: 'Intel Core Ultra 7', ram: '16GB LPDDR5x', oCung: '512GB SSD', vga: 'Intel Arc', manHinh: '13.4" FHD+ IPS', pin: '55Wh', trongLuong: 1.19 }
    },
    {
        maModel: 'MACBOOK_AIR_M3',
        tenModel: 'MacBook Air 13 M3',
        giaNhap: 24000000, giaBan: 27990000, soLuongTon: 0,
        maHang: 'APPLE', maLoai: 'MONG_NHE',
        config: { cpu: 'Apple M3 8-core', ram: '8GB Unified', oCung: '256GB SSD', vga: '10-core GPU', manHinh: '13.6" Liquid Retina', pin: '52.6Wh', trongLuong: 1.24 }
    },
    {
        maModel: 'LENOVO_LEGION_5',
        tenModel: 'Lenovo Legion 5 16IRX9',
        giaNhap: 29000000, giaBan: 34500000, soLuongTon: 0,
        maHang: 'LENOVO', maLoai: 'GAMING',
        config: { cpu: 'Intel Core i7-14650HX', ram: '16GB DDR5', oCung: '512GB SSD', vga: 'RTX 4060', manHinh: '16" WQXGA 165Hz', pin: '80Wh', trongLuong: 2.3 }
    },
    {
        maModel: 'HP_VICTUS_16',
        tenModel: 'HP Victus 16 2024',
        giaNhap: 20000000, giaBan: 23990000, soLuongTon: 0,
        maHang: 'HP', maLoai: 'GAMING',
        config: { cpu: 'AMD Ryzen 5 7640HS', ram: '16GB DDR5', oCung: '512GB SSD', vga: 'RTX 4050', manHinh: '16.1" FHD 144Hz', pin: '70Wh', trongLuong: 2.3 }
    },
    {
        maModel: 'ACER_NITRO_V',
        tenModel: 'Acer Nitro V ANV15',
        giaNhap: 18000000, giaBan: 21490000, soLuongTon: 0,
        maHang: 'ACER', maLoai: 'GAMING',
        config: { cpu: 'Intel Core i5-13420H', ram: '8GB DDR5', oCung: '512GB SSD', vga: 'RTX 4050', manHinh: '15.6" FHD 144Hz', pin: '57Wh', trongLuong: 2.1 }
    },
    {
        maModel: 'DELL_INSPIRON_15',
        tenModel: 'Dell Inspiron 15 3530',
        giaNhap: 14000000, giaBan: 16800000, soLuongTon: 0,
        maHang: 'DELL', maLoai: 'VANPHONG',
        config: { cpu: 'Intel Core i5-1335U', ram: '8GB DDR4', oCung: '512GB SSD', vga: 'Intel Iris Xe', manHinh: '15.6" FHD 120Hz', pin: '41Wh', trongLuong: 1.65 }
    },
    {
        maModel: 'ASUS_VIVOBOOK_15',
        tenModel: 'Asus Vivobook 15 X1504',
        giaNhap: 12000000, giaBan: 14500000, soLuongTon: 0,
        maHang: 'ASUS', maLoai: 'VANPHONG',
        config: { cpu: 'Intel Core i3-1315U', ram: '8GB DDR4', oCung: '256GB SSD', vga: 'Intel UHD', manHinh: '15.6" FHD IPS', pin: '42Wh', trongLuong: 1.7 }
    },
    {
        maModel: 'HP_PAVILION_14',
        tenModel: 'HP Pavilion 14 dv2000',
        giaNhap: 15500000, giaBan: 18900000, soLuongTon: 0,
        maHang: 'HP', maLoai: 'VANPHONG',
        config: { cpu: 'Intel Core i5-1235U', ram: '16GB DDR4', oCung: '512GB SSD', vga: 'Intel Iris Xe', manHinh: '14" FHD IPS', pin: '43Wh', trongLuong: 1.41 }
    }
];

const sparePartsData = [
    { maLk: 'RAM_8GB_DDR4', tenLk: 'RAM 8GB DDR4 3200MHz', loaiLk: 'RAM', giaNhap: 450000, maHang: 'ASUS' },
    { maLk: 'RAM_16GB_DDR4', tenLk: 'RAM 16GB DDR4 3200MHz', loaiLk: 'RAM', giaNhap: 850000, maHang: 'MSI' },
    { maLk: 'RAM_8GB_DDR5', tenLk: 'RAM 8GB DDR5 4800MHz', loaiLk: 'RAM', giaNhap: 700000, maHang: 'ASUS' },
    { maLk: 'RAM_16GB_DDR5', tenLk: 'RAM 16GB DDR5 5600MHz', loaiLk: 'RAM', giaNhap: 1300000, maHang: 'MSI' },
    { maLk: 'SSD_256GB_NVME', tenLk: 'SSD 256GB NVMe Gen 4', loaiLk: 'SSD', giaNhap: 600000, maHang: 'DELL' },
    { maLk: 'SSD_512GB_NVME', tenLk: 'SSD 512GB NVMe Gen 4', loaiLk: 'SSD', giaNhap: 1050000, maHang: 'HP' },
    { maLk: 'MAC_SCREEN_13', tenLk: 'Màn hình Retina 13.6 inch', loaiLk: 'Màn hình', giaNhap: 5500000, maHang: 'APPLE' },
    { maLk: 'BATT_ASUS_90', tenLk: 'Pin Asus 90Wh', loaiLk: 'Pin', giaNhap: 1200000, maHang: 'ASUS' },
    { maLk: 'KB_DELL_XPS', tenLk: 'Bàn phím Dell XPS 13', loaiLk: 'Bàn phím', giaNhap: 950000, maHang: 'DELL' },
    { maLk: 'CHARGER_HP_65W', tenLk: 'Sạc HP 65W Type-C', loaiLk: 'Sạc', giaNhap: 350000, maHang: 'HP' }
];

const resetDatabase = async () => {
    try {
        console.log('--- ĐANG RESET DATABASE ---');
        await sequelize.sync({ force: true });
        console.log('✅ Đã xóa và tạo lại tất cả bảng.');

        console.log('--- ĐANG SEED DỮ LIỆU ---');

        // 1. Chức vụ
        await ChucVu.bulkCreate(rolesData);
        console.log('✅ Đã thêm các Chức vụ.');

        // 2. Nhân viên Admin
        const adminPass = await bcrypt.hash('admin123', 10);
        await NhanVien.create({
            maNv: 'NV001',
            hoTen: 'Quản Trị Viên',
            email: 'admin@gmail.com',
            matKhau: adminPass,
            maCv: 'ADMIN',
            trangThai: true
        });
        console.log('✅ Đã thêm tài khoản Admin: admin@gmail.com / admin123');

        // 3. Kho
        await Kho.bulkCreate(warehousesData);
        console.log('✅ Đã thêm các Kho.');

        // 4. Hãng & Loại máy
        await HangSanXuat.bulkCreate(brandsData);
        await LoaiMay.bulkCreate(categoriesData);
        console.log('✅ Đã thêm các Hãng và Loại máy.');

        // 5. Hình thức thanh toán
        await HinhThucThanhToan.bulkCreate(paymentMethodsData);
        console.log('✅ Đã thêm các Hình thức thanh toán.');

        // 6. Nhà cung cấp mẫu
        await NhaCungCap.create({
            maNcc: 'NCC001',
            tenNcc: 'Công ty TNHH Laptop Việt',
            email: 'contact@laptopviet.vn',
            sdt: '0123456789',
            diaChi: 'Số 1, Phố Vọng, Hà Nội'
        });
        console.log('✅ Đã thêm Nhà cung cấp mẫu.');

        // 7. Sản phẩm
        for (const p of products) {
            const maCh = 'CH_' + p.maModel;
            await CauHinh.create({ maCh, ...p.config });
            await DongMay.create({
                maModel: p.maModel,
                tenModel: p.tenModel,
                giaNhap: p.giaNhap,
                giaBan: p.giaBan,
                soLuongTon: 0,
                maCh: maCh,
                maHang: p.maHang,
                maLoai: p.maLoai
            });
        }
        console.log('✅ Đã thêm 10 Dòng máy mẫu.');

        // 8. Linh kiện
        await LinhKien.bulkCreate(sparePartsData);
        console.log('✅ Đã thêm 10 Linh kiện mẫu.');

        // 9. Tương thích (Compatibility)
        const compatibleLinks = [];
        products.forEach(p => {
            // RAM compatibility
            if (p.config.ram.includes('DDR5')) {
                compatibleLinks.push({ maModel: p.maModel, maLk: 'RAM_8GB_DDR5' });
                compatibleLinks.push({ maModel: p.maModel, maLk: 'RAM_16GB_DDR5' });
            } else if (p.config.ram.includes('DDR4')) {
                compatibleLinks.push({ maModel: p.maModel, maLk: 'RAM_8GB_DDR4' });
                compatibleLinks.push({ maModel: p.maModel, maLk: 'RAM_16GB_DDR4' });
            }

            // SSD compatibility
            compatibleLinks.push({ maModel: p.maModel, maLk: 'SSD_256GB_NVME' });
            compatibleLinks.push({ maModel: p.maModel, maLk: 'SSD_512GB_NVME' });

            // Specific links
            if (p.maModel === 'MACBOOK_AIR_M3') {
                compatibleLinks.push({ maModel: p.maModel, maLk: 'MAC_SCREEN_13' });
            }
            if (p.maModel === 'DELL_XPS_13') {
                compatibleLinks.push({ maModel: p.maModel, maLk: 'KB_DELL_XPS' });
            }
            if (p.maModel === 'ASUS_ROG_G16') {
                compatibleLinks.push({ maModel: p.maModel, maLk: 'BATT_ASUS_90' });
            }
            if (p.maHang === 'HP') {
                compatibleLinks.push({ maModel: p.maModel, maLk: 'CHARGER_HP_65W' });
            }
        });

        await LinhKienTuongThich.bulkCreate(compatibleLinks);
        console.log('✅ Đã thiết lập Linh kiện tương thích.');

        console.log('--- HOÀN TẤT RESET & SEED ---');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi Reset Database:', error);
        process.exit(1);
    }
};

resetDatabase();
