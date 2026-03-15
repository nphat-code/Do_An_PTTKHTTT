const { HangSanXuat } = require('../models');

const brandCountries = {
    'APPLE': 'Mỹ',
    'ASUS': 'Đài Loan',
    'ACER': 'Đài Loan',
    'DELL': 'Mỹ',
    'HP': 'Mỹ',
    'MSI': 'Đài Loan',
    'LENOVO': 'Trung Quốc',
    'SAMSUNG': 'Hàn Quốc',
    'LG': 'Hàn Quốc',
    'GIGABYTE': 'Đài Loan'
};

async function updateCountries() {
    try {
        console.log('--- Đang cập nhật quốc gia cho các hãng sản xuất ---');

        const brands = await HangSanXuat.findAll();

        for (const brand of brands) {
            const country = brandCountries[brand.maHang.toUpperCase()];
            if (country) {
                await brand.update({ quocGia: country });
                console.log(`✅ Đã cập nhật ${brand.maHang}: ${country}`);
            } else {
                console.log(`⚠️  Chưa có thông tin quốc gia cho: ${brand.maHang}`);
            }
        }

        console.log('--- Hoàn tất cập nhật ---');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error);
        process.exit(1);
    }
}

updateCountries();
