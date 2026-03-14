const { LinhKien, HangSanXuat } = require('../models/index');
const { Op } = require('sequelize');

const getAllParts = async (req, res) => {
    try {
        const { search, maKho } = req.query;
        const { KhoLinhKien } = require('../models/index');

        const where = {};
        if (search) {
            where[Op.or] = [
                { maLk: { [Op.iLike]: `%${search}%` } },
                { tenLk: { [Op.iLike]: `%${search}%` } },
                { loaiLk: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const include = [
            { model: HangSanXuat, attributes: ['tenHang'] }
        ];

        if (maKho) {
            include.push({
                model: KhoLinhKien,
                where: { maKho: maKho },
                required: true // Only return parts that are in this warehouse
            });
        }

        const parts = await LinhKien.findAll({
            where,
            include,
            order: [['maLk', 'ASC']]
        });

        // Map data to keep soLuongTon field consistent
        const result = parts.map(p => {
            const part = p.toJSON();
            if (maKho && part.KhoLinhKiens && part.KhoLinhKiens[0]) {
                part.soLuongTon = part.KhoLinhKiens[0].soLuongTon;
            }
            return part;
        });

        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getPartById = async (req, res) => {
    try {
        const part = await LinhKien.findByPk(req.params.id, {
            include: [{ model: HangSanXuat }]
        });
        if (!part) return res.status(404).json({ success: false, message: 'Không tìm thấy linh kiện' });
        res.json({ success: true, data: part });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createPart = async (req, res) => {
    try {
        const { maLk, tenLk, loaiLk, giaNhap, maHang, soLuongTon } = req.body;
        if (!maLk || !tenLk) {
            return res.status(400).json({ success: false, message: 'Mã và tên linh kiện là bắt buộc' });
        }
        const existing = await LinhKien.findByPk(maLk);
        if (existing) {
            return res.status(400).json({ success: false, message: 'Mã linh kiện đã tồn tại' });
        }

        const part = await LinhKien.create({ maLk, tenLk, loaiLk, giaNhap, maHang, soLuongTon: soLuongTon || 0 });
        res.status(201).json({ success: true, message: 'Đã thêm linh kiện', data: part });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updatePart = async (req, res) => {
    try {
        const { tenLk, loaiLk, giaNhap, maHang, soLuongTon } = req.body;
        const part = await LinhKien.findByPk(req.params.id);
        if (!part) return res.status(404).json({ success: false, message: 'Không tìm thấy linh kiện' });

        await part.update({ tenLk, loaiLk, giaNhap, maHang, soLuongTon: soLuongTon !== undefined ? soLuongTon : part.soLuongTon });
        res.json({ success: true, message: 'Đã cập nhật linh kiện', data: part });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deletePart = async (req, res) => {
    try {
        const part = await LinhKien.findByPk(req.params.id);
        if (!part) return res.status(404).json({ success: false, message: 'Không tìm thấy linh kiện' });
        await part.destroy();
        res.json({ success: true, message: 'Đã xóa linh kiện' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllParts,
    getPartById,
    createPart,
    updatePart,
    deletePart
};
