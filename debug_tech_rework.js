const { PhieuBaoHanh, NhanVien } = require('./src/models/index');
const { Op } = require('sequelize');

async function debugTechRework() {
    try {
        console.log('--- Technical Performance Debug ---');

        // 1. Get all tickets to have a global view
        const allTickets = await PhieuBaoHanh.findAll({
            attributes: ['maPbh', 'soSerial', 'ngayLap', 'ngayTraMay', 'maNvKyThuat', 'trangThai'],
            raw: true
        });
        console.log(`Total tickets: ${allTickets.length}`);

        // 2. Identify reworks globally
        const serialMap = {};
        allTickets.forEach(t => {
            if (!serialMap[t.soSerial]) serialMap[t.soSerial] = [];
            serialMap[t.soSerial].push(t);
        });

        const reworkTickets = [];
        allTickets.forEach(p => {
            if (p.ngayTraMay) {
                const pFinish = new Date(p.ngayTraMay);
                const thirtyDaysAfter = new Date(pFinish);
                thirtyDaysAfter.setDate(thirtyDaysAfter.getDate() + 30);

                const nextTickets = serialMap[p.soSerial].filter(otherP =>
                    otherP.maPbh !== p.maPbh &&
                    new Date(otherP.ngayLap) > pFinish &&
                    new Date(otherP.ngayLap) <= thirtyDaysAfter
                );

                if (nextTickets.length > 0) {
                    console.log(`Rework Found!`);
                    console.log(`  Source Ticket: ${p.maPbh}, SN: ${p.soSerial}, Tech: ${p.maNvKyThuat}, Finished: ${p.ngayTraMay}`);
                    console.log(`  Follow-up Tickets: ${nextTickets.map(nt => `${nt.maPbh} (${nt.ngayLap})`).join(', ')}`);
                    reworkTickets.push(p);
                }
            } else {
                console.log(`Ticket ${p.maPbh} has no ngayTraMay (Status: ${p.trangThai})`);
            }
        });

        console.log(`\nGlobal Rework Count: ${reworkTickets.length}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugTechRework();
