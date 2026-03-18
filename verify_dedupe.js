const { NhanVien, PhieuBaoHanh } = require('./src/models/index');

async function verifyCaseDeduplication() {
    try {
        const staff = await NhanVien.findAll({
            distinct: true,
            include: [{ model: PhieuBaoHanh, as: 'PhieuSuaChua' }]
        });

        console.log('--- Final Case Deduplication Verification ---');
        staff.forEach(nv => {
            if (nv.maNv === 'NV005') {
                const rawTickets = nv.PhieuSuaChua || [];

                // My new logic: Deduplicate by maPbh first
                const uniqueById = [];
                const ids = new Set();
                rawTickets.forEach(t => {
                    if (!ids.has(t.maPbh)) {
                        ids.add(t.maPbh);
                        uniqueById.push(t);
                    }
                });

                // Then deduplicate by Serial + Date (Repair Cases)
                const casesMap = {};
                uniqueById.forEach(t => {
                    const dateKey = new Date(t.ngayLap).toISOString().split('T')[0];
                    const caseKey = `${t.soSerial}_${dateKey}`;
                    if (!casesMap[caseKey]) {
                        casesMap[caseKey] = t.maPbh;
                    }
                });

                const casesCount = Object.keys(casesMap).length;
                console.log(`Tech: ${nv.hoTen} (${nv.maNv})`);
                console.log(`  Raw Join Tickets: ${rawTickets.length}`);
                console.log(`  Unique Tickets (ID): ${uniqueById.length}`);
                console.log(`  Repair Cases (Serial+Date): ${casesCount}`);

                // Rework = Total Cases - Unique Serials
                const serMap = new Set();
                Object.keys(casesMap).forEach(k => serMap.add(k.split('_')[0]));
                const rework = casesCount - serMap.size;
                console.log(`  Deduplicated Reworks: ${rework}`);
            }
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verifyCaseDeduplication();
