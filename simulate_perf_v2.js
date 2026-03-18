const { PhieuBaoHanh, NhanVien } = require('./src/models/index');
const { Op } = require('sequelize');
const fs = require('fs');

async function simulatePerformanceReport() {
    let output = '--- Simulating getPerformanceAnalytics ---\n';
    try {
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

        output += `Found ${staff.length} staff members.\n`;
        output += `Found ${allTickets.length} total tickets in global map.\n`;

        staff.forEach(nv => {
            const tickets = nv.PhieuSuaChua || [];
            if (tickets.length === 0) return;

            output += `\nTechnician: ${nv.hoTen} (${nv.maNv})\n`;
            output += `  Tickets count: ${tickets.length}\n`;

            let reworkCount = 0;
            tickets.forEach(p => {
                output += `    Checking Ticket: ${p.maPbh}, Status: [${p.trangThai}], SN: [${p.soSerial}]\n`;

                const isFinished = ['Đã xong', 'Đã trả máy'].includes(p.trangThai);
                if (isFinished) {
                    const finishDate = p.ngayTraMay ? new Date(p.ngayTraMay) : new Date(p.ngayLap);
                    const thirtyDaysAfter = new Date(finishDate);
                    thirtyDaysAfter.setDate(thirtyDaysAfter.getDate() + 30);

                    output += `      Finish: ${finishDate.toISOString()}, Rework Deadline: ${thirtyDaysAfter.toISOString()}\n`;

                    const candidates = globalSerialMap[p.soSerial] || [];
                    output += `      Found ${candidates.length} global tickets for SN ${p.soSerial}\n`;

                    const followUps = candidates.filter(otherP => {
                        const otherDate = new Date(otherP.ngayLap);
                        const isOther = otherP.maPbh !== p.maPbh;
                        const isAfter = otherDate > finishDate;
                        const isWithin30 = otherDate <= thirtyDaysAfter;

                        if (isOther) {
                            output += `        Comparing with: ${otherP.maPbh}, Date: ${otherDate.toISOString()}\n`;
                            output += `          isAfter: ${isAfter}, isWithin30: ${isWithin30}\n`;
                        }

                        return isOther && isAfter && isWithin30;
                    });

                    if (followUps.length > 0) {
                        output += `      !!! REWORK DETECTED for ${p.maPbh} !!!\n`;
                        reworkCount++;
                    }
                } else {
                    output += `      Skipping: status [${p.trangThai}] is not in ['Đã xong', 'Đã trả máy']\n`;
                }
            });

            output += `  Final Rework Count for ${nv.hoTen}: ${reworkCount}\n`;
        });

        fs.writeFileSync('simulate_output.txt', output, 'utf8');
        console.log('Simulation complete. Check simulate_output.txt');
        process.exit(0);
    } catch (err) {
        fs.writeFileSync('simulate_output.txt', output + '\nERROR: ' + err.message, 'utf8');
        console.error(err);
        process.exit(1);
    }
}

simulatePerformanceReport();
