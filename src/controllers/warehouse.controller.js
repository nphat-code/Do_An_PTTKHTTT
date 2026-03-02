const { Kho, ChiNhanh } = require('../models');
const { Op } = require('sequelize');

// Lấy danh sách kho
const getAllWarehouses = async (req, res) => {
    try {
        const { search } = req.query;
        const where = {};
        if (search) {
            where[Op.or] = [
                { tenKho: { [Op.like]: `%${search}%` } },
                { maKho: { [Op.like]: `%${search}%` } },
                { diaChi: { [Op.like]: `%${search}%` } }
            ];
        }

        // Include ChiNhanh
        const warehouses = await Kho.findAll({
            where,
            order: [['maKho', 'ASC']],
            include: [{ model: ChiNhanh, attributes: ['tenCn'] }]
        });
        res.json({ success: true, data: warehouses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Thêm kho
const createWarehouse = async (req, res) => {
    try {
        const { maKho, tenKho, diaChi, loaiKho, trangThai, maCn } = req.body;
        if (!maKho || !tenKho) {
            return res.status(400).json({ success: false, message: 'Mã và tên kho là bắt buộc' });
        }
        const existing = await Kho.findByPk(maKho);
        if (existing) {
            return res.status(400).json({ success: false, message: 'Mã kho đã tồn tại' });
        }

        const warehouseData = { maKho, tenKho, diaChi, loaiKho };
        if (maCn) warehouseData.maCn = maCn;
        if (trangThai !== undefined) warehouseData.trangThai = trangThai;

        const warehouse = await Kho.create(warehouseData);
        res.status(201).json({ success: true, message: 'Đã thêm kho', data: warehouse });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Cập nhật kho
const updateWarehouse = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenKho, diaChi, loaiKho, trangThai, maCn } = req.body;

        const warehouse = await Kho.findByPk(id);
        if (!warehouse) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy kho' });
        }

        await warehouse.update({ tenKho, diaChi, loaiKho, trangThai, maCn: maCn || null });
        res.json({ success: true, message: 'Đã cập nhật kho', data: warehouse });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Xóa kho
const deleteWarehouse = async (req, res) => {
    try {
        const { id } = req.params;
        const warehouse = await Kho.findByPk(id);
        if (!warehouse) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy kho' });
        }
        await warehouse.destroy();
        res.json({ success: true, message: 'Đã xóa kho' });
    } catch (error) {
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            // Soft delete fallback
            try {
                await Kho.update({ trangThai: false }, { where: { maKho: req.params.id } });
                return res.json({ success: true, message: 'Đã ngừng hoạt động kho (vì đang chứa sản phẩm)' });
            } catch (e) {
                return res.status(500).json({ success: false, message: e.message });
            }
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy danh sách chi nhánh cho dropdown
const getBranchesForDropdown = async (req, res) => {
    try {
        const branches = await ChiNhanh.findAll({
            attributes: ['maCn', 'tenCn'],
            order: [['tenCn', 'ASC']]
        });
        res.json({ success: true, data: branches });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllWarehouses, createWarehouse, updateWarehouse, deleteWarehouse, getBranchesForDropdown };
