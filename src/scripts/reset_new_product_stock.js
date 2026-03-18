const { DongMay } = require('../models/index');

async function resetStock() {
    try {
        const targetModels = [
            'DELL-XPS-9320',
            'ASUS-ROG-G614',
            'HP-VICTUS-16',
            'LENOVO-T14-G4',
            'APPLE-MBA-M3',
            'ACER-NITRO-AN515'
        ];

        console.log(`Resetting stock for ${targetModels.length} models...`);

        const [affectedCount] = await DongMay.update(
            { soLuongTon: 0 },
            { where: { maModel: targetModels } }
        );

        console.log(`Successfully reset stock to 0 for ${affectedCount} models.`);
    } catch (error) {
        console.error('Error resetting stock:', error);
    } finally {
        process.exit();
    }
}

resetStock();
