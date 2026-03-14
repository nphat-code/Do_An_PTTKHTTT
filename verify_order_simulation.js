const { KhachHang, HoaDon, CtHoaDon, ChiTietMay, DongMay } = require('./src/models');

async function verify() {
    try {
        const customer = await KhachHang.findByPk('KH001');
        const order = await HoaDon.findOne({
            where: { maKh: 'KH001' },
            order: [['ngayLap', 'DESC']]
        });

        console.log('--- Customer & Order Verification ---');
        console.log('Customer KH001:', customer ? 'EXISTS' : 'MISSING');
        console.log('Order for KH001:', order ? order.maHd : 'MISSING');

        if (order) {
            const details = await CtHoaDon.findAll({ where: { maHd: order.maHd } });
            console.log('Order Details Count:', details.length);

            const machinesSold = await ChiTietMay.findAll({ where: { maHd: order.maHd, trangThai: 'Đã bán' } });
            console.log('Individual Machines marked "Đã bán":', machinesSold.length);

            for (const machine of machinesSold) {
                console.log(`  Serial: ${machine.soSerial}, Model: ${machine.maModel}`);
            }
        }

        const success = customer && order && order.tongTien > 0;
        console.log('\nFinal Verification Result:', success ? 'SUCCESS' : 'FAILURE');

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

verify();
