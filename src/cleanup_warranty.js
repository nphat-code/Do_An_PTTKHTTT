const { PhieuBaoHanh, ChiTietSuaChua } = require('./models');
const sequelize = require('./config/database');

const cleanWarranties = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB...');

        const warranties = await PhieuBaoHanh.findAll({
            include: [{
                model: ChiTietSuaChua,
                required: false
            }]
        });

        const toDelete = warranties.filter(w => !w.ChiTietSuaChuas || w.ChiTietSuaChuas.length === 0);

        console.log(`Found ${toDelete.length} warranty certificates without repair details.`);

        for (const w of toDelete) {
            console.log(`Deleting: ${w.maPbh}`);
            await w.destroy();
        }

        console.log('✅ Clean-up successful!');
        process.exit();
    } catch (error) {
        console.error('Clean-up Failed:', error);
        process.exit(1);
    }
};

cleanWarranties();
