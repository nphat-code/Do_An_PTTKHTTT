const { sequelize, DongMay, KhachHang, HoaDon, CtHoaDon } = require('../models/index');
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
            // Nếu chưa có thì tạo mới, fake ID for now if not provided
            customer = await KhachHang.create({
                maKh: `KH_${Date.now()}`,
                hoTen: customerInfo.fullName,
                email: customerInfo.email,
                sdt: customerInfo.phone,
                diaChi: customerInfo.address,
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
        const order = await HoaDon.create({
            maHd: maHd,
            ngayLap: new Date(),
            tongTien: totalAmount,
            ghiChu: customerInfo.ghiChu || '',
            trangThai: 'Chờ xử lý',
            maKh: customer.maKh,
            maHttt: maHttt || null,
            maKm: maKm || null,
        }, { transaction: t });

        // 5. Lưu chi tiết các sản phẩm vào bảng CtHoaDon
        // Thêm maHd vào từng item
        const orderItemsWithId = itemsToCreate.map(item => ({
            ...item,
            maHd: order.maHd
        }));

        await CtHoaDon.bulkCreate(orderItemsWithId, { transaction: t });

        // Hoàn tất giao dịch
        await t.commit();

        res.status(201).json({
            success: true,
            message: "Đặt hàng thành công!",
            orderId: order.maHd // Return maHd instead of id
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
        const orders = await HoaDon.findAll({
            include: [
                { model: KhachHang, attributes: ['hoTen', 'sdt'] },
                { model: DongMay, through: { attributes: ['soLuong', 'donGia', 'thanhTien'] } }
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
                { model: KhachHang },
                {
                    model: DongMay,
                    through: { attributes: ['soLuong', 'donGia', 'thanhTien'] }
                }
            ]
        });
        if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy hóa đơn" });
        res.status(200).json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const ORDER_STATUSES = ['Chờ xử lý', 'Đã xác nhận', 'Đang giao', 'Đã giao', 'Đã hủy'];

const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { trangThai } = req.body;
        if (!trangThai || !ORDER_STATUSES.includes(trangThai)) {
            return res.status(400).json({
                success: false,
                message: 'Trạng thái không hợp lệ. Cho phép: ' + ORDER_STATUSES.join(', ')
            });
        }
        const order = await HoaDon.findByPk(id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn' });
        }
        await order.update({ trangThai });
        res.status(200).json({ success: true, message: 'Đã cập nhật trạng thái', data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getDashboardStats = async (req, res) => {
    try {
        // 2. Thống kê doanh thu theo tháng (12 tháng gần nhất)
        const orders = await HoaDon.findAll({
            attributes: ['ngayLap', 'tongTien'],
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

        // 3. Top 5 sản phẩm bán chạy (using CtHoaDon)
        // Not implemented simply for now without a 'status' to consider only completed ones.
        // Needs a slightly more complex raw query with GROUP BY.
        const processedTopProducts = [];

        // 4. Tổng sản phẩm (DongMay) và Tổng doanh thu (HoaDon)
        const totalProductsCount = await DongMay.count();

        let totalRevenue = 0;
        orders.forEach(order => {
            totalRevenue += parseFloat(order.tongTien || 0);
        });

        res.status(200).json({
            success: true,
            statusStats: [], // No status currently
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

module.exports = {
    createOrder,
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    getDashboardStats,
    getMyOrders,
    updateProfile
};