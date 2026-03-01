const { HangSanXuat } = require('../models');
const { Op } = require('sequelize');

// Lấy danh sách hãng sản xuất
const getAllBrands = async (req, res) => {
    try {
        const { search } = req.query;
        const where = {};
        if (search) {
            where[Op.or] = [
                { tenHang: { [Op.like]: `%${search}%` } },
                { maHang: { [Op.like]: `%${search}%` } },
                { quocGia: { [Op.like]: `%${search}%` } }
            ];
        }
        const brands = await HangSanXuat.findAll({ where, order: [['maHang', 'ASC']] });
        res.json({ success: true, data: brands });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Thêm hãng sản xuất
const createBrand = async (req, res) => {
    try {
        const { maHang, tenHang, quocGia } = req.body;
        if (!maHang || !tenHang) {
            return res.status(400).json({ success: false, message: 'Mã và tên hãng là bắt buộc' });
        }
        const existing = await HangSanXuat.findByPk(maHang);
        if (existing) {
            return res.status(400).json({ success: false, message: 'Mã hãng đã tồn tại' });
        }
        const brand = await HangSanXuat.create({ maHang, tenHang, quocGia });
        res.status(201).json({ success: true, message: 'Đã thêm hãng sản xuất', data: brand });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Cập nhật hãng sản xuất
const updateBrand = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenHang, quocGia } = req.body;
        const brand = await HangSanXuat.findByPk(id);
        if (!brand) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hãng sản xuất' });
        }
        await brand.update({ tenHang, quocGia });
        res.json({ success: true, message: 'Đã cập nhật hãng sản xuất', data: brand });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Xóa hãng sản xuất
const deleteBrand = async (req, res) => {
    try {
        const { id } = req.params;
        const brand = await HangSanXuat.findByPk(id);
        if (!brand) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hãng sản xuất' });
        }
        await brand.destroy();
        res.json({ success: true, message: 'Đã xóa hãng sản xuất' });
    } catch (error) {
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ success: false, message: 'Không thể xóa — hãng này đang có sản phẩm liên quan' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllBrands, createBrand, updateBrand, deleteBrand };
