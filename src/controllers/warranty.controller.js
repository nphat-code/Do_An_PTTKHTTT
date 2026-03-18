const { sequelize, PhieuBaoHanh, ChiTietSuaChua, ChiTietMay, DongMay, NhanVien, LinhKien, Kho, HinhThucThanhToan, KhoLinhKien, HoaDon } = require('../models/index');
const { Op } = require('sequelize');

const generateWarrantyCode = async () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const lastPbh = await PhieuBaoHanh.findOne({
        where: { maPbh: { [Op.like]: `BH${dateStr}%` } },
        order: [['maPbh', 'DESC']]
    });

    let nextNum = 1;
    if (lastPbh) {
        const lastCode = lastPbh.maPbh;
        nextNum = parseInt(lastCode.slice(-3)) + 1;
    }
    return `BH${dateStr}${nextNum.toString().padStart(3, '0')}`;
};

const getAllWarranties = async (req, res) => {
    try {
        const { search } = req.query;
        let where = {};
        if (search) {
            where = {
                [Op.or]: [
                    { maPbh: { [Op.iLike]: `%${search}%` } },
                    { soSerial: { [Op.iLike]: `%${search}%` } }
                ]
            };
        }

        const warranties = await PhieuBaoHanh.findAll({
            where,
            include: [
                {
                    model: ChiTietMay,
                    include: [{ model: DongMay }]
                },
                { model: NhanVien, as: 'NvTiepNhan', attributes: ['hoTen'] },
                { model: NhanVien, as: 'NvKyThuat', attributes: ['hoTen'] }
            ],
            order: [['ngayLap', 'DESC']]
        });
        res.status(200).json({ success: true, data: warranties });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getWarrantyById = async (req, res) => {
    try {
        const warranty = await PhieuBaoHanh.findByPk(req.params.id, {
            include: [
                {
                    model: ChiTietMay,
                    include: [{ model: DongMay }]
                },
                { model: NhanVien, as: 'NvTiepNhan' },
                { model: NhanVien, as: 'NvKyThuat' },
                { model: HinhThucThanhToan },
                {
                    model: ChiTietSuaChua,
                    include: [
                        { model: LinhKien },
                        { model: Kho }
                    ]
                }
            ]
        });
        if (!warranty) return res.status(404).json({ success: false, message: "Không tìm thấy phiếu bảo hành" });
        res.status(200).json({ success: true, data: warranty });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createWarranty = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { soSerial, moTaLoi, maNvTiepNhan } = req.body;

        // 1. Kiểm tra serial có tồn tại và đã bán chưa
        const machine = await ChiTietMay.findOne({
            where: { soSerial, trangThai: 'Đã bán' },
            include: [
                {
                    model: DongMay,
                    attributes: ['thoiHanBaoHanh']
                },
                {
                    model: HoaDon,
                    attributes: ['ngayLap']
                }
            ],
            transaction: t
        });

        if (!machine) {
            await t.rollback();
            return res.status(400).json({ success: false, message: "Số Serial không hợp lệ, chưa được bán hoặc đang trong quá trình xử lý khác." });
        }

        // 2. Xác định loại phiếu (Bảo hành/Sửa chữa)
        let loaiPhieu = 'Sửa chữa';
        if (machine.HoaDon && machine.HoaDon.ngayLap && machine.DongMay) {
            const ngayMua = new Date(machine.HoaDon.ngayLap);
            const hanBaoHanhMonths = machine.DongMay.thoiHanBaoHanh || 12;
            const ngayHetHan = new Date(ngayMua);
            ngayHetHan.setMonth(ngayHetHan.getMonth() + hanBaoHanhMonths);

            if (new Date() <= ngayHetHan) {
                loaiPhieu = 'Bảo hành';
            }
        }

        // 3. Tạo phiếu bảo hành
        const maPbh = await generateWarrantyCode();
        const warranty = await PhieuBaoHanh.create({
            maPbh,
            soSerial,
            moTaLoi,
            maNvTiepNhan,
            ngayLap: new Date(),
            trangThai: 'Chờ kiểm tra',
            loaiPhieu
        }, { transaction: t });

        // 4. Cập nhật trạng thái máy -> Đang bảo hành
        await machine.update({ trangThai: 'Đang bảo hành' }, { transaction: t });

        await t.commit();
        res.status(201).json({ success: true, message: "Tạo phiếu thành công. Loại: " + loaiPhieu, data: warranty });
    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateWarranty = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { ketLuanKyThuat, ngayTraMay, phiDichVu, trangThai, maNvKyThuat, maHttt } = req.body;

        const warranty = await PhieuBaoHanh.findByPk(id, {
            include: [ChiTietSuaChua],
            transaction: t
        });
        if (!warranty) {
            await t.rollback();
            return res.status(404).json({ success: false, message: "Không tìm thấy phiếu" });
        }

        // 1. Tính toán lại tổng chi phí (chiPhiSuaChua = sum(parts) + phiDichVu)
        let totalPartsCost = 0;
        if (warranty.ChiTietSuaChuas) {
            totalPartsCost = warranty.ChiTietSuaChuas.reduce((sum, item) => sum + (parseFloat(item.donGia) * item.soLuong), 0);
        }
        const newTotal = totalPartsCost + parseFloat(phiDichVu || warranty.phiDichVu || 0);

        // 2. Cập nhật phiếu
        await warranty.update({
            ketLuanKyThuat,
            ngayTraMay,
            phiDichVu: phiDichVu || 0,
            chiPhiSuaChua: newTotal,
            trangThai,
            maNvKyThuat,
            maHttt
        }, { transaction: t });

        // 3. Nếu Đã trả máy -> Cập nhật trạng thái máy về Đã bán
        if (trangThai === 'Đã trả máy') {
            await ChiTietMay.update(
                { trangThai: 'Đã bán' },
                { where: { soSerial: warranty.soSerial }, transaction: t }
            );
        }

        await t.commit();
        res.status(200).json({ success: true, message: "Cập nhật thành công", data: warranty });
    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ success: false, message: error.message });
    }
};

const confirmQuote = async (req, res) => {
    try {
        const { id } = req.params;
        const warranty = await PhieuBaoHanh.findByPk(id);
        if (!warranty) return res.status(404).json({ success: false, message: "Không tìm thấy phiếu" });

        await warranty.update({ daXacNhanBaoGia: true, trangThai: 'Đang sửa' });
        res.json({ success: true, message: "Đã xác nhận báo giá. Bắt đầu sửa chữa." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const verifyQC = async (req, res) => {
    try {
        const { id } = req.params;
        const warranty = await PhieuBaoHanh.findByPk(id);
        if (!warranty) return res.status(404).json({ success: false, message: "Không tìm thấy phiếu" });

        await warranty.update({ trangThaiQc: true, trangThai: 'Đã xong' });
        res.json({ success: true, message: "Xác nhận QC thành công. Sẵn sàng trả máy." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const addRepairDetail = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { maPbh, maLk, maKhoXuat, soLuong, donGia } = req.body;

        const warranty = await PhieuBaoHanh.findByPk(maPbh, { transaction: t });
        if (!warranty) throw new Error("Không tìm thấy phiếu bảo hành");

        // 1. Kiểm tra tồn kho linh kiện theo kho (KhoLinhKien)
        const stockRecord = await KhoLinhKien.findOne({
            where: { maLk, maKho: maKhoXuat },
            transaction: t
        });

        if (!stockRecord || stockRecord.soLuongTon < soLuong) {
            throw new Error("Không đủ linh kiện trong kho đã chọn");
        }

        // 2. Xác định đơn giá thực tế (Nếu là Bảo hành Free -> Đơn giá = 0 cho khách)
        const actualPrice = (warranty.loaiPhieu === 'Bảo hành' ? 0 : donGia);

        // 3. Tạo chi tiết sửa chữa
        const detail = await ChiTietSuaChua.create({
            maPbh,
            maLk,
            maKhoXuat,
            soLuong,
            donGia: actualPrice
        }, { transaction: t });

        // 4. Trừ tồn kho linh kiện
        const part = await LinhKien.findByPk(maLk, { transaction: t });
        if (part) {
            await part.update({ soLuongTon: part.soLuongTon - soLuong }, { transaction: t });
        }
        await stockRecord.update({ soLuongTon: stockRecord.soLuongTon - soLuong }, { transaction: t });

        // 5. Cập nhật tổng chi phí vào phiếu bảo hành
        const newTotal = parseFloat(warranty.chiPhiSuaChua) + (parseFloat(actualPrice) * soLuong);
        await warranty.update({ chiPhiSuaChua: newTotal }, { transaction: t });

        await t.commit();
        res.status(201).json({ success: true, message: "Thêm linh kiện thành công", data: detail });
    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ success: false, message: error.message });
    }
};

const checkWarranty = async (req, res) => {
    try {
        const { serial } = req.params;
        const machine = await ChiTietMay.findOne({
            where: { soSerial: serial },
            include: [
                {
                    model: DongMay,
                    include: ['HangSanXuat']
                },
                {
                    model: PhieuBaoHanh,
                    order: [['ngayLap', 'DESC']],
                    limit: 1
                }
            ]
        });

        if (!machine) {
            return res.status(404).json({ success: false, message: "Không tìm thấy máy đã bán với Serial này." });
        }

        res.json({ success: true, data: machine });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteRepairDetail = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;

        // 1. Tìm chi tiết sửa chữa
        const detail = await ChiTietSuaChua.findByPk(id, { transaction: t });
        if (!detail) {
            await t.rollback();
            return res.status(404).json({ success: false, message: "Không tìm thấy linh kiện này trong phiếu." });
        }

        const { maPbh, maLk, maKhoXuat, soLuong, donGia } = detail;

        // 2. Trả lại số lượng tồn kho
        const khoLk = await KhoLinhKien.findOne({
            where: { maKho: maKhoXuat, maLk: maLk },
            transaction: t
        });
        if (khoLk) {
            await khoLk.increment('soLuongTon', { by: soLuong, transaction: t });
        }

        // 3. Xóa chi tiết
        await detail.destroy({ transaction: t });

        // 4. Cập nhật lại tổng tiền trên Phiếu Bảo Hành (Trừ bớt tiền linh kiện này)
        const warranty = await PhieuBaoHanh.findByPk(maPbh, { transaction: t });
        if (warranty) {
            // Chi phí sửa chữa mới = Cũ - (số lượng * đơn giá)
            const amountToSubtract = parseFloat(soLuong) * parseFloat(donGia);
            const newTotal = Math.max(0, parseFloat(warranty.chiPhiSuaChua) - amountToSubtract);
            await warranty.update({ chiPhiSuaChua: newTotal }, { transaction: t });
        }

        await t.commit();
        res.json({ success: true, message: "Đã xóa linh kiện và hoàn lại kho." });
    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllWarranties,
    getWarrantyById,
    createWarranty,
    updateWarranty,
    confirmQuote,
    verifyQC,
    addRepairDetail,
    deleteRepairDetail,
    checkWarranty
};
