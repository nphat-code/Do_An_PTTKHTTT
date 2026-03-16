const { LoaiMay } = require('../models');
const { Op } = require('sequelize');

// Lấy danh sách loại máy
const getAllCategories = async (req, res) => {
    try {
        const { search } = req.query;
        const where = {};
        if (search) {
            where[Op.or] = [
                { tenLoai: { [Op.iLike]: `%${search}%` } },
                { maLoai: { [Op.iLike]: `%${search}%` } }
            ];
        }
        const categories = await LoaiMay.findAll({ where, order: [['maLoai', 'ASC']] });
        res.json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Thêm loại máy
const createCategory = async (req, res) => {
    try {
        const { maLoai, tenLoai } = req.body;
        if (!maLoai || !tenLoai) {
            return res.status(400).json({ success: false, message: 'Mã và tên loại là bắt buộc' });
        }
        const existing = await LoaiMay.findByPk(maLoai);
        if (existing) {
            return res.status(400).json({ success: false, message: 'Mã loại đã tồn tại' });
        }
        const category = await LoaiMay.create({ maLoai, tenLoai });
        res.status(201).json({ success: true, message: 'Đã thêm loại máy', data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Cập nhật loại máy
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenLoai } = req.body;
        const category = await LoaiMay.findByPk(id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy loại máy' });
        }
        await category.update({ tenLoai });
        res.json({ success: true, message: 'Đã cập nhật loại máy', data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Xóa loại máy
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await LoaiMay.findByPk(id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy loại máy' });
        }
        await category.destroy();
        res.json({ success: true, message: 'Đã xóa loại máy' });
    } catch (error) {
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ success: false, message: 'Không thể xóa — loại này đang có sản phẩm liên quan' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllCategories, createCategory, updateCategory, deleteCategory };
