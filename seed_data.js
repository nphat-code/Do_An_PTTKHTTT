const { sequelize, DongMay, CauHinh } = require('./src/models');

const products = [
    {
        maModel: 'ASUS_ROG_G16',
        tenModel: 'Asus ROG Strix G16 2024',
        giaNhap: 28000000, giaBan: 32990000, soLuongTon: 15,
        hinhAnh: 'uploads/products/gaming1.png',
        maHang: 'ASUS', maLoai: 'GAMING',
        config: { cpu: 'Intel Core i7-14700HX', ram: '16GB DDR5 5600MHz', oCung: '512GB SSD NVMe', vga: 'RTX 4060 8GB', manHinh: '16 inch 2K 165Hz', pin: '90Wh', trongLuong: 2.5 }
    },
    {
        maModel: 'MSI_KATANA_15',
        tenModel: 'MSI Katana 15 B13VFK',
        giaNhap: 22000000, giaBan: 25990000, soLuongTon: 20,
        hinhAnh: 'uploads/products/gaming2.png',
        maHang: 'MSI', maLoai: 'GAMING',
        config: { cpu: 'Intel Core i5-13420H', ram: '16GB DDR5 4800MHz', oCung: '512GB SSD NVMe', vga: 'RTX 4060 8GB', manHinh: '15.6 inch FHD 144Hz', pin: '53.5Wh', trongLuong: 2.25 }
    },
    {
        maModel: 'DELL_INSPIRON_14',
        tenModel: 'Dell Inspiron 14 5430',
        giaNhap: 15000000, giaBan: 17990000, soLuongTon: 25,
        hinhAnh: 'uploads/products/office1.png',
        maHang: 'DELL', maLoai: 'VANPHONG',
        config: { cpu: 'Intel Core i5-1340P', ram: '16GB DDR5', oCung: '512GB SSD', vga: 'Intel Iris Xe', manHinh: '14 inch FHD IPS', pin: '54Wh', trongLuong: 1.59 }
    },
    {
        maModel: 'LENOVO_THINKPAD_E14',
        tenModel: 'Lenovo ThinkPad E14 Gen 5',
        giaNhap: 16000000, giaBan: 18990000, soLuongTon: 18,
        hinhAnh: 'uploads/products/office2.png',
        maHang: 'LENOVO', maLoai: 'VANPHONG',
        config: { cpu: 'Intel Core i5-1335U', ram: '8GB DDR4 3200MHz', oCung: '256GB SSD NVMe', vga: 'Intel UHD', manHinh: '14 inch FHD IPS Anti-glare', pin: '45Wh', trongLuong: 1.64 }
    },
    {
        maModel: 'HP_ENVY_X360',
        tenModel: 'HP Envy x360 2-in-1 14',
        giaNhap: 20000000, giaBan: 23490000, soLuongTon: 12,
        hinhAnh: 'uploads/products/thin1.png',
        maHang: 'HP', maLoai: 'MONG_NHE',
        config: { cpu: 'AMD Ryzen 7 7730U', ram: '16GB DDR4', oCung: '512GB SSD', vga: 'AMD Radeon Graphics', manHinh: '14 inch 2.8K OLED Touch', pin: '51Wh', trongLuong: 1.39 }
    },
    {
        maModel: 'MACBOOK_PRO_M3',
        tenModel: 'MacBook Pro 14 M3 2024',
        giaNhap: 38000000, giaBan: 42990000, soLuongTon: 8,
        hinhAnh: 'uploads/products/macbook1.png',
        maHang: 'APPLE', maLoai: 'DOHOA',
        config: { cpu: 'Apple M3 Pro 11-core', ram: '18GB Unified', oCung: '512GB SSD', vga: 'Apple M3 Pro 14-core GPU', manHinh: '14.2 inch Liquid Retina XDR', pin: '72.4Wh', trongLuong: 1.55 }
    },
    {
        maModel: 'ACER_PREDATOR_16',
        tenModel: 'Acer Predator Helios 16',
        giaNhap: 35000000, giaBan: 39990000, soLuongTon: 10,
        hinhAnh: 'uploads/products/acer1.png',
        maHang: 'ACER', maLoai: 'GAMING',
        config: { cpu: 'Intel Core i9-14900HX', ram: '32GB DDR5 5600MHz', oCung: '1TB SSD NVMe', vga: 'RTX 4070 8GB', manHinh: '16 inch WQXGA 240Hz', pin: '90Wh', trongLuong: 2.79 }
    },
    {
        maModel: 'DELL_ALIENWARE_M16',
        tenModel: 'Dell Alienware M16 R2',
        giaNhap: 42000000, giaBan: 47990000, soLuongTon: 5,
        hinhAnh: 'uploads/products/dell_gaming.png',
        maHang: 'DELL', maLoai: 'GAMING',
        config: { cpu: 'Intel Core i9-14900HX', ram: '32GB DDR5 5600MHz', oCung: '1TB SSD NVMe', vga: 'RTX 4080 12GB', manHinh: '16 inch QHD+ 240Hz', pin: '97Wh', trongLuong: 3.05 }
    },
    {
        maModel: 'ASUS_ZENBOOK_14',
        tenModel: 'Asus ZenBook 14 OLED UX3405',
        giaNhap: 22000000, giaBan: 26490000, soLuongTon: 14,
        hinhAnh: 'uploads/products/zenbook1.png',
        maHang: 'ASUS', maLoai: 'MONG_NHE',
        config: { cpu: 'Intel Core Ultra 7 155H', ram: '16GB LPDDR5x', oCung: '512GB SSD PCIe 4.0', vga: 'Intel Arc Graphics', manHinh: '14 inch 2.8K OLED 120Hz', pin: '75Wh', trongLuong: 1.28 }
    }
];

(async () => {
    try {
        for (const p of products) {
            const maCh = 'CH_' + p.maModel;
            await CauHinh.create({
                maCh,
                ...p.config
            });

            await DongMay.create({
                maModel: p.maModel,
                tenModel: p.tenModel,
                giaNhap: p.giaNhap,
                giaBan: p.giaBan,
                soLuongTon: p.soLuongTon,
                hinhAnh: p.hinhAnh,
                maCh: maCh,
                maHang: p.maHang,
                maLoai: p.maLoai
            });

            console.log(`✅ ${p.tenModel}`);
        }
        console.log(`\n🎉 Đã thêm ${products.length} sản phẩm mẫu thành công!`);
        process.exit(0);
    } catch (e) {
        console.error('❌ Lỗi:', e.message);
        process.exit(1);
    }
})();
