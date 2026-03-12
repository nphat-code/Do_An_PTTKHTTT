const { HangSanXuat } = require('./src/models');
const fs = require('fs');

async function inspect() {
    try {
        const brands = await HangSanXuat.findAll();

        fs.writeFileSync('all_brands.json', JSON.stringify(brands, null, 2));
        console.log('Saved to all_brands.json');
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

inspect();
