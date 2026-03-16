const { ChucVu, Quyen, ChiTietQuyen } = require('../models');
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

// ==================== QUẢN LÝ PHÂN QUYỀN ====================

// Lấy toàn bộ danh mục quyền hệ thống
const getAllPermissions = async (req, res) => {
    try {
        const perms = await Quyen.findAll({ order: [['maQuyen', 'ASC']] });
        res.json({ success: true, data: perms });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy danh sách mã quyền của một chức vụ
const getRolePermissions = async (req, res) => {
    try {
        const { id } = req.params;
        const mappings = await ChiTietQuyen.findAll({
            where: { maCv: id },
            attributes: ['maQuyen']
        });
        const permissionCodes = mappings.map(m => m.maQuyen);
        res.json({ success: true, data: permissionCodes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Cập nhật danh sách quyền cho một chức vụ
const updateRolePermissions = async (req, res) => {
    try {
        const { id } = req.params;
        const { permissions } = req.body; // Array of maQuyen

        if (!Array.isArray(permissions)) {
            return res.status(400).json({ success: false, message: 'Danh sách quyền không hợp lệ' });
        }

        // Xóa hết quyền cũ của chức vụ này
        await ChiTietQuyen.destroy({ where: { maCv: id } });

        // Thêm mới các quyền đã chọn
        const newMappings = permissions.map(pCode => ({
            maCv: id,
            maQuyen: pCode
        }));

        if (newMappings.length > 0) {
            await ChiTietQuyen.bulkCreate(newMappings);
        }

        res.json({ success: true, message: 'Cập nhật phân quyền thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllRoles,
    createRole,
    updateRole,
    deleteRole,
    getAllPermissions,
    getRolePermissions,
    updateRolePermissions
};
