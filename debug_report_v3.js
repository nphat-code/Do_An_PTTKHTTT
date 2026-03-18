const { ChiTietMay, PhieuBaoHanh, DongMay } = require('./src/models/index');

async function debugReportLogic() {
    try {
        console.log('--- Model-wise Warranty Data ---');

        // 1. Get all serial numbers in warranty tickets
        const pbhSerials = await PhieuBaoHanh.findAll({
            attributes: ['soSerial'],
            raw: true
        });
        const claimSerialSet = new Set(pbhSerials.map(p => p.soSerial));
        console.log(`Unique serials in claims: ${claimSerialSet.size}`);
        console.log('Claim serials:', Array.from(claimSerialSet));

        // 2. Get all models and their items
        const models = await DongMay.findAll({
            include: [{
                model: ChiTietMay,
                attributes: ['soSerial', 'trangThai']
            }]
        });

        models.forEach(m => {
            const items = m.ChiTietMays || [];
            if (items.length === 0) return;

            const soldItems = items.filter(s => s.trangThai === 'Đã bán');
            const soldCount = soldItems.length;

            // Count how many items of this model have at least one claim
            const claimedCount = items.filter(s => claimSerialSet.has(s.soSerial)).length;

            if (claimedCount > 0 || soldCount > 0) {
                console.log(`Model: ${m.tenModel} (${m.maModel})`);
                console.log(`  Total Items: ${items.length}`);
                console.log(`  Sold Count: ${soldCount}`);
                console.log(`  Claimed Count (any status): ${claimedCount}`);
                const rate = soldCount > 0 ? (claimedCount / soldCount) * 100 : 0;
                console.log(`  Calculated Rate: ${rate.toFixed(2)}%`);
            }
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugReportLogic();
