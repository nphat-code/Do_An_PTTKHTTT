const { sequelize, Product, User, Order, OrderItem } = require('../models/index');

const createOrder = async (req, res) => {
    // Khởi tạo Transaction để đảm bảo nếu một bước lỗi thì toàn bộ quá trình sẽ bị hủy (rollback)
    const t = await sequelize.transaction();

    try {
        const { customerInfo, cartItems } = req.body;

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ success: false, message: "Giỏ hàng trống" });
        }

        // 1. Tìm hoặc Tạo khách hàng dựa trên số điện thoại
        const [user] = await User.findOrCreate({
            where: { phone: customerInfo.phone },
            defaults: {
                fullName: customerInfo.fullName,
                email: customerInfo.email,
                address: customerInfo.address
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

module.exports = {
    createOrder,
    getAllOrders,
    getOrderById
};