const { PhieuBaoHanh, ChiTietMay, DongMay } = require('./src/models/index');

async function debug() {
    try {
        const pbhs = await PhieuBaoHanh.findAll({ attributes: ['soSerial', 'loaiPhieu', 'trangThai'] });
        console.log(`Total Tickets: ${pbhs.length}`);
        
        const serials = await ChiTietMay.findAll({ attributes: ['soSerial', 'trangThai', 'maModel'] });
        console.log(`Total Serials: ${serials.length}`);
        
        const models = await DongMay.findAll({ attributes: ['maModel', 'tenModel'] });
        console.log(`Total Models: ${models.length}`);

        // Check if any serial in PhieuBaoHanh exists in ChiTietMay
        const pbhSerials = pbhs.map(p => p.soSerial);
        const ctSerials = serials.map(s => s.soSerial);
        const matches = pbhSerials.filter(s => ctSerials.includes(s));
        console.log(`Matching Serials (found in both): ${matches.length}`);

        const serialFailMap = {};
        pbhs.forEach(p => {
            serialFailMap[p.soSerial] = (serialFailMap[p.soSerial] || 0) + 1;
        });

        for (const m of models) {
            const mSerials = serials.filter(s => s.maModel === m.maModel);
            const activeSerials = mSerials.filter(s => ['Đã bán', 'Đang bảo hành'].includes(s.trangThai));
            let totalClaims = 0;
            activeSerials.forEach(s => {
                totalClaims += (serialFailMap[s.soSerial] || 0);
            });
            if (activeSerials.length > 0 || totalClaims > 0) {
                console.log(`Model ${m.maModel}: Active=${activeSerials.length}, Claims=${totalClaims}, Rate=${activeSerials.length > 0 ? (totalClaims/activeSerials.length*100).toFixed(2) : 0}%`);
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

debug();
