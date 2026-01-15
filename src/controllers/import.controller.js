const { ImportReceipt, ImportReceiptItem, Product, sequelize } = require('../models/index');

// 1. Tạo phiếu nhập hàng
const createImportReceipt = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { note, items } = req.body; // items: [{ productId, quantity, price }]

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: "Danh sách nhập hàng trống" });
        }

        let totalAmount = 0;
        let totalQuantity = 0;

        // Tính tổng tiền và tổng số lượng
        items.forEach(item => {
            totalAmount += Number(item.quantity) * Number(item.price);
            totalQuantity += Number(item.quantity);
        });

        // Tạo phiếu nhập
        let receipt;
        try {

            receipt = await ImportReceipt.create({
                note,
                totalAmount,
                totalBox: totalQuantity
            }, { transaction: t });

        } catch (err) {
            console.error("Error creating ImportReceipt:", err);
            throw err;
        }

        // Tạo chi tiết phiếu nhập và cập nhật kho
        for (const item of items) {

            try {
                await ImportReceiptItem.create({
                    importReceiptId: receipt.id,
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price
                }, { transaction: t });
            } catch (err) {
                console.error("Error creating ImportReceiptItem:", err);
                throw err;
            }

            // Cập nhật số lượng sản phẩm trong kho
            const product = await Product.findByPk(item.productId, { transaction: t });
            if (product) {
                await product.update({
                    stock: product.stock + Number(item.quantity)
                }, { transaction: t });
            }
        }

        await t.commit();
        res.status(201).json({ success: true, message: "Nhập hàng thành công!", data: receipt });

    } catch (error) {
        await t.rollback();
        console.error("Lỗi nhập hàng:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Lấy lịch sử nhập hàng
const getImportHistory = async (req, res) => {
    try {
        const receipts = await ImportReceipt.findAll({
            include: [
                {
                    model: Product,
                    through: { attributes: ['quantity', 'price'] }
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({ success: true, data: receipts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Lấy chi tiết phiếu nhập
const getImportReceiptById = async (req, res) => {
    try {
        const { id } = req.params;
        const receipt = await ImportReceipt.findOne({
            where: { id },
            include: [
                {
                    model: Product,
                    through: { attributes: ['quantity', 'price'] }
                }
            ]
        });

        if (!receipt) {
            return res.status(404).json({ success: false, message: "Phiếu nhập không tồn tại" });
        }

        res.status(200).json({ success: true, data: receipt });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createImportReceipt,
    getImportHistory,
    getImportReceiptById
};
