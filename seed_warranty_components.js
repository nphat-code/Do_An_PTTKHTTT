const {
    DongMay,
    LinhKien,
    LinhKienTuongThich,
    PhieuNhap,
    CtNhapLk,
    KhoLinhKien,
    sequelize
} = require('./src/models');

async function seed() {
    const transaction = await sequelize.transaction();
    try {
        const models = await DongMay.findAll();
        const componentTypes = ["RAM", "SSD", "Màn hình", "Pin", "Bàn phím", "Sạc"];
        const maKho = 'KHO_TT';

        async function getOrCreateComponent(type, brandId, brandName) {
            let maLk, tenLk, giaNhap;
            if (type === 'RAM') {
                maLk = 'RAM_16GB_DDR5';
                tenLk = 'RAM 16GB DDR5 5600MHz';
                giaNhap = 1500000;
            } else if (type === 'SSD') {
                maLk = 'SSD_512GB_NVME';
                tenLk = 'SSD 512GB NVMe Gen 4';
                giaNhap = 1200000;
            } else {
                maLk = `${type.toUpperCase().replace(/\s/g, '_')}_${brandId}`;
                tenLk = `${type} ${brandName}`;
                giaNhap = 800000;
                if (type === 'Màn hình') giaNhap = 3000000;
                if (type === 'Pin') giaNhap = 1000000;
                if (type === 'Bàn phím') giaNhap = 500000;
                if (type === 'Sạc') giaNhap = 400000;
            }

            let component = await LinhKien.findByPk(maLk, { transaction });
            if (!component) {
                component = await LinhKien.create({
                    maLk, tenLk, loaiLk: type, giaNhap, maHang: brandId, soLuongTon: 0
                }, { transaction });
            }
            return component;
        }

        const maPn = `PN_W_${Date.now().toString().slice(-10)}`;
        const phieuNhap = await PhieuNhap.create({
            maPn, ngayNhap: new Date(), maNcc: 'NCC001', maNv: 'NV001', maKho, tongTien: 0, maHttt: 'TM'
        }, { transaction });

        const componentsToLink = new Set();
        for (const model of models) {
            for (const type of componentTypes) {
                const existingLinks = await LinhKienTuongThich.findAll({
                    where: { maModel: model.maModel },
                    include: [{ model: LinhKien, where: { loaiLk: type } }],
                    transaction
                });

                if (existingLinks.length === 0) {
                    const component = await getOrCreateComponent(type, model.maHang, model.maHang);
                    await LinhKienTuongThich.findOrCreate({
                        where: { maModel: model.maModel, maLk: component.maLk },
                        defaults: { ghiChu: 'Tự động thêm cho bảo hành' },
                        transaction
                    });
                    componentsToLink.add(component.maLk);
                }
            }
        }

        let totalAmount = 0;
        for (const maLk of componentsToLink) {
            const comp = await LinhKien.findByPk(maLk, { transaction });
            const quantity = 10;

            await CtNhapLk.create({ maPn, maLk, soLuong: quantity, donGia: comp.giaNhap }, { transaction });

            let khoLk = await KhoLinhKien.findOne({ where: { maKho, maLk }, transaction });
            if (!khoLk) {
                await KhoLinhKien.create({ maKho, maLk, soLuongTon: quantity }, { transaction });
            } else {
                await KhoLinhKien.update(
                    { soLuongTon: khoLk.soLuongTon + quantity },
                    { where: { maKho, maLk }, transaction }
                );
            }
            await comp.increment('soLuongTon', { by: quantity, transaction });

            totalAmount += parseFloat(comp.giaNhap) * quantity;
        }

        await phieuNhap.update({ tongTien: totalAmount }, { transaction });
        await transaction.commit();
        console.log('Seeding completed successfully.');
        process.exit(0);
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
