const { NhanVien, NhaCungCap, LinhKien, KhoLinhKien } = require('./src/models');

async function verify() {
    try {
        const manager = await NhanVien.findByPk('NV002');
        const supplier = await NhaCungCap.findByPk('NCC002');

        console.log('--- Entity Verification ---');
        console.log('Manager NV002:', manager ? 'EXISTS' : 'MISSING');
        if (manager) console.log(`  Name: ${manager.hoTen}, Role: ${manager.maCv}`);

        console.log('Supplier NCC002:', supplier ? 'EXISTS' : 'MISSING');
        if (supplier) console.log(`  Name: ${supplier.tenNcc}`);

        console.log('\n--- Inventory Verification (KHO_Q1) ---');
        const zeroStockCheck = await LinhKien.findAll({ where: { soLuongTon: 0 } });
        console.log('Total Components with zero stock (global):', zeroStockCheck.length);

        const khoQ1Stock = await KhoLinhKien.findAll({ where: { maKho: 'KHO_Q1' } });
        console.log('Total entries in Kho Quận 1:', khoQ1Stock.length);
        const lowStockInQ1 = khoQ1Stock.filter(s => s.soLuongTon < 10);
        console.log('Entries in Kho Quận 1 with less than 10 units:', lowStockInQ1.length);

        const success = manager && supplier && zeroStockCheck.length === 0 && lowStockInQ1.length === 0;
        console.log('\nFinal Verification Result:', success ? 'SUCCESS' : 'FAILURE');

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

verify();
