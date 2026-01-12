const { sequelize, User } = require('./models/index');
const bcrypt = require('bcryptjs');

const fixUsers = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB...');

        // Ensure table is updated first
        await sequelize.sync({ alter: true });
        console.log('Database synced.');

        const users = await User.findAll({ where: { password: null } });
        console.log(`Found ${users.length} users without password.`);

        if (users.length > 0) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('123456', salt);

            for (const user of users) {
                user.password = hashedPassword;
                user.role = 'customer'; // Default role
                await user.save();
                console.log(`Updated user ${user.email}`);
            }
        }

        console.log('Done!');
        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixUsers();
