const fs = require('fs');
const path = require('path');
const sequelize = require('../config/database');
const { Op } = require('sequelize');
const { Product, Order, User } = require('../models/index')

const getAllProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        if (isNaN(page) || page < 1) {
            page = 1;
        }
        const limit = parseInt(req.query.limit) || 5; // Mặc định 5 sản phẩm/trang
        const offset = (page - 1) * limit;  
        const { search } = req.query;
        let whereClause = {};
        if (search) {
            whereClause = {
                name: {
                    [Op.iLike]: `%${search}%`
                }
            };
        }

        const result = await Product.findAndCountAll({
            where: whereClause,
            limit: limit,
            offset: offset,
            order: [['createdAt', 'DESC']]
        });

        const stats = await Product.findAll({
            where: whereClause,
            attributes: [
                [sequelize.fn('SUM', sequelize.literal('price * stock')), 'totalValue']
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
        const product = await Product.findByPk(req.params.id);
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
        const { name, price, cpu, ram, stock} = req.body;
        const imagePath = req.file ? `public/uploads/${req.file.filename}` : null;
        const newProduct = await Product.create({
            name,
            price: Number(price),
            cpu,
            ram,
            stock: Number(stock),
            image: imagePath
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
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: "Không tìm thấy" });
        const dataToUpdate = { ...req.body };
        if (req.file) {
            deleteFile(product.image);
            dataToUpdate.image = `public/uploads/${req.file.filename}`;
        }

        await product.update(dataToUpdate);
        res.status(200).json({ success: true, data: product });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: "Không tìm thấy" });
        deleteFile(product.image);
        await product.destroy();
        res.status(200).json({ success: true, message: "Đã xóa thành công sản phẩm và ảnh" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteFile = (filePath) => {
    if (!filePath) return;
    const fullPath = path.join(__dirname, '../../', filePath);
    if (fs.existsSync(fullPath)) {
        fs.unlink(fullPath, (err) => {
            if (err) console.error("Lỗi khi xóa file cũ:", err);
            else console.log("Đã xóa file cũ thành công:", filePath);
        });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};