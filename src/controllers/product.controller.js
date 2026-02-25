const fs = require('fs');
const path = require('path');
const { sequelize, DongMay } = require('../models/index');
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

        const result = await DongMay.findAndCountAll({
            where: whereClause,
            limit: limit,
            offset: offset,
        });

        // Basic stats using giaBan and soLuongTon
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
        const product = await DongMay.findByPk(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
        }
        res.status(200).json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createProduct = async (req, res) => {
    try {
        const { maModel, tenModel, giaNhap, giaBan, soLuongTon } = req.body;

        const newProduct = await DongMay.create({
            maModel,
            tenModel,
            giaNhap: giaNhap ? Number(giaNhap) : null,
            giaBan: giaBan ? Number(giaBan) : null,
            soLuongTon: soLuongTon ? Number(soLuongTon) : 0
        });

        res.status(201).json({
            success: true,
            message: "Đã thêm máy tính mới vào hệ thống",
            data: newProduct
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const updateProduct = async (req, res) => {
    try {
        const product = await DongMay.findByPk(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: "Không tìm thấy" });

        const dataToUpdate = { ...req.body };
        await product.update(dataToUpdate);

        res.status(200).json({ success: true, data: product });
    } catch (error) {
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

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};