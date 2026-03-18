const { PhieuBaoHanh } = require('./src/models/index');

async function analyzeReworks() {
    try {
        const allTickets = await PhieuBaoHanh.findAll({
            attributes: ['maPbh', 'soSerial', 'ngayLap', 'ngayTraMay', 'maNvKyThuat', 'trangThai'],
            raw: true,
            order: [['ngayLap', 'ASC']]
        });

        console.log(`Total Tickets: ${allTickets.length}`);

        const serialMap = {};
        allTickets.forEach(t => {
            if (!serialMap[t.soSerial]) serialMap[t.soSerial] = [];
            serialMap[t.soSerial].push(t);
        });

        let reworks = [];
        allTickets.forEach(p => {
            // A ticket is a "source" of rework if it is finished
            if (['Đã xong', 'Đã trả máy'].includes(p.trangThai)) {
                // We should use ngayTraMay, but if null, let's see why
                const baseDate = p.ngayTraMay ? new Date(p.ngayTraMay) : null;

                if (!baseDate) {
                    console.log(`[WARNING] Ticket ${p.maPbh} is ${p.trangThai} but has NO ngayTraMay`);
                    return;
                }

                const thirtyDaysAfter = new Date(baseDate);
                thirtyDaysAfter.setDate(thirtyDaysAfter.getDate() + 30);

                const nextTickets = serialMap[p.soSerial].filter(other =>
                    other.maPbh !== p.maPbh &&
                    new Date(other.ngayLap) > baseDate &&
                    new Date(other.ngayLap) <= thirtyDaysAfter
                );

                if (nextTickets.length > 0) {
                    reworks.push({
                        source: p,
                        follows: nextTickets
                    });
                }
            }
        });

        console.log(`\nFound ${reworks.length} rework instances:`);
        reworks.forEach(r => {
            console.log(`- Source: ${r.source.maPbh} (Tech: ${r.source.maNvKyThuat})`);
            r.follows.forEach(f => {
                console.log(`  -> Followed by: ${f.maPbh} (Tech: ${f.maNvKyThuat}) on ${f.ngayLap}`);
            });
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

analyzeReworks();
