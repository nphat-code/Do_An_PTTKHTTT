const { PhieuBaoHanh, NhanVien } = require('./src/models/index');

async function debugStrings() {
    try {
        const tickets = await PhieuBaoHanh.findAll({ raw: true });
        tickets.forEach(t => {
            console.log(`Ticket: [${t.maPbh}]`);
            console.log(`  Status: [${t.trangThai}] (Length: ${t.trangThai?.length})`);
            console.log(`  Serial: [${t.soSerial}] (Length: ${t.soSerial?.length})`);

            const isFinished = ['Đã xong', 'Đã trả máy'].includes(t.trangThai);
            console.log(`  isFinished match: ${isFinished}`);

            if (!isFinished) {
                // Check for common issues like leading/trailing spaces or different encodings
                console.log(`  Trimmed Match: ${['Đã xong', 'Đã trả máy'].includes(t.trangThai?.trim())}`);
                for (let i = 0; i < t.trangThai?.length; i++) {
                    console.log(`    Char ${i}: ${t.trangThai[i]} (Code: ${t.trangThai.charCodeAt(i)})`);
                }
            }
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugStrings();
