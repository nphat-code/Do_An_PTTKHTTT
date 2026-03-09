const { NhaCungCap } = require('../models');
const { Op } = require('sequelize');

// Lấy danh sách nhà cung cấp
const getAllSuppliers = async (req, res) => {
    try {
        const { search } = req.query;
        const where = {};
        if (search) {
            where[Op.or] = [
                { tenNcc: { [Op.like]: `%${search}%` } },
                { maNcc: { [Op.like]: `%${search}%` } },
                { sdt: { [Op.like]: `%${search}%` } }
            ];
        }
        const suppliers = await NhaCungCap.findAll({ where, order: [['maNcc', 'ASC']] });
        res.json({ success: true, data: suppliers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Thêm nhà cung cấp
const createSupplier = async (req, res) => {
    try {
        const { maNcc, tenNcc, diaChi, sdt } = req.body;
        if (!maNcc || !tenNcc) {
            return res.status(400).json({ success: false, message: 'Mã và tên nhà cung cấp là bắt buộc' });
        }

        const existing = await NhaCungCap.findByPk(maNcc);
        if (existing) {
            return res.status(400).json({ success: false, message: 'Mã nhà cung cấp đã tồn tại' });
        }

        const supplier = await NhaCungCap.create({ maNcc, tenNcc, diaChi, sdt, trangThai: true });
        res.status(201).json({ success: true, message: 'Đã thêm nhà cung cấp', data: supplier });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Cập nhật nhà cung cấp
const updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenNcc, diaChi, sdt, trangThai } = req.body;

        const supplier = await NhaCungCap.findByPk(id);
        if (!supplier) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy nhà cung cấp' });
        }

        await supplier.update({ tenNcc, diaChi, sdt, trangThai });
        res.json({ success: true, message: 'Đã cập nhật nhà cung cấp', data: supplier });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Xóa nhà cung cấp
const deleteSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const supplier = await NhaCungCap.findByPk(id);
        if (!supplier) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy nhà cung cấp' });
        }
        await supplier.destroy();
        res.json({ success: true, message: 'Đã xóa nhà cung cấp' });
    } catch (error) {
        // Nếu có foreign key liên quan, chuyển sang ẩn thay vì xóa
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            try {
                await NhaCungCap.update({ trangThai: false }, { where: { maNcc: req.params.id } });
                return res.json({ success: true, message: 'Đã ẩn nhà cung cấp (có dữ liệu liên quan)' });
            } catch (e) {
                return res.status(500).json({ success: false, message: e.message });
            }
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy mã nhà cung cấp tiếp theo
const getNextMaNcc = async (req, res) => {
    try {
        const lastSupplier = await NhaCungCap.findOne({
            order: [['maNcc', 'DESC']]
        });

        if (!lastSupplier) {
            return res.status(200).json({ success: true, nextId: 'NCC001' });
        }

        const lastId = lastSupplier.maNcc; // e.g. "NCC001"
        const numberPart = parseInt(lastId.substring(3));
        if (isNaN(numberPart)) {
            return res.status(200).json({ success: true, nextId: 'NCC001' });
        }
        const nextId = `NCC${(numberPart + 1).toString().padStart(3, '0')}`;

        return res.status(200).json({ success: true, nextId });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllSuppliers, createSupplier, updateSupplier, deleteSupplier, getNextMaNcc };
