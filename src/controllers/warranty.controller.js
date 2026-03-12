const { sequelize, PhieuBaoHanh, ChiTietSuaChua, ChiTietMay, DongMay, NhanVien, LinhKien, Kho, HinhThucThanhToan, KhoLinhKien } = require('../models/index');
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
    try {
        const { soSerial, moTaLoi, maNvTiepNhan } = req.body;

        // Kiểm tra serial có tồn tại và đã bán chưa
        const machine = await ChiTietMay.findOne({
            where: { soSerial, trangThai: 'Đã bán' }
        });

        if (!machine) {
            return res.status(400).json({ success: false, message: "Số Serial không hợp lệ hoặc máy chưa được bán." });
        }

        const maPbh = await generateWarrantyCode();
        const warranty = await PhieuBaoHanh.create({
            maPbh,
            soSerial,
            moTaLoi,
            maNvTiepNhan,
            ngayLap: new Date(),
            trangThai: 'Chờ kiểm tra'
        });

        res.status(201).json({ success: true, message: "Tạo phiếu bảo hành thành công", data: warranty });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateWarranty = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { ketLuanKyThuat, ngayTraMay, chiPhiSuaChua, trangThai, maNvKyThuat, maHttt } = req.body;

        const warranty = await PhieuBaoHanh.findByPk(id, { transaction: t });
        if (!warranty) {
            await t.rollback();
            return res.status(404).json({ success: false, message: "Không tìm thấy phiếu bảo hành" });
        }

        await warranty.update({
            ketLuanKyThuat,
            ngayTraMay,
            chiPhiSuaChua,
            trangThai,
            maNvKyThuat,
            maHttt
        }, { transaction: t });

        await t.commit();
        res.status(200).json({ success: true, message: "Cập nhật thành công", data: warranty });
    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ success: false, message: error.message });
    }
};

const addRepairDetail = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { maPbh, maLk, maKhoXuat, soLuong, donGia } = req.body;

        // 1. Kiểm tra tồn kho linh kiện theo kho (KhoLinhKien)
        const stockRecord = await KhoLinhKien.findOne({
            where: { maLk, maKho: maKhoXuat },
            transaction: t
        });

        if (!stockRecord || stockRecord.soLuongTon < soLuong) {
            throw new Error("Không đủ linh kiện trong kho đã chọn");
        }

        // 2. Tạo chi tiết sửa chữa
        const detail = await ChiTietSuaChua.create({
            maPbh,
            maLk,
            maKhoXuat,
            soLuong,
            donGia
        }, { transaction: t });

        // 3. Trừ tồn kho linh kiện toàn cục
        const part = await LinhKien.findByPk(maLk, { transaction: t });
        if (part) {
            await part.update({
                soLuongTon: part.soLuongTon - soLuong
            }, { transaction: t });
        }

        // 4. Trừ tồn kho linh kiện theo kho (KhoLinhKien)
        await stockRecord.update({
            soLuongTon: stockRecord.soLuongTon - soLuong
        }, { transaction: t });

        // 4. Cập nhật chi phí vào phiếu bảo hành
        const warranty = await PhieuBaoHanh.findByPk(maPbh, { transaction: t });
        const newTotal = parseFloat(warranty.chiPhiSuaChua) + (parseFloat(donGia) * soLuong);
        await warranty.update({ chiPhiSuaChua: newTotal }, { transaction: t });

        await t.commit();
        res.status(201).json({ success: true, message: "Thêm linh kiện sửa chữa thành công", data: detail });
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

module.exports = {
    getAllWarranties,
    getWarrantyById,
    createWarranty,
    updateWarranty,
    addRepairDetail,
    checkWarranty
};
