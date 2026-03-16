const { sequelize, HoaDon, CtHoaDon, DongMay, NhanVien, Kho, ChiTietMay, LoaiMay, HangSanXuat } = require('../models/index');
const { Op } = require('sequelize');

// Báo cáo doanh thu theo khoảng thời gian
const getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const where = {
            trangThai: { [Op.ne]: 'Đã hủy' }
        };

        if (startDate && endDate) {
            where.ngayLap = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const orders = await HoaDon.findAll({
            where,
            attributes: [
                [sequelize.fn('date', sequelize.col('ngayLap')), 'date'],
                [sequelize.fn('SUM', sequelize.col('tongTien')), 'revenue'],
                [sequelize.fn('COUNT', sequelize.col('maHd')), 'orderCount']
            ],
            group: [sequelize.fn('date', sequelize.col('ngayLap'))],
            order: [[sequelize.fn('date', sequelize.col('ngayLap')), 'ASC']],
            raw: true
        });

        // Tính tổng quan
        const summary = await HoaDon.findOne({
            where,
            attributes: [
                [sequelize.fn('SUM', sequelize.col('tongTien')), 'totalRevenue'],
                [sequelize.fn('COUNT', sequelize.col('maHd')), 'totalOrders']
            ],
            raw: true
        });

        res.json({
            success: true,
            data: {
                timeline: orders,
                summary: {
                    totalRevenue: parseFloat(summary.totalRevenue || 0),
                    totalOrders: parseInt(summary.totalOrders || 0)
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Báo cáo tồn kho hiện tại
const getInventoryReport = async (req, res) => {
    try {
        // 1. Tổng giá trị tồn kho (theo giá bán hiện tại)
        const totalValueData = await DongMay.findAll({
            attributes: [
                [sequelize.fn('SUM', sequelize.literal('"giaBan" * "soLuongTon"')), 'totalValue'],
                [sequelize.fn('SUM', sequelize.col('soLuongTon')), 'totalItems']
            ],
            raw: true
        });

        // 2. Tồn kho theo loại máy
        const stockByCategory = await LoaiMay.findAll({
            include: [{
                model: DongMay,
                attributes: []
            }],
            attributes: [
                'tenLoai',
                [sequelize.fn('SUM', sequelize.col('DongMays.soLuongTon')), 'quantity']
            ],
            group: ['LoaiMay.maLoai', 'LoaiMay.tenLoai'],
            raw: true
        });

        // 3. Tồn kho theo hãng
        const stockByBrand = await HangSanXuat.findAll({
            include: [{
                model: DongMay,
                attributes: []
            }],
            attributes: [
                'tenHang',
                [sequelize.fn('SUM', sequelize.col('DongMays.soLuongTon')), 'quantity']
            ],
            group: ['HangSanXuat.maHang', 'HangSanXuat.tenHang'],
            raw: true
        });

        // 4. Các mặt hàng sắp hết (dưới 5 máy)
        const lowStock = await DongMay.findAll({
            where: { soLuongTon: { [Op.lt]: 5 } },
            attributes: ['maModel', 'tenModel', 'soLuongTon'],
            order: [['soLuongTon', 'ASC']],
            limit: 10
        });

        res.json({
            success: true,
            data: {
                summary: {
                    totalValue: parseFloat(totalValueData[0].totalValue || 0),
                    totalItems: parseInt(totalValueData[0].totalItems || 0)
                },
                byCategory: stockByCategory,
                byBrand: stockByBrand,
                lowStock
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Báo cáo hiệu suất bán hàng của nhân viên
const getStaffPerformance = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const where = {
            trangThai: { [Op.ne]: 'Đã hủy' }
        };

        if (startDate && endDate) {
            where.ngayLap = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const performance = await NhanVien.findAll({
            attributes: ['maNv', 'hoTen'],
            include: [{
                model: HoaDon,
                as: 'HoaDons',
                attributes: [],
                where: where
            }],
            attributes: {
                include: [
                    [sequelize.fn('COUNT', sequelize.col('HoaDons.maHd')), 'orderCount'],
                    [sequelize.fn('SUM', sequelize.col('HoaDons.tongTien')), 'totalRevenue']
                ]
            },
            group: ['NhanVien.maNv', 'NhanVien.hoTen'],
            order: [[sequelize.literal('"totalRevenue"'), 'DESC']],
            raw: true
        });

        res.json({ success: true, data: performance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getSalesReport,
    getInventoryReport,
    getStaffPerformance
};
