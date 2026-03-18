const { ChiTietMay, PhieuBaoHanh } = require('./src/models/index');

async function debugData() {
    try {
        const ctCounts = await ChiTietMay.count({ group: ['trangThai'] });
        console.log('ChiTietMay statuses:', ctCounts);

        const pbhEntries = await PhieuBaoHanh.findAll({ attributes: ['soSerial'] });
        console.log('PhieuBaoHanh Serial numbers count:', pbhEntries.length);
        console.log('Sample PBH Serial numbers:', pbhEntries.slice(0, 5).map(p => p.soSerial));

        const sampleSerials = await ChiTietMay.findAll({
            attributes: ['soSerial', 'trangThai'],
            limit: 5
        });
        console.log('Sample ChiTietMay Serial numbers:', sampleSerials.map(s => ({ sn: s.soSerial, st: s.trangThai })));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugData();
