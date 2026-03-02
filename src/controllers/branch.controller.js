const { ChiNhanh, NhanVien } = require('../models');
const { Op } = require('sequelize');

// Lấy danh sách chi nhánh
const getAllBranches = async (req, res) => {
    try {
        const { search } = req.query;
        const where = {};
        if (search) {
            where[Op.or] = [
                { tenCn: { [Op.like]: `%${search}%` } },
                { maCn: { [Op.like]: `%${search}%` } },
                { diaChi: { [Op.like]: `%${search}%` } }
            ];
        }

        // Include QuanLy to get manager's name
        const branches = await ChiNhanh.findAll({
            where,
            order: [['maCn', 'ASC']],
            include: [{ model: NhanVien, as: 'QuanLy', attributes: ['hoTen'] }]
        });
        res.json({ success: true, data: branches });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Thêm chi nhánh
const createBranch = async (req, res) => {
    try {
        const { maCn, tenCn, diaChi, maNvQuanLy } = req.body;
        if (!maCn || !tenCn) {
            return res.status(400).json({ success: false, message: 'Mã và tên chi nhánh là bắt buộc' });
        }
        const existing = await ChiNhanh.findByPk(maCn);
        if (existing) {
            return res.status(400).json({ success: false, message: 'Mã chi nhánh đã tồn tại' });
        }
        const branchData = { maCn, tenCn, diaChi };
        if (maNvQuanLy) {
            branchData.maNvQuanLy = maNvQuanLy;
        }

        const branch = await ChiNhanh.create(branchData);
        res.status(201).json({ success: true, message: 'Đã thêm chi nhánh', data: branch });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Cập nhật chi nhánh
const updateBranch = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenCn, diaChi, maNvQuanLy } = req.body;

        const branch = await ChiNhanh.findByPk(id);
        if (!branch) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy chi nhánh' });
        }

        await branch.update({ tenCn, diaChi, maNvQuanLy: maNvQuanLy || null });
        res.json({ success: true, message: 'Đã cập nhật chi nhánh', data: branch });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Xóa chi nhánh
const deleteBranch = async (req, res) => {
    try {
        const { id } = req.params;
        const branch = await ChiNhanh.findByPk(id);
        if (!branch) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy chi nhánh' });
        }
        await branch.destroy();
        res.json({ success: true, message: 'Đã xóa chi nhánh' });
    } catch (error) {
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ success: false, message: 'Không thể xóa — chi nhánh này đang có nhân viên hoặc kho liên kết' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy danh sách nhân viên cho dropdown
const getEmployeesForDropdown = async (req, res) => {
    try {
        const employees = await NhanVien.findAll({
            attributes: ['maNv', 'hoTen'],
            order: [['hoTen', 'ASC']]
        });
        res.json({ success: true, data: employees });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllBranches, createBranch, updateBranch, deleteBranch, getEmployeesForDropdown };
