const { ChiTietMay, PhieuBaoHanh, DongMay } = require('./src/models/index');

async function debugData() {
    try {
        console.log('--- ChiTietMay Status Counts ---');
        const ctCounts = await ChiTietMay.count({ group: ['trangThai'] });
        ctCounts.forEach(c => console.log(`${c.trangThai}: ${c.count}`));

        console.log('\n--- PhieuBaoHanh Total Count ---');
        const pbhCount = await PhieuBaoHanh.count();
        console.log(`Total tickets: ${pbhCount}`);

        console.log('\n--- Serial Number Match Check ---');
        const pbhSerials = await PhieuBaoHanh.findAll({ attributes: ['soSerial'], raw: true });
        const pbhSnList = pbhSerials.map(p => p.soSerial);

        for (const sn of pbhSnList) {
            const machine = await ChiTietMay.findOne({ where: { soSerial: sn }, attributes: ['soSerial', 'trangThai'] });
            if (machine) {
                console.log(`Match Found: SN=${sn}, Status=${machine.trangThai}`);
            } else {
                console.log(`NO MATCH: SN=${sn} not found in ChiTietMay table`);
            }
        }

        console.log('\n--- ModelStats Check ---');
        const modelStats = await DongMay.findAll({
            include: [{
                model: ChiTietMay,
                attributes: ['trangThai', 'soSerial']
            }]
        });
        console.log(`Total Models: ${modelStats.length}`);
        modelStats.forEach(m => {
            const items = m.ChiTietMays || [];
            if (items.length > 0) {
                const sold = items.filter(s => s.trangThai === 'Đã bán').length;
                const repair = items.filter(s => s.trangThai === 'Đang bảo hành').length;
                console.log(`Model: ${m.maModel}, Items: ${items.length}, Sold: ${sold}, Repair: ${repair}`);
            }
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugData();
