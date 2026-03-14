const { PhieuNhap } = require('./src/models');

async function updateNote() {
    try {
        const latestPn = await PhieuNhap.findOne({
            where: { maKho: 'KHO_TT' },
            order: [['ngayNhap', 'ASC']] // Get the first one
        });

        if (latestPn) {
            console.log('Found PhieuNhap:', latestPn.maPn);
            await latestPn.update({ ghiChu: 'Nhập kho linh kiện bảo hành ban đầu cho Kho Trung Tâm.' });
            console.log('Updated ghiChu successfully.');
        } else {
            console.log('No PhieuNhap found for KHO_TT.');
        }
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

updateNote();
