const { DongMay, ChiTietMay, sequelize } = require('../models');

async function syncStock() {
    try {
        console.log('Starting full stock synchronization...');
        const models = await DongMay.findAll();
        
        for (const model of models) {
            const actualCount = await ChiTietMay.count({
                where: {
                    maModel: model.maModel,
                    trangThai: 'Trong kho'
                }
            });
            
            if (model.soLuongTon !== actualCount) {
                console.log(`Model ${model.maModel}: Updating soLuongTon from ${model.soLuongTon} to ${actualCount}`);
                await model.update({ soLuongTon: actualCount });
            }
        }
        console.log('Stock synchronization completed!');
        process.exit(0);
    } catch (error) {
        console.error('Error during sync:', error);
        process.exit(1);
    }
}

syncStock();
