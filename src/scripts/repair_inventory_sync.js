const { DongMay, ChiTietMay, HoaDon, sequelize } = require('../models/index');
const { Op } = require('sequelize');

async function repair() {
    const t = await sequelize.transaction();
    try {
        console.log('--- REPAIRING INVENTORY SYNC ---');

        // 1. Reclaim serials from cancelled orders
        const cancelledOrders = await HoaDon.findAll({ where: { trangThai: 'Đã hủy' }, transaction: t });
        console.log(`Found ${cancelledOrders.length} cancelled orders.`);

        for (const order of cancelledOrders) {
            const serials = await ChiTietMay.findAll({
                where: { maHd: order.maHd, trangThai: 'Đã bán' },
                transaction: t
            });

            if (serials.length > 0) {
                console.log(`- Order ${order.maHd}: Reclaiming ${serials.length} serials.`);
                await ChiTietMay.update(
                    { trangThai: 'Trong kho', maHd: null },
                    { where: { maHd: order.maHd }, transaction: t }
                );
            }
        }

        // 2. Harmonize soLuongTon based on actual ChiTietMay count
        const models = await DongMay.findAll({ transaction: t });
        console.log(`Synchronizing stock for ${models.length} models...`);

        for (const m of models) {
            const actualCount = await ChiTietMay.count({
                where: { maModel: m.maModel, trangThai: 'Trong kho' },
                transaction: t
            });

            if (m.soLuongTon !== actualCount) {
                console.log(`- ${m.tenModel} [${m.maModel}]: ${m.soLuongTon} -> ${actualCount}`);
                await m.update({ soLuongTon: actualCount }, { transaction: t });
            }
        }

        await t.commit();
        console.log('--- REPAIR COMPLETED SUCCESSFULLY ---');
    } catch (error) {
        if (t) await t.rollback();
        console.error('Repair failed:', error);
    } finally {
        process.exit();
    }
}

repair();
