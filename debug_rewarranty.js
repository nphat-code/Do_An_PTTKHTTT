const { PhieuBaoHanh, ChiTietMay, DongMay } = require('./src/models/index');

async function debugRewarranty() {
    try {
        console.log('--- Machines with Multiple Claims ---');
        const pbhEntries = await PhieuBaoHanh.findAll({
            attributes: ['soSerial', 'ngayLap', 'maNv'],
            raw: true,
            order: [['soSerial', 'ASC'], ['ngayLap', 'ASC']]
        });

        const serialMap = {};
        pbhEntries.forEach(p => {
            if (!serialMap[p.soSerial]) serialMap[p.soSerial] = [];
            serialMap[p.soSerial].push(p);
        });

        let totalReworks = 0;
        for (const [sn, tickets] of Object.entries(serialMap)) {
            if (tickets.length > 1) {
                console.log(`SN: ${sn} has ${tickets.length} claims:`);
                tickets.forEach((t, i) => console.log(`  ${i + 1}. Date: ${t.ngayLap}, Tech: ${t.maNv}`));
                totalReworks += (tickets.length - 1);
            }
        }
        console.log(`\nTotal Repeat Claims: ${totalReworks}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugRewarranty();
