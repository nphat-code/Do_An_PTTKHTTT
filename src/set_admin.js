const { sequelize, User } = require('./models/index');
const email = process.argv[2];

if (!email) {
    console.log("Vui lòng cung cấp email: node src/set_admin.js <email>");
    process.exit(1);
}

const setAdmin = async () => {
    try {
        await sequelize.authenticate();
        console.log('Đang kết nối Database...');

        const user = await User.findOne({ where: { email } });
        if (!user) {
            console.log(`Không tìm thấy user với email: ${email}`);
            process.exit(1);
        }

        user.role = 'admin';
        await user.save();

        console.log(`-------------------------------------------`);
        console.log(`✅ Thành công! User ${email} đã thành Admin.`);
        console.log(`-------------------------------------------`);
        process.exit();
    } catch (error) {
        console.error('Lỗi:', error);
        process.exit(1);
    }
};

setAdmin();
