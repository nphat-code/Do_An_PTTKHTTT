const { PhieuBaoHanh, NhanVien } = require('./src/models/index');
const { Op } = require('sequelize');

async function simulatePerformanceReport() {
    try {
        console.log('--- Simulating getPerformanceAnalytics ---');

        // Match the logic in report.controller.js
        const staff = await NhanVien.findAll({
            include: [
                {
                    model: PhieuBaoHanh,
                    as: 'PhieuSuaChua',
                    attributes: ['maPbh', 'trangThai', 'ngayTraMay', 'soSerial', 'ngayLap'],
                    required: false
                }
            ]
        });

        const allTickets = await PhieuBaoHanh.findAll({
            attributes: ['maPbh', 'soSerial', 'ngayLap', 'ngayTraMay', 'maNvKyThuat', 'trangThai'],
            raw: true
        });

        const globalSerialMap = {};
        allTickets.forEach(t => {
            if (!globalSerialMap[t.soSerial]) globalSerialMap[t.soSerial] = [];
            globalSerialMap[t.soSerial].push(t);
        });

        console.log(`Found ${staff.length} staff members.`);
        console.log(`Found ${allTickets.length} total tickets in global map.`);

        staff.forEach(nv => {
            const tickets = nv.PhieuSuaChua || [];
            if (tickets.length === 0) return;

            console.log(`\nTechnician: ${nv.hoTen} (${nv.maNv})`);
            console.log(`  Tickets count: ${tickets.length}`);

            let reworkCount = 0;
            tickets.forEach(p => {
                console.log(`    Checking Ticket: ${p.maPbh}, Status: ${p.trangThai}, SN: ${p.soSerial}`);

                if (['Đã xong', 'Đã trả máy'].includes(p.trangThai)) {
                    const finishDate = p.ngayTraMay ? new Date(p.ngayTraMay) : new Date(p.ngayLap);
                    const thirtyDaysAfter = new Date(finishDate);
                    thirtyDaysAfter.setDate(thirtyDaysAfter.getDate() + 30);

                    console.log(`      Finish: ${finishDate.toISOString()}, Rework Deadline: ${thirtyDaysAfter.toISOString()}`);

                    const candidates = globalSerialMap[p.soSerial] || [];
                    console.log(`      Found ${candidates.length} global tickets for SN ${p.soSerial}`);

                    const followUps = candidates.filter(otherP => {
                        const otherDate = new Date(otherP.ngayLap);
                        const isOther = otherP.maPbh !== p.maPbh;
                        const isAfter = otherDate > finishDate;
                        const isWithin30 = otherDate <= thirtyDaysAfter;

                        if (isOther) {
                            console.log(`        Comparing with: ${otherP.maPbh}, Date: ${otherDate.toISOString()}`);
                            console.log(`          isAfter: ${isAfter}, isWithin30: ${isWithin30}`);
                        }

                        return isOther && isAfter && isWithin30;
                    });

                    if (followUps.length > 0) {
                        console.log(`      !!! REWORK DETECTED for ${p.maPbh} !!!`);
                        reworkCount++;
                    }
                } else {
                    console.log(`      Skipping: status is not finished.`);
                }
            });

            console.log(`  Final Rework Count for ${nv.hoTen}: ${reworkCount}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

simulatePerformanceReport();
