const { NhanVien, ChucVu } = require('../models/index');
const bcrypt = require('bcryptjs');

// Lấy danh sách nhân viên
const getAllEmployees = async (req, res) => {
    try {
        const employees = await NhanVien.findAll({
            attributes: ['maNv', 'hoTen', 'email', 'sdt', 'diaChi', 'ngaySinh', 'gioiTinh', 'trangThai', 'maCv'],
            order: [['maNv', 'ASC']],
            include: [
                { model: ChucVu, attributes: ['tenCv'] }
            ]
        });
        res.status(200).json({ success: true, data: employees });
    } catch (error) {
        console.error("Lỗi getAllEmployees:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Tạo nhân viên mới
const createEmployee = async (req, res) => {
    console.log("Creating employee with data:", req.body);
    try {
        const { maNv, hoTen, email, sdt, matKhau, maCv, ngaySinh, gioiTinh, diaChi } = req.body;

        if (!maNv || !hoTen || !email || !matKhau) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập đầy đủ: Mã NV, Họ tên, Email, Mật khẩu" });
        }

        // Check trùng mã NV
        const existing = await NhanVien.findByPk(maNv);
        if (existing) {
            return res.status(400).json({ success: false, message: "Mã nhân viên đã tồn tại" });
        }

        // Check trùng email
        const existingEmail = await NhanVien.findOne({ where: { email } });
        if (existingEmail) {
            return res.status(400).json({ success: false, message: "Email đã được sử dụng" });
        }

        // Hash mật khẩu
        const hashedPassword = await bcrypt.hash(matKhau, 10);

        const newEmployee = await NhanVien.create({
            maNv,
            hoTen,
            email,
            sdt: sdt || null,
            diaChi: diaChi || null,
            ngaySinh: ngaySinh || null,
            gioiTinh: gioiTinh || null,
            matKhau: hashedPassword,
            trangThai: true,
            maCv: maCv || null
        });

        res.status(201).json({
            success: true,
            message: "Đã tạo tài khoản nhân viên thành công",
            data: {
                maNv: newEmployee.maNv,
                hoTen: newEmployee.hoTen,
                email: newEmployee.email,
                sdt: newEmployee.sdt,
                diaChi: newEmployee.diaChi,
                trangThai: newEmployee.trangThai
            }
        });
    } catch (error) {
        console.error("Lỗi createEmployee:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Khóa / Mở khóa nhân viên
const toggleEmployeeStatus = async (req, res) => {
    try {
        const employee = await NhanVien.findByPk(req.params.id);
        if (!employee) {
            return res.status(404).json({ success: false, message: "Không tìm thấy nhân viên" });
        }

        await employee.update({ trangThai: !employee.trangThai });

        res.status(200).json({
            success: true,
            message: employee.trangThai ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản",
            data: employee
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Đặt lại mật khẩu nhân viên
const resetEmployeePassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ success: false, message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
        }

        const employee = await NhanVien.findByPk(req.params.id);
        if (!employee) {
            return res.status(404).json({ success: false, message: "Không tìm thấy nhân viên" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await employee.update({ matKhau: hashedPassword });

        res.status(200).json({ success: true, message: "Đã đặt lại mật khẩu thành công" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateEmployee = async (req, res) => {
    try {
        const { hoTen, sdt, diaChi, maCv, ngaySinh, gioiTinh } = req.body;

        const employee = await NhanVien.findByPk(req.params.id);
        if (!employee) {
            return res.status(404).json({ success: false, message: "Không tìm thấy nhân viên" });
        }

        await employee.update({
            hoTen,
            sdt: sdt || null,
            diaChi: diaChi || null,
            ngaySinh: ngaySinh || null,
            gioiTinh: gioiTinh || null,
            maCv: maCv || null
        });

        res.status(200).json({ success: true, message: "Đã cập nhật thông tin nhân viên" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy mã nhân viên tiếp theo
const getNextMaNv = async (req, res) => {
    try {
        const lastUser = await NhanVien.findOne({
            order: [['maNv', 'DESC']]
        });

        if (!lastUser) {
            return res.status(200).json({ success: true, nextId: 'NV001' });
        }

        const lastId = lastUser.maNv; // e.g., "NV005"
        const numberPart = parseInt(lastId.substring(2));
        if (isNaN(numberPart)) {
            return res.status(200).json({ success: true, nextId: 'NV001' });
        }
        const nextId = `NV${(numberPart + 1).toString().padStart(3, '0')}`;

        return res.status(200).json({ success: true, nextId });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllEmployees,
    createEmployee,
    updateEmployee,
    toggleEmployeeStatus,
    resetEmployeePassword,
    getNextMaNv
};
