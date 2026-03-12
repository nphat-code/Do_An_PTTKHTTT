const { PhieuNhap, CtNhapMay, DongMay, ChiTietMay, Kho, NhanVien, NhaCungCap, LinhKien, CtNhapLk, KhoLinhKien, sequelize } = require('../models/index');

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
        const { note, items, maNcc, maNv, maHttt, maKho } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: "Danh sách nhập hàng trống" });
        }

        // Kiểm tra kho
        const selectedKho = maKho || 'KHO_TT'; // Mặc định Kho Trung Tâm
        const khoExists = await Kho.findByPk(selectedKho);
        if (!khoExists) {
            return res.status(400).json({ success: false, message: "Mã kho không hợp lệ" });
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
                ghiChu: note || '',
                maNcc: maNcc || null,
                maNv: maNv || null,
                maHttt: maHttt || null,
                maKho: selectedKho,
            }, { transaction: t });
        } catch (err) {
            console.error("Error creating PhieuNhap:", err);
            throw err;
        }

        // Tạo chi tiết phiếu nhập và cập nhật kho
        for (const item of items) {
            if (item.type === 'sparepart') {
                // Nhập linh kiện
                await CtNhapLk.create({
                    maPn: receipt.maPn,
                    maLk: item.productId,
                    soLuong: item.quantity,
                    donGia: item.price
                }, { transaction: t });

                // Cập nhật tồn kho linh kiện toàn cục
                const part = await LinhKien.findByPk(item.productId, { transaction: t });
                if (part) {
                    await part.update({
                        soLuongTon: Number(part.soLuongTon || 0) + Number(item.quantity)
                    }, { transaction: t });
                }

                // Cập nhật tồn kho linh kiện theo kho (KhoLinhKien)
                const [stockRecord, created] = await KhoLinhKien.findOrCreate({
                    where: { maLk: item.productId, maKho: selectedKho },
                    defaults: { soLuongTon: item.quantity },
                    transaction: t
                });

                if (!created) {
                    await stockRecord.update({
                        soLuongTon: Number(stockRecord.soLuongTon || 0) + Number(item.quantity)
                    }, { transaction: t });
                }
            } else {
                // Nhập máy (mặc định hoặc item.type === 'laptop')
                await CtNhapMay.create({
                    maPn: receipt.maPn,
                    maModel: item.productId,
                    soLuong: item.quantity,
                    donGia: item.price
                }, { transaction: t });

                // Nếu có nhập mảng các model serial / IMEI
                if (item.serials && Array.isArray(item.serials)) {
                    for (const serial of item.serials) {
                        const existingSerial = await ChiTietMay.findByPk(serial, { transaction: t });
                        if (existingSerial) {
                            throw new Error(`Số Serial/IMEI ${serial} đã tồn tại trong hệ thống`);
                        }

                        await ChiTietMay.create({
                            soSerial: serial,
                            trangThai: 'Trong kho',
                            maModel: item.productId,
                            maKho: selectedKho
                        }, { transaction: t });
                    }
                }

                // Cập nhật số lượng sản phẩm trong kho (Tổng)
                const product = await DongMay.findByPk(item.productId, { transaction: t });
                if (product) {
                    await product.update({
                        soLuongTon: product.soLuongTon + Number(item.quantity)
                    }, { transaction: t });
                }
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
                },
                {
                    model: LinhKien,
                    through: { attributes: ['soLuong', 'donGia'] }
                },
                { model: NhanVien, attributes: ['hoTen'] },
                { model: NhaCungCap, attributes: ['tenNcc'] },
                { model: Kho, attributes: ['tenKho'] }
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
                },
                {
                    model: LinhKien,
                    through: { attributes: ['soLuong', 'donGia'] }
                },
                { model: NhanVien, attributes: ['hoTen'] },
                { model: NhaCungCap, attributes: ['tenNcc'] },
                { model: Kho, attributes: ['tenKho'] }
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
