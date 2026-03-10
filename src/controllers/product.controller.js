const { sequelize, DongMay, CauHinh, HangSanXuat, LoaiMay, LinhKienTuongThich, LinhKien } = require('../models/index');
const { Op } = require('sequelize');

const getAllProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const offset = (page - 1) * limit;
        const { search, minPrice, maxPrice, brand } = req.query;

        let whereClause = {};

        if (search) {
            whereClause.tenModel = { [Op.iLike]: `%${search}%` };
        }

        if (minPrice || maxPrice) {
            whereClause.giaBan = {};
            if (minPrice && !isNaN(minPrice)) whereClause.giaBan[Op.gte] = parseFloat(minPrice);
            if (maxPrice && !isNaN(maxPrice)) whereClause.giaBan[Op.lte] = parseFloat(maxPrice);
        }

        if (brand) {
            whereClause.maHang = brand;
        }

        const result = await DongMay.findAndCountAll({
            where: whereClause,
            limit: limit,
            offset: offset,
            include: [
                { model: CauHinh, attributes: ['maCh', 'cpu', 'ram', 'oCung', 'vga', 'manHinh', 'pin', 'trongLuong'] },
                { model: HangSanXuat, attributes: ['maHang', 'tenHang'] },
                { model: LoaiMay, attributes: ['maLoai', 'tenLoai'] }
            ],
            order: [['maModel', 'ASC']]
        });

        // Basic stats
        const stats = await DongMay.findAll({
            where: whereClause,
            attributes: [
                [sequelize.fn('SUM', sequelize.literal('COALESCE("giaBan", 0) * COALESCE("soLuongTon", 0)')), 'totalValue']
            ],
            raw: true
        });

        return res.status(200).json({
            success: true,
            data: result.rows,
            pagination: {
                totalItems: result.count,
                totalPages: Math.ceil(result.count / limit),
                currentPage: page
            },
            statistics: {
                totalProducts: result.count,
                totalValue: parseFloat(stats[0].totalValue || 0)
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getProductById = async (req, res) => {
    try {
        const product = await DongMay.findByPk(req.params.id, {
            include: [
                { model: CauHinh },
                { model: HangSanXuat },
                { model: LoaiMay }
            ]
        });
        if (!product) {
            return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
        }
        res.status(200).json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createProduct = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { maModel, tenModel, giaNhap, giaBan, maHang, maLoai,
            cpu, ram, oCung, vga, manHinh, pin, trongLuong } = req.body;

        // 1. Create CauHinh if any config field is provided
        let maCh = null;
        if (cpu || ram || oCung || vga || manHinh || pin || trongLuong) {
            maCh = 'CH_' + Date.now();
            await CauHinh.create({
                maCh,
                cpu: cpu || null,
                ram: ram || null,
                oCung: oCung || null,
                vga: vga || null,
                manHinh: manHinh || null,
                pin: pin || null,
                trongLuong: trongLuong ? parseFloat(trongLuong) : null
            }, { transaction: t });
        }

        // 2. Create DongMay
        const hinhAnh = req.file ? `uploads/products/${req.file.filename}` : null;
        const newProduct = await DongMay.create({
            maModel,
            tenModel,
            giaNhap: giaNhap ? Number(giaNhap) : null,
            giaBan: giaBan ? Number(giaBan) : null,
            soLuongTon: 0,
            hinhAnh,
            maCh: maCh,
            maHang: maHang || null,
            maLoai: maLoai || null
        }, { transaction: t });

        await t.commit();

        // Fetch with associations
        const created = await DongMay.findByPk(maModel, {
            include: [
                { model: CauHinh },
                { model: HangSanXuat },
                { model: LoaiMay }
            ]
        });

        res.status(201).json({
            success: true,
            message: "Đã thêm máy tính mới vào hệ thống",
            data: created
        });
    } catch (error) {
        await t.rollback();
        res.status(400).json({ success: false, message: error.message });
    }
};

const updateProduct = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const product = await DongMay.findByPk(req.params.id, { include: [{ model: CauHinh }] });
        if (!product) {
            await t.rollback();
            return res.status(404).json({ success: false, message: "Không tìm thấy" });
        }

        const { tenModel, giaNhap, giaBan, maHang, maLoai,
            cpu, ram, oCung, vga, manHinh, pin, trongLuong } = req.body;

        // Update CauHinh
        if (cpu || ram || oCung || vga || manHinh || pin || trongLuong) {
            if (product.maCh && product.CauHinh) {
                // Update existing
                await product.CauHinh.update({
                    cpu: cpu || product.CauHinh.cpu,
                    ram: ram || product.CauHinh.ram,
                    oCung: oCung || product.CauHinh.oCung,
                    vga: vga || product.CauHinh.vga,
                    manHinh: manHinh || product.CauHinh.manHinh,
                    pin: pin || product.CauHinh.pin,
                    trongLuong: trongLuong ? parseFloat(trongLuong) : product.CauHinh.trongLuong
                }, { transaction: t });
            } else {
                // Create new config
                const maCh = 'CH_' + Date.now();
                await CauHinh.create({
                    maCh, cpu, ram, oCung, vga, manHinh, pin,
                    trongLuong: trongLuong ? parseFloat(trongLuong) : null
                }, { transaction: t });
                await product.update({ maCh }, { transaction: t });
            }
        }

        // Update DongMay fields
        const updateData = {};
        if (tenModel !== undefined) updateData.tenModel = tenModel;
        if (giaNhap !== undefined) updateData.giaNhap = Number(giaNhap);
        if (giaBan !== undefined) updateData.giaBan = Number(giaBan);
        if (maHang !== undefined) updateData.maHang = maHang || null;
        if (maLoai !== undefined) updateData.maLoai = maLoai || null;
        if (req.file) updateData.hinhAnh = `uploads/products/${req.file.filename}`;

        await product.update(updateData, { transaction: t });

        await t.commit();

        const updated = await DongMay.findByPk(req.params.id, {
            include: [
                { model: CauHinh },
                { model: HangSanXuat },
                { model: LoaiMay }
            ]
        });

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        await t.rollback();
        res.status(400).json({ success: false, message: error.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const product = await DongMay.findByPk(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: "Không tìm thấy" });

        await product.destroy();
        res.status(200).json({ success: true, message: "Đã xóa thành công sản phẩm" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// API lấy danh sách Hãng sản xuất
const getBrands = async (req, res) => {
    try {
        const brands = await HangSanXuat.findAll({ order: [['tenHang', 'ASC']] });
        res.status(200).json({ success: true, data: brands });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// API lấy danh sách Loại máy
const getCategories = async (req, res) => {
    try {
        const categories = await LoaiMay.findAll({ order: [['tenLoai', 'ASC']] });
        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getProductSerials = async (req, res) => {
    try {
        const { ChiTietMay } = require('../models/index');
        const serials = await ChiTietMay.findAll({
            where: { maModel: req.params.id, trangThai: 'Trong kho' },
            attributes: ['soSerial']
        });
        res.status(200).json({ success: true, data: serials });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getCompatibleParts = async (req, res) => {
    try {
        const parts = await LinhKien.findAll({
            include: [{
                model: LinhKienTuongThich,
                where: { maModel: req.params.id },
                attributes: ['ghiChu']
            }],
            order: [['tenLk', 'ASC']]
        });
        res.json({ success: true, data: parts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const addCompatiblePart = async (req, res) => {
    try {
        const { maLk, ghiChu } = req.body;
        const maModel = req.params.id;

        const [compatibility, created] = await LinhKienTuongThich.findOrCreate({
            where: { maModel, maLk },
            defaults: { ghiChu }
        });

        if (!created) {
            await compatibility.update({ ghiChu });
        }

        res.json({ success: true, message: 'Đã cập nhật tương thích linh kiện' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const removeCompatiblePart = async (req, res) => {
    try {
        const { id, maLk } = req.params;
        await LinhKienTuongThich.destroy({
            where: { maModel: id, maLk }
        });
        res.json({ success: true, message: 'Đã xóa tương thích linh kiện' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getBrands,
    getCategories,
    getProductSerials,
    getCompatibleParts,
    addCompatiblePart,
    removeCompatiblePart
};