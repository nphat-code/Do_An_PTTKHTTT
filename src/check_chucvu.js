const { ChucVu } = require('./models');

async function checkData() {
    try {
        const count = await ChucVu.count();
        const data = await ChucVu.findAll();
        console.log(`ChucVu record count: ${count}`);
        console.log('Current ChucVu data:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error checking ChucVu data:', err);
    } finally {
        process.exit();
    }
}

checkData();
