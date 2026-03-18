const { NhanVien, PhieuBaoHanh, HoaDon } = require('./src/models/index');
const { Op } = require('sequelize');

async function debugPerformance() {
    try {
        const staff = await NhanVien.findAll({
            distinct: true,
            include: [
                {
                    model: PhieuBaoHanh,
                    as: 'PhieuSuaChua',
                    attributes: ['maPbh', 'trangThai'],
                    required: false
                }
            ]
        });

        console.log('--- Staff Duplication Check ---');
        const maNvMap = {};
        staff.forEach(nv => {
            if (!maNvMap[nv.maNv]) maNvMap[nv.maNv] = 0;
            maNvMap[nv.maNv]++;
        });

        Object.keys(maNvMap).forEach(maNv => {
            if (maNvMap[maNv] > 1) {
                console.log(`WARNING: maNv ${maNv} appears ${maNvMap[maNv]} times in findAll result!`);
            }
        });

        console.log('\n--- Technician Ticket Counts ---');
        staff.forEach(nv => {
            const rawTickets = nv.PhieuSuaChua || [];
            if (rawTickets.length > 0) {
                const ticketIds = new Set();
                rawTickets.forEach(t => ticketIds.add(t.maPbh));
                console.log(`Tech: ${nv.hoTen} (${nv.maNv}) | Raw: ${rawTickets.length} | Unique: ${ticketIds.size}`);
                if (rawTickets.length !== ticketIds.size) {
                    console.log(`  -> Duplicate IDs detected: ${rawTickets.map(t => t.maPbh).join(', ')}`);
                }
            }
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugPerformance();
