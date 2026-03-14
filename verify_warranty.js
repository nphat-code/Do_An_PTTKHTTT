const { DongMay, LinhKien, LinhKienTuongThich } = require('./src/models');
const fs = require('fs');

async function verify() {
    try {
        const models = await DongMay.findAll();
        const componentTypes = ["RAM", "SSD", "Màn hình", "Pin", "Bàn phím", "Sạc"];
        const report = [];

        for (const model of models) {
            const links = await LinhKienTuongThich.findAll({
                where: { maModel: model.maModel },
                include: [{ model: LinhKien }]
            });

            const types = links.map(l => l.LinhKien.loaiLk);
            const missing = componentTypes.filter(t => !types.includes(t));

            report.push({
                model: model.maModel,
                hasAll: missing.length === 0,
                missing
            });
        }

        const allGood = report.every(r => r.hasAll);
        console.log('Final Verification Result:', allGood ? 'SUCCESS' : 'FAILURE');
        if (!allGood) {
            console.log('Missing Details:', JSON.stringify(report.filter(r => !r.hasAll), null, 2));
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

verify();
