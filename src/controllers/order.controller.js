const { sequelize, Product, User, Order, OrderItem } = require('../models/index');
const bcrypt = require('bcryptjs');

const createOrder = async (req, res) => {
    // Khởi tạo Transaction để đảm bảo nếu một bước lỗi thì toàn bộ quá trình sẽ bị hủy (rollback)
    const t = await sequelize.transaction();

    try {
        const { customerInfo, cartItems } = req.body;

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ success: false, message: "Giỏ hàng trống" });
        }

        // Tạo mật khẩu mặc định (số điện thoại)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(customerInfo.phone, salt);

        // 1. Tìm hoặc Tạo khách hàng dựa trên số điện thoại
        const [user] = await User.findOrCreate({
            where: { phone: customerInfo.phone },
            defaults: {
                fullName: customerInfo.fullName,
                email: customerInfo.email,
                address: customerInfo.address,
                password: hashedPassword, // Thêm mật khẩu mặc định
                role: 'customer'
            },
            transaction: t
        });

        let totalAmount = 0;
        const itemsToCreate = [];

        // 2. Kiểm tra kho và tính tổng tiền
        for (let item of cartItems) {
            const product = await Product.findByPk(item.id, { transaction: t });

            if (!product) {
                throw new Error(`Sản phẩm ID ${item.id} không tồn tại`);
            }

            if (product.stock < item.quantity) {
                throw new Error(`Sản phẩm ${product.name} chỉ còn ${product.stock} máy, không đủ số lượng bạn yêu cầu`);
            }

            // Tính toán tổng tiền
            const itemPrice = parseFloat(product.price);
            totalAmount += itemPrice * item.quantity;

            // Chuẩn bị dữ liệu cho bảng trung gian OrderItem
            itemsToCreate.push({
                productId: product.id,
                quantity: item.quantity,
                price: itemPrice // Lưu giá tại thời điểm mua
            });

            // 3. Trừ số lượng trong kho
            await product.update({
                stock: product.stock - item.quantity
            }, { transaction: t });
        }

        // 4. Tạo đơn hàng chính
        const order = await Order.create({
            userId: user.id,
            totalAmount: totalAmount,
            status: 'pending'
        }, { transaction: t });

        // 5. Lưu chi tiết các sản phẩm vào bảng OrderItem
        // Thêm orderId vào từng item
        const orderItemsWithId = itemsToCreate.map(item => ({
            ...item,
            orderId: order.id
        }));

        await OrderItem.bulkCreate(orderItemsWithId, { transaction: t });

        // Hoàn tất giao dịch
        await t.commit();

        res.status(201).json({
            success: true,
            message: "Đặt hàng thành công!",
            orderId: order.id
        });

    } catch (error) {
        // Nếu có bất kỳ lỗi nào, hủy bỏ toàn bộ thay đổi trong database
        await t.rollback();
        res.status(400).json({ success: false, message: error.message });
    }
};

// Hàm lấy danh sách đơn hàng cho trang Admin
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            include: [
                { model: User, attributes: ['fullName', 'phone'] },
                { model: Product, through: { attributes: ['quantity', 'price'] } }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Hàm lấy chi tiết một đơn hàng
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id, {
            include: [
                { model: User },
                {
                    model: Product,
                    through: { attributes: ['quantity', 'price'] }
                }
            ]
        });
        if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
        res.status(200).json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateOrderStatus = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { status } = req.body; // Trạng thái mới: 'completed', 'cancelled', v.v.

        // 1. Tìm đơn hàng hiện tại cùng các sản phẩm trong đó
        const order = await Order.findByPk(id, {
            include: [{ model: Product }],
            transaction: t
        });

        if (!order) {
            throw new Error("Không tìm thấy đơn hàng");
        }

        // 2. Xử lý logic cộng lại kho nếu trạng thái mới là 'cancelled' 
        // và trạng thái cũ KHÔNG PHẢI là 'cancelled' (tránh cộng dồn nhiều lần)
        if (status === 'cancelled' && order.status !== 'cancelled') {
            for (let product of order.products) {
                // Lấy số lượng từ bảng trung gian order_item
                const quantityToReturn = product.order_item.quantity;

                // Cộng lại vào kho
                await product.update({
                    stock: product.stock + quantityToReturn
                }, { transaction: t });
            }
        }
        // (Tùy chọn) Nếu chuyển từ 'cancelled' sang trạng thái khác thì phải trừ kho đi
        else if (order.status === 'cancelled' && status !== 'cancelled') {
            for (let product of order.products) {
                const quantityToSubtract = product.order_item.quantity;
                if (product.stock < quantityToSubtract) {
                    throw new Error(`Sản phẩm ${product.name} đã hết hàng, không thể khôi phục đơn hàng này.`);
                }
                await product.update({
                    stock: product.stock - quantityToSubtract
                }, { transaction: t });
            }
        }

        // 3. Cập nhật trạng thái đơn hàng
        await order.update({ status }, { transaction: t });

        await t.commit();
        res.status(200).json({ success: true, message: "Cập nhật trạng thái thành công" });
    } catch (error) {
        await t.rollback();
        res.status(400).json({ success: false, message: error.message });
    }
};

module.exports = {
    createOrder,
    getAllOrders,
    getOrderById,
    updateOrderStatus
};