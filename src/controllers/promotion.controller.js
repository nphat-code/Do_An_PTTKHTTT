const { ChuongTrinhKm, DongMayKm, DongMay, sequelize } = require('../models/index');
const { Op } = require('sequelize');

const getAllPromotions = async (req, res) => {
    try {
        const promotions = await ChuongTrinhKm.findAll({
            include: [{ 
                model: DongMay, 
                attributes: ['maModel', 'tenModel'],
                through: { attributes: [] } 
            }],
            order: [['maKm', 'ASC']]
        });
        res.json({ success: true, data: promotions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getPromotionById = async (req, res) => {
    try {
        const promo = await ChuongTrinhKm.findByPk(req.params.id, {
            include: [{ model: DongMay, through: { attributes: [] } }]
        });
        if (!promo) return res.status(404).json({ success: false, message: "Không tìm thấy chương trình khuyến mãi" });
        res.json({ success: true, data: promo });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createPromotion = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { modelIds, ...promoData } = req.body;
        const promo = await ChuongTrinhKm.create(promoData, { transaction: t });

        if (modelIds && Array.isArray(modelIds) && modelIds.length > 0) {
            const links = modelIds.map(id => ({
                maKm: promo.maKm,
                maModel: id,
                ngayThem: new Date()
            }));
            await DongMayKm.bulkCreate(links, { transaction: t });
        }

        await t.commit();
        res.status(201).json({ success: true, message: "Đã tạo chương trình khuyến mãi mới", data: promo });
    } catch (error) {
        if (t) await t.rollback();
        res.status(400).json({ success: false, message: error.message });
    }
};

const updatePromotion = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { modelIds, ...promoData } = req.body;
        const promo = await ChuongTrinhKm.findByPk(req.params.id, { transaction: t });
        if (!promo) {
            await t.rollback();
            return res.status(404).json({ success: false, message: "Không tìm thấy" });
        }

        await promo.update(promoData, { transaction: t });

        // Update model associations if provided
        if (modelIds && Array.isArray(modelIds)) {
            // Remove old links
            await DongMayKm.destroy({ where: { maKm: promo.maKm }, transaction: t });
            // Add new links
            if (modelIds.length > 0) {
                const links = modelIds.map(id => ({
                    maKm: promo.maKm,
                    maModel: id,
                    ngayThem: new Date()
                }));
                await DongMayKm.bulkCreate(links, { transaction: t });
            }
        }

        await t.commit();
        res.json({ success: true, message: "Đã cập nhật chương trình khuyến mãi", data: promo });
    } catch (error) {
        if (t) await t.rollback();
        res.status(400).json({ success: false, message: error.message });
    }
};

const deletePromotion = async (req, res) => {
    try {
        const promo = await ChuongTrinhKm.findByPk(req.params.id);
        if (!promo) return res.status(404).json({ success: false, message: "Không tìm thấy" });
        await promo.destroy();
        res.json({ success: true, message: "Đã xóa chương trình khuyến mãi" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const linkProducts = async (req, res) => {
    try {
        const { maKm } = req.params;
        const { modelIds } = req.body; // Array of maModel

        const links = modelIds.map(id => ({
            maKm,
            maModel: id,
            ngayThem: new Date()
        }));

        await DongMayKm.bulkCreate(links, { ignoreDuplicates: true });
        res.json({ success: true, message: "Đã áp dụng khuyến mãi cho các sản phẩm đã chọn" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const unlinkProduct = async (req, res) => {
    try {
        const { maKm, modelId } = req.params;
        await DongMayKm.destroy({ where: { maKm, maModel: modelId } });
        res.json({ success: true, message: "Đã gỡ khuyến mãi khỏi sản phẩm" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllPromotions,
    getPromotionById,
    createPromotion,
    updatePromotion,
    deletePromotion,
    linkProducts,
    unlinkProduct
};
