const { KhachHang, HoaDon, PhieuNhap, DongMay } = require('./src/models');

async function verify() {
    try {
        const customerCount = await KhachHang.count();
        const orderCount = await HoaDon.count();
        const autoPnCount = await PhieuNhap.count({ where: { maPn: { [require('sequelize').Op.like]: 'PN_AUTO_%' } } });

        console.log('--- Bulk Simulation Verification ---');
        console.log('Total Customers:', customerCount);
        console.log('Total Orders:', orderCount);
        console.log('Auto-Replenish Receipts:', autoPnCount);

        const products = await DongMay.findAll();
        console.log('\n--- Final Stock Levels ---');
        let lowStockCount = 0;
        products.forEach(p => {
            console.log(`${p.maModel}: ${p.soLuongTon}`);
            if (p.soLuongTon <= 2) lowStockCount++;
        });

        const success = customerCount >= 6 && orderCount >= 13 && lowStockCount === 0;
        console.log('\nFinal Verification Result:', success ? 'SUCCESS' : 'FAILURE');

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

verify();
