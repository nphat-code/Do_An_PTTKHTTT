const { sequelize } = require('./models/index');

const syncDb = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB...');

        const { ImportReceiptItem } = require('./models/index');
        console.log('Force syncing ImportReceiptItem...');
        await ImportReceiptItem.sync({ force: true });

        await sequelize.sync({ alter: true });
        console.log('✅ Sync complete!');

        const [results, metadata] = await sequelize.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema'");
        console.log('Tables:', results.map(r => r.tablename));
    } catch (error) {
        console.error('❌ Sync failed:', error);
    } finally {
        process.exit();
    }
};

syncDb();
