const { PhieuBaoHanh } = require('./src/models/index');

async function listAllTickets() {
    try {
        const tickets = await PhieuBaoHanh.findAll({
            attributes: ['maPbh', 'soSerial', 'ngayLap', 'ngayTraMay', 'maNvKyThuat', 'trangThai'],
            raw: true,
            order: [['soSerial', 'ASC']]
        });
        console.log('--- All Warranty Tickets ---');
        tickets.forEach(t => {
            console.log(`ID: ${t.maPbh}, SN: ${t.soSerial}, Tech: ${t.maNvKyThuat}, Status: ${t.trangThai}, Return: ${t.ngayTraMay}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listAllTickets();
