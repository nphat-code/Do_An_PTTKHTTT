const { DongMay, ChiTietMay } = require('../models/index');

async function check() {
    try {
        const models = await DongMay.findAll();
        let found = false;
        for (const m of models) {
            const count = await ChiTietMay.count({ where: { maModel: m.maModel, trangThai: 'Trong kho' } });
            if (m.soLuongTon !== count) {
                console.log(`Mismatch: ${m.tenModel} [${m.maModel}] | soLuongTon: ${m.soLuongTon} | Actual (Trong kho): ${count}`);
                found = true;
            }
        }
        if (!found) {
            console.log('No mismatches found.');
        }
    } catch (error) {
        console.error('Error checking inventory:', error);
    } finally {
        process.exit();
    }
}

check();
