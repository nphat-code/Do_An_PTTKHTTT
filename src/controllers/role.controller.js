const { ChucVu } = require('../models');
const { Op } = require('sequelize');

// Lấy danh sách chức vụ
const getAllRoles = async (req, res) => {
    try {
        const { search } = req.query;
        const where = {};
        if (search) {
            where[Op.or] = [
                { tenCv: { [Op.like]: `%${search}%` } },
                { maCv: { [Op.like]: `%${search}%` } }
            ];
        }

        const roles = await ChucVu.findAll({
            where,
            order: [['maCv', 'ASC']]
        });
        res.json({ success: true, data: roles });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Thêm chức vụ
const createRole = async (req, res) => {
    try {
        const { maCv, tenCv, moTa, luongCoBan } = req.body;
        if (!maCv || !tenCv) {
            return res.status(400).json({ success: false, message: 'Mã và tên chức vụ là bắt buộc' });
        }
        const existing = await ChucVu.findByPk(maCv);
        if (existing) {
            return res.status(400).json({ success: false, message: 'Mã chức vụ đã tồn tại' });
        }

        const role = await ChucVu.create({ maCv, tenCv, moTa, luongCoBan: luongCoBan || 0 });
        res.status(201).json({ success: true, message: 'Đã thêm chức vụ', data: role });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Cập nhật chức vụ
const updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenCv, moTa, luongCoBan } = req.body;

        const role = await ChucVu.findByPk(id);
        if (!role) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy chức vụ' });
        }

        await role.update({ tenCv, moTa, luongCoBan: luongCoBan || null });
        res.json({ success: true, message: 'Đã cập nhật chức vụ', data: role });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Xóa chức vụ
const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        const role = await ChucVu.findByPk(id);
        if (!role) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy chức vụ' });
        }
        await role.destroy();
        res.json({ success: true, message: 'Đã xóa chức vụ' });
    } catch (error) {
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ success: false, message: 'Không thể xóa — chức vụ này đang có nhân viên giữ chức vụ' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllRoles, createRole, updateRole, deleteRole };
