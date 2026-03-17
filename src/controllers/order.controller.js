const { sequelize, DongMay, KhachHang, HoaDon, CtHoaDon, ChiTietMay, HinhThucThanhToan, NhanVien } = require('../models/index');
const { Op } = require('sequelize');

const generateOrderCode = () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
    return `HD${dateStr}_${randomNum}`;
};

const createOrder = async (req, res) => {
    // Khởi tạo Transaction để đảm bảo nếu một bước lỗi thì toàn bộ quá trình sẽ bị hủy (rollback)
    const t = await sequelize.transaction();

    try {
        const { customerInfo, cartItems, maHttt, maKm } = req.body;

        if (!customerInfo || !cartItems || cartItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: !customerInfo ? "Thiếu thông tin khách hàng" : "Giỏ hàng trống"
            });
        }

        // 1. Tìm xem user đã tồn tại chưa (trong KhachHang)
        let customer = await KhachHang.findOne({
            where: {
                [Op.or]: [
                    { sdt: customerInfo.phone },
                    { email: customerInfo.email }
                ]
            },
            transaction: t
        });

        if (customer) {
            // Update thông tin mới nhất
            await customer.update({
                hoTen: customerInfo.fullName,
                diaChi: customerInfo.address,
                sdt: customerInfo.phone,
                email: customerInfo.email
            }, { transaction: t });
        } else {
            // Sequential ID generation for new customer
            const lastUser = await KhachHang.findOne({
                order: [['maKh', 'DESC']],
                transaction: t
            });
            let nextMaKh = 'KH001';
            if (lastUser && lastUser.maKh.startsWith('KH')) {
                const lastNum = parseInt(lastUser.maKh.substring(2));
                if (!isNaN(lastNum)) {
                    nextMaKh = `KH${(lastNum + 1).toString().padStart(3, '0')}`;
                }
            }

            customer = await KhachHang.create({
                maKh: nextMaKh,
                hoTen: customerInfo.fullName,
                email: customerInfo.email || null,
                sdt: customerInfo.phone,
                diaChi: customerInfo.address || null,
                trangThai: true // Ensure new customers from POS are active
            }, { transaction: t });
        }

        let totalAmount = 0;
        const itemsToCreate = [];

        // 2. Kiểm tra kho và tính tổng tiền
        for (let item of cartItems) {
            const product = await DongMay.findByPk(item.id, { transaction: t });

            if (!product) {
                throw new Error(`Dòng máy ID ${item.id} không tồn tại`);
            }

            if (product.soLuongTon < item.quantity) {
                throw new Error(`Sản phẩm ${product.tenModel} chỉ còn ${product.soLuongTon} máy, không đủ số lượng bạn yêu cầu`);
            }

            // Tính toán tổng tiền
            const itemPrice = parseFloat(product.giaBan || 0);
            const thanhTien = itemPrice * item.quantity;
            totalAmount += thanhTien;

            // Chuẩn bị dữ liệu cho bảng trung gian CtHoaDon
            itemsToCreate.push({
                maModel: product.maModel,
                soLuong: item.quantity,
                donGia: itemPrice,
                thanhTien: thanhTien
            });

            // 3. Trừ số lượng trong kho
            await product.update({
                soLuongTon: product.soLuongTon - item.quantity
            }, { transaction: t });
        }

        // 4. Tạo hóa đơn chính
        const maHd = generateOrderCode();
        // Validate maHttt - only use if it's a valid FK, otherwise null
        let validMaHttt = null;
        if (maHttt) {
            const httt = await HinhThucThanhToan.findByPk(maHttt, { transaction: t });
            if (httt) validMaHttt = maHttt;
        }
        const order = await HoaDon.create({
            maHd: maHd,
            ngayLap: new Date(),
            tongTien: totalAmount,
            ghiChu: customerInfo.ghiChu || '',
            trangThai: 'Chờ xử lý',
            maKh: customer.maKh,
            maNv: req.user ? req.user.maNv : null, // Record creator staff
            maHttt: validMaHttt,
            maKm: maKm || null,
        }, { transaction: t });

        // 5. Lưu chi tiết các sản phẩm vào bảng CtHoaDon
        // Thêm maHd vào từng item
        const orderItemsWithId = itemsToCreate.map(item => ({
            ...item,
            maHd: order.maHd
        }));

        await CtHoaDon.bulkCreate(orderItemsWithId, { transaction: t });

        // 6. Cập nhật bảng ChiTietMay (Xuất kho theo Serial)
        for (let item of cartItems) {
            let serialsToUpdate = [];

            if (item.serials && Array.isArray(item.serials) && item.serials.length > 0) {
                // Use provided serials
                if (item.serials.length !== item.quantity) {
                    throw new Error(`Số lượng serial (${item.serials.length}) không khớp với số lượng sản phẩm (${item.quantity}) cho model ${item.id}`);
                }

                serialsToUpdate = await ChiTietMay.findAll({
                    where: {
                        soSerial: { [Op.in]: item.serials },
                        maModel: item.id,
                        trangThai: 'Trong kho'
                    },
                    transaction: t
                });

                if (serialsToUpdate.length < item.quantity) {
                    throw new Error(`Một số serial cho sản phẩm ${item.id} không hợp lệ hoặc đã bán/không có trong kho`);
                }
            } else {
                // Auto-allocate serials
                serialsToUpdate = await ChiTietMay.findAll({
                    where: {
                        maModel: item.id,
                        trangThai: 'Trong kho'
                    },
                    limit: item.quantity,
                    transaction: t
                });

                if (serialsToUpdate.length < item.quantity) {
                    throw new Error(`Kho lỗi đồng bộ: Không đủ số lượng Serial còn trong kho cho sản phẩm ${item.id}`);
                }
            }

            // Update each found serial
            for (let serial of serialsToUpdate) {
                await serial.update({
                    trangThai: 'Đã bán',
                    maHd: order.maHd
                }, { transaction: t });
            }
        }

        // Hoàn tất giao dịch
        await t.commit();

        res.status(201).json({
            success: true,
            message: "Đặt hàng thành công!",
            orderId: order.maHd,
            totalAmount: totalAmount
        });

    } catch (error) {
        // Nếu có bất kỳ lỗi nào, hủy bỏ toàn bộ thay đổi trong database
        if (t && !t.finished) await t.rollback();
        res.status(400).json({ success: false, message: error.message });
    }
};

// Hàm lấy danh sách hóa đơn cho trang Admin
const getAllOrders = async (req, res) => {
    try {
        const { search } = req.query;
        let where = {};
        let customerWhere = {};

        if (search) {
            where = {
                [Op.or]: [
                    { maHd: { [Op.iLike]: `%${search}%` } },
                    { '$KhachHang.sdt$': { [Op.iLike]: `%${search}%` } }
                ]
            };
        }

        const orders = await HoaDon.findAll({
            where,
            include: [
                {
                    model: KhachHang,
                    attributes: ['hoTen', 'sdt'],
                    required: false
                },
                {
                    model: NhanVien,
                    attributes: ['hoTen'],
                    required: false
                },
                {
                    model: DongMay,
                    through: { attributes: ['soLuong', 'donGia', 'thanhTien'] },
                    required: false
                }
            ],
            order: [['ngayLap', 'DESC']]
        });
        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Hàm lấy chi tiết một hóa đơn
const getOrderById = async (req, res) => {
    try {
        const order = await HoaDon.findByPk(req.params.id, {
            include: [
                {
                    model: KhachHang,
                    required: false
                },
                {
                    model: NhanVien,
                    attributes: ['hoTen'],
                    required: false
                },
                {
                    model: DongMay,
                    through: { attributes: ['soLuong', 'donGia', 'thanhTien'] },
                    required: false
                }
            ]
        });
        if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy hóa đơn" });

        const orderData = order.toJSON();

        // Fetch serial IDs for each device in the order
        for (let product of orderData.DongMays) {
            const serials = await ChiTietMay.findAll({
                where: { maHd: order.maHd, maModel: product.maModel, trangThai: 'Đã bán' },
                attributes: ['soSerial']
            });
            product.serials = serials.map(s => s.soSerial);
        }

        res.status(200).json({ success: true, data: orderData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const ORDER_STATUSES = ['Chờ xử lý', 'Đang giao hàng', 'Đã hoàn thành', 'Đã hủy'];

const updateOrderStatus = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { trangThai } = req.body;
        if (!trangThai || !ORDER_STATUSES.includes(trangThai)) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'Trạng thái không hợp lệ. Cho phép: ' + ORDER_STATUSES.join(', ')
            });
        }
        const order = await HoaDon.findByPk(id, { transaction: t });
        if (!order) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn' });
        }

        const oldStatus = order.trangThai;

        // Nếu chuyển sang "Đã hủy" và trước đó CHƯA bị hủy → hoàn lại tồn kho
        if (trangThai === 'Đã hủy' && oldStatus !== 'Đã hủy') {
            const orderItems = await CtHoaDon.findAll({
                where: { maHd: id },
                transaction: t
            });

            for (const item of orderItems) {
                const product = await DongMay.findByPk(item.maModel, { transaction: t });
                if (product) {
                    await product.update({
                        soLuongTon: product.soLuongTon + item.soLuong
                    }, { transaction: t });
                }
            }
        }

        // Nếu từ "Đã hủy" chuyển sang trạng thái khác → trừ lại tồn kho
        if (oldStatus === 'Đã hủy' && trangThai !== 'Đã hủy') {
            const orderItems = await CtHoaDon.findAll({
                where: { maHd: id },
                transaction: t
            });

            for (const item of orderItems) {
                const product = await DongMay.findByPk(item.maModel, { transaction: t });
                if (product) {
                    if (product.soLuongTon < item.soLuong) {
                        await t.rollback();
                        return res.status(400).json({
                            success: false,
                            message: `Sản phẩm ${product.tenModel} không đủ tồn kho (còn ${product.soLuongTon})`
                        });
                    }
                    await product.update({
                        soLuongTon: product.soLuongTon - item.soLuong
                    }, { transaction: t });
                }
            }
        }

        await order.update({ trangThai }, { transaction: t });
        await t.commit();

        res.status(200).json({ success: true, message: 'Đã cập nhật trạng thái', data: order });
    } catch (error) {
        if (t && !t.finished) await t.rollback();
        res.status(500).json({ success: false, message: error.message });
    }
};

const getDashboardStats = async (req, res) => {
    try {
        // 2. Thống kê doanh thu theo tháng (12 tháng gần nhất) - không tính đơn đã hủy
        const orders = await HoaDon.findAll({
            attributes: ['ngayLap', 'tongTien', 'trangThai'],
            where: { trangThai: { [Op.ne]: 'Đã hủy' } },
            raw: true
        });

        const revenueByMonth = {};
        // Init 12 months
        for (let i = 0; i < 12; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const key = `${date.getMonth() + 1}/${date.getFullYear()}`;
            revenueByMonth[key] = 0;
        }

        orders.forEach(order => {
            if (order.ngayLap) {
                const date = new Date(order.ngayLap);
                const key = `${date.getMonth() + 1}/${date.getFullYear()}`;
                if (revenueByMonth[key] !== undefined) {
                    revenueByMonth[key] += parseFloat(order.tongTien || 0);
                }
            }
        });

        // 3. Thống kê trạng thái đơn hàng (Doughnut chart)
        const statusStats = await HoaDon.findAll({
            attributes: [
                'trangThai',
                [sequelize.fn('COUNT', sequelize.col('maHd')), 'count']
            ],
            group: ['trangThai'],
            raw: true
        });

        // 4. Top 5 sản phẩm bán chạy
        const topProductsData = await sequelize.query(`
            SELECT dm."tenModel" as name, SUM(ct."soLuong") as "totalSold", SUM(ct."thanhTien") as "totalRevenue"
            FROM "CT_HOA_DON" ct
            JOIN "HOA_DON" hd ON ct."maHd" = hd."maHd"
            JOIN "DONG_MAY" dm ON ct."maModel" = dm."maModel"
            WHERE hd."trangThai" != 'Đã hủy'
            GROUP BY dm."maModel", dm."tenModel"
            ORDER BY "totalSold" DESC
            LIMIT 5
        `, { type: sequelize.QueryTypes.SELECT });

        const processedTopProducts = topProductsData.map(item => ({
            name: item.name,
            totalSold: parseInt(item.totalSold) || 0,
            totalRevenue: parseFloat(item.totalRevenue) || 0
        }));

        // 5. Tổng sản phẩm (DongMay) và Tổng doanh thu (HoaDon)
        const totalProductsCount = await DongMay.count();

        let totalRevenue = 0;
        orders.forEach(order => {
            totalRevenue += parseFloat(order.tongTien || 0);
        });

        res.status(200).json({
            success: true,
            statusStats,
            revenueByMonth,
            topProducts: processedTopProducts,
            totalProducts: totalProductsCount,
            totalValue: totalRevenue
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy đơn hàng của khách hàng đang đăng nhập
const getMyOrders = async (req, res) => {
    try {
        const maKh = req.user.maKh;
        if (!maKh) {
            return res.status(400).json({ success: false, message: 'Không tìm thấy thông tin khách hàng' });
        }

        const orders = await HoaDon.findAll({
            where: { maKh },
            include: [{
                model: DongMay,
                through: { attributes: ['soLuong', 'donGia', 'thanhTien'] }
            }],
            order: [['ngayLap', 'DESC']]
        });

        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Cập nhật thông tin cá nhân khách hàng
const updateProfile = async (req, res) => {
    try {
        const maKh = req.user.maKh;
        const { hoTen, sdt, diaChi } = req.body;

        const customer = await KhachHang.findByPk(maKh);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng' });
        }

        await customer.update({
            hoTen: hoTen || customer.hoTen,
            sdt: sdt !== undefined ? sdt : customer.sdt,
            diaChi: diaChi !== undefined ? diaChi : customer.diaChi
        });

        res.status(200).json({
            success: true,
            message: 'Cập nhật thông tin thành công',
            data: {
                id: customer.maKh,
                fullName: customer.hoTen,
                email: customer.email,
                phone: customer.sdt,
                address: customer.diaChi
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getSerialsForOrder = async (req, res) => {
    try {
        const { id, modelId } = req.params;
        const serials = await ChiTietMay.findAll({
            where: { maHd: id, maModel: modelId, trangThai: 'Đã bán' },
            attributes: ['soSerial']
        });
        res.json({ success: true, data: serials.map(s => s.soSerial) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getPaymentMethods = async (req, res) => {
    try {
        const methods = await HinhThucThanhToan.findAll({ order: [['tenHttt', 'ASC']] });
        res.json({ success: true, data: methods });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createOrder,
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    getDashboardStats,
    getMyOrders,
    updateProfile,
    getSerialsForOrder,
    getPaymentMethods
};