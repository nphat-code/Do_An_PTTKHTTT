const { DongMay } = require('./src/models');
const fs = require('fs');

async function listModels() {
    try {
        const models = await DongMay.findAll();
        const result = models.map(m => ({
            maModel: m.maModel,
            tenModel: m.tenModel,
            giaNhap: m.giaNhap
        }));
        fs.writeFileSync('models_for_import.json', JSON.stringify(result, null, 2));
        console.log('Saved to models_for_import.json');
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

listModels();
