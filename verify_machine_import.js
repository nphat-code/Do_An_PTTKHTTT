const { ChiTietMay, DongMay, PhieuNhap, CtNhapMay } = require('./src/models');

async function verify() {
    try {
        const models = await DongMay.findAll();
        console.log('--- Machine Stock Verification ---');

        let allGood = true;
        for (const model of models) {
            const detailsCount = await ChiTietMay.count({ where: { maModel: model.maModel, maKho: 'KHO_Q1' } });
            console.log(`${model.tenModel}: ${detailsCount} units in KHO_Q1 (Total soLuongTon: ${model.soLuongTon})`);
            if (detailsCount < 5) allGood = false;
        }

        const latestPn = await PhieuNhap.findOne({
            where: { maKho: 'KHO_Q1', maNv: 'NV002' },
            order: [['ngayNhap', 'DESC']]
        });

        console.log('\n--- Receipt Verification ---');
        console.log('Latest Import Receipt for KHO_Q1:', latestPn ? latestPn.maPn : 'MISSING');
        if (latestPn) {
            console.log(`  Ghi chú: ${latestPn.ghiChu}`);
            console.log(`  Tổng tiền: ${latestPn.tongTien}`);
        } else {
            allGood = false;
        }

        console.log('\nFinal Verification Result:', allGood ? 'SUCCESS' : 'FAILURE');
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

verify();
