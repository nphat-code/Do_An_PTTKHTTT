const { PhieuNhap, CtNhapMay, DongMay, sequelize } = require('../models/index');

const generateImportCode = () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(100 + Math.random() * 900); // 3-digit random number
    return `PN${dateStr}_${randomNum}`;
};

// 1. Tạo phiếu nhập hàng (nhập máy)
const createImportReceipt = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        // Assume note maps to nothing specifically currently except maybe we could add it to a log, but we will ignore it.
        // Needs maNcc, maNv, maHttt. We will make them optional or fake them for now to keep the code working.
        const { note, items, maNcc, maNv, maHttt } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: "Danh sách nhập hàng trống" });
        }

        let totalAmount = 0;

        // Tính tổng tiền
        items.forEach(item => {
            totalAmount += Number(item.quantity) * Number(item.price);
        });

        // Tạo phiếu nhập
        let receipt;
        try {
            const maPn = generateImportCode();
            receipt = await PhieuNhap.create({
                maPn: maPn,
                ngayNhap: new Date(),
                tongTien: totalAmount,
                maNcc: maNcc || null,
                maNv: maNv || null, // from req.user maybe
                maHttt: maHttt || null,
            }, { transaction: t });

        } catch (err) {
            console.error("Error creating PhieuNhap:", err);
            throw err;
        }

        // Tạo chi tiết phiếu nhập và cập nhật kho
        for (const item of items) {
            try {
                await CtNhapMay.create({
                    maPn: receipt.maPn,
                    maModel: item.productId, // treating productId as maModel
                    soLuong: item.quantity,
                    donGia: item.price
                }, { transaction: t });
            } catch (err) {
                console.error("Error creating CtNhapMay:", err);
                throw err;
            }

            // Cập nhật số lượng sản phẩm trong kho
            const product = await DongMay.findByPk(item.productId, { transaction: t });
            if (product) {
                await product.update({
                    soLuongTon: product.soLuongTon + Number(item.quantity)
                }, { transaction: t });
            }
        }

        await t.commit();
        res.status(201).json({ success: true, message: "Nhập hàng thành công!", data: receipt });

    } catch (error) {
        if (t && !t.finished) await t.rollback();
        console.error("Lỗi nhập hàng:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Lấy lịch sử nhập hàng
const getImportHistory = async (req, res) => {
    try {
        const receipts = await PhieuNhap.findAll({
            include: [
                {
                    model: DongMay,
                    through: { attributes: ['soLuong', 'donGia'] }
                }
            ],
            order: [['ngayNhap', 'DESC']]
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
        const receipt = await PhieuNhap.findOne({
            where: { maPn: id }, // ID here means maPn
            include: [
                {
                    model: DongMay,
                    through: { attributes: ['soLuong', 'donGia'] }
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
