const { DongMay, CauHinh, HangSanXuat, LoaiMay } = require('../models/index');

async function seed() {
    try {
        console.log('Starting to seed 6 new products...');

        // Verify basic data exists
        const brands = await HangSanXuat.findAll();
        const categories = await LoaiMay.findAll();

        if (brands.length === 0 || categories.length === 0) {
            console.error('Brands or Categories not found. Please seed them first.');
            return;
        }

        const brandMap = {};
        brands.forEach(b => brandMap[b.tenHang.toUpperCase()] = b.maHang);

        const categoryMap = {};
        categories.forEach(c => categoryMap[c.maLoai] = c.maLoai); // Using maLoai as key

        const newProducts = [
            {
                maModel: 'DELL-XPS-9320',
                tenModel: 'Dell XPS 13 Plus 9320',
                giaNhap: 35000000,
                giaBan: 42990000,
                soLuongTon: 10,
                hinhAnh: 'uploads/products/xps.png',
                thoiHanBaoHanh: 12,
                maHang: brandMap['DELL'] || 'DELL',
                maLoai: 'MONG_NHE',
                config: {
                    maCh: 'CH-XPS-9320',
                    cpu: 'Intel Core i7-1260P',
                    ram: '16GB LPDDR5',
                    oCung: '512GB SSD NVMe',
                    vga: 'Intel Iris Xe Graphics',
                    manHinh: '13.4" 3.5K OLED Touch',
                    pin: '55Wh',
                    trongLuong: 1.23
                }
            },
            {
                maModel: 'ASUS-ROG-G614',
                tenModel: 'Asus ROG Strix G16 G614',
                giaNhap: 28000000,
                giaBan: 35490000,
                soLuongTon: 15,
                hinhAnh: 'uploads/products/rog.png',
                thoiHanBaoHanh: 24,
                maHang: brandMap['ASUS'] || 'ASUS',
                maLoai: 'GAMING',
                config: {
                    maCh: 'CH-ROG-G614',
                    cpu: 'Intel Core i7-13650HX',
                    ram: '16GB DDR5',
                    oCung: '512GB SSD NVMe',
                    vga: 'NVIDIA RTX 4060 8GB',
                    manHinh: '16" QHD+ 240Hz',
                    pin: '90Wh',
                    trongLuong: 2.5
                }
            },
            {
                maModel: 'HP-VICTUS-16',
                tenModel: 'HP Victus 16-r0000',
                giaNhap: 22000000,
                giaBan: 27990000,
                soLuongTon: 20,
                hinhAnh: 'uploads/products/victus.png',
                thoiHanBaoHanh: 12,
                maHang: brandMap['HP'] || 'HP',
                maLoai: 'GAMING',
                config: {
                    maCh: 'CH-VICTUS-16',
                    cpu: 'Intel Core i5-13500H',
                    ram: '16GB DDR5',
                    oCung: '512GB SSD NVMe',
                    vga: 'NVIDIA RTX 4050 6GB',
                    manHinh: '16.1" FHD 144Hz',
                    pin: '70Wh',
                    trongLuong: 2.3
                }
            },
            {
                maModel: 'LENOVO-T14-G4',
                tenModel: 'Lenovo ThinkPad T14 Gen 4',
                giaNhap: 25000000,
                giaBan: 31500000,
                soLuongTon: 12,
                hinhAnh: 'uploads/products/thinkpad.png',
                thoiHanBaoHanh: 36,
                maHang: brandMap['LENOVO'] || 'LENOVO',
                maLoai: 'VANPHONG',
                config: {
                    maCh: 'CH-T14-G4',
                    cpu: 'Intel Core i5-1335U',
                    ram: '16GB DDR5',
                    oCung: '512GB SSD NVMe',
                    vga: 'Intel Iris Xe Graphics',
                    manHinh: '14" WUXGA IPS',
                    pin: '52.5Wh',
                    trongLuong: 1.37
                }
            },
            {
                maModel: 'APPLE-MBA-M3',
                tenModel: 'MacBook Air 13-inch M3',
                giaNhap: 24000000,
                giaBan: 27990000,
                soLuongTon: 25,
                hinhAnh: 'uploads/products/macbookair.png',
                thoiHanBaoHanh: 12,
                maHang: brandMap['APPLE'] || 'APPLE',
                maLoai: 'MONG_NHE',
                config: {
                    maCh: 'CH-MBA-M3',
                    cpu: 'Apple M3 8-core',
                    ram: '8GB Unified Memory',
                    oCung: '256GB SSD',
                    vga: '8-core GPU',
                    manHinh: '13.6" Liquid Retina',
                    pin: '52.6Wh',
                    trongLuong: 1.24
                }
            },
            {
                maModel: 'ACER-NITRO-AN515',
                tenModel: 'Acer Nitro 5 Tiger AN515',
                giaNhap: 18000000,
                giaBan: 23490000,
                soLuongTon: 30,
                hinhAnh: 'uploads/products/nitro.png',
                thoiHanBaoHanh: 12,
                maHang: brandMap['ACER'] || 'ACER',
                maLoai: 'GAMING',
                config: {
                    maCh: 'CH-NITRO-AN515',
                    cpu: 'Intel Core i5-12500H',
                    ram: '8GB DDR4',
                    oCung: '512GB SSD NVMe',
                    vga: 'NVIDIA RTX 3050 4GB',
                    manHinh: '15.6" FHD 144Hz',
                    pin: '57.5Wh',
                    trongLuong: 2.5
                }
            }
        ];

        for (const item of newProducts) {
            // Check if Model exists
            const existingModel = await DongMay.findByPk(item.maModel);
            if (existingModel) {
                console.log(`Model ${item.maModel} already exists, skipping...`);
                continue;
            }

            // Create Config
            await CauHinh.create(item.config);

            // Create Model
            const { config, ...modelData } = item;
            await DongMay.create({
                ...modelData,
                maCh: item.config.maCh
            });

            console.log(`Created product: ${item.tenModel}`);
        }

        console.log('Seeding completed successfully!');
    } catch (error) {
        console.error('Error seeding products:', error);
    } finally {
        process.exit();
    }
}

seed();
