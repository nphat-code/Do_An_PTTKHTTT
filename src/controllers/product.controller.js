const Product = require('../models/product.model');

const getAllProducts = async (req, res) => {
    try {
        const products = await Product.findAll();
        return res.status(200).json({ success: true, data: products });
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
        if (!product) {
            return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
        }
        const updateData = { ...req.body };
        if (req.file) {
            updateData.image = `public/uploads/${req.file.filename}`;
        }
        await product.update(updateData);
        res.status(200).json({ 
            success: true, 
            message: "Cập nhật thành công",
            data: product 
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
        }
        await product.destroy();
        res.status(200).json({ success: true, message: "Đã xóa thành công" });
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