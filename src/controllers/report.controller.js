const {
    sequelize, HoaDon, CtHoaDon, DongMay, NhanVien, Kho,
    ChiTietMay, LoaiMay, HangSanXuat, PhieuBaoHanh,
    ChiTietSuaChua, LinhKien, KhachHang
} = require('../models/index');
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

        const summaryData = await HoaDon.findAll({
            where,
            attributes: ['tongTien']
        });

        const totalRevenue = summaryData.reduce((acc, curr) => acc + parseFloat(curr.tongTien || 0), 0);
        const totalOrders = summaryData.length;

        res.json({
            success: true,
            data: {
                timeline: orders,
                summary: {
                    totalRevenue,
                    totalOrders
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
        const dongMays = await DongMay.findAll();
        const totalValue = dongMays.reduce((acc, curr) => acc + (parseFloat(curr.giaBan || 0) * (curr.soLuongTon || 0)), 0);
        const totalItems = dongMays.reduce((acc, curr) => acc + (curr.soLuongTon || 0), 0);

        const categories = await LoaiMay.findAll({
            include: [{ model: DongMay, attributes: ['soLuongTon'] }]
        });
        const stockByCategory = categories.map(c => ({
            tenLoai: c.tenLoai,
            quantity: (c.DongMays || []).reduce((acc, curr) => acc + (curr.soLuongTon || 0), 0)
        }));

        const brands = await HangSanXuat.findAll({
            include: [{ model: DongMay, attributes: ['soLuongTon'] }]
        });
        const stockByBrand = brands.map(b => ({
            tenHang: b.tenHang,
            quantity: (b.DongMays || []).reduce((acc, curr) => acc + (curr.soLuongTon || 0), 0)
        }));

        const lowStock = await DongMay.findAll({
            where: { soLuongTon: { [Op.lt]: 5 } },
            attributes: ['maModel', 'tenModel', 'soLuongTon'],
            order: [['soLuongTon', 'ASC']],
            limit: 10
        });

        res.json({
            success: true,
            data: {
                summary: { totalValue, totalItems },
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
        const where = { trangThai: { [Op.ne]: 'Đã hủy' } };
        if (startDate && endDate) {
            where.ngayLap = { [Op.between]: [new Date(startDate), new Date(endDate)] };
        }

        const staff = await NhanVien.findAll({
            include: [{
                model: HoaDon,
                as: 'HoaDons',
                where: where,
                required: false
            }]
        });

        const performance = staff.map(s => {
            const orders = s.HoaDons || [];
            return {
                maNv: s.maNv,
                hoTen: s.hoTen,
                orderCount: orders.length,
                totalRevenue: orders.reduce((acc, curr) => acc + parseFloat(curr.tongTien || 0), 0)
            };
        }).sort((a, b) => b.totalRevenue - a.totalRevenue);

        res.json({ success: true, data: performance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4.1 Báo cáo Tài chính & Lợi nhuận
const getFinancialReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const dateWhere = {};
        if (startDate && endDate) {
            dateWhere[Op.between] = [new Date(startDate), new Date(endDate)];
        }

        // Doanh thu bán hàng
        const sales = await HoaDon.findAll({
            where: {
                trangThai: { [Op.ne]: 'Đã hủy' },
                ...(startDate && endDate ? { ngayLap: dateWhere } : {})
            },
            attributes: ['tongTien']
        });
        const salesRevenue = sales.reduce((acc, curr) => acc + parseFloat(curr.tongTien || 0), 0);

        // Doanh thu dịch vụ
        const repairs = await PhieuBaoHanh.findAll({
            where: {
                trangThai: 'Đã trả máy',
                ...(startDate && endDate ? { ngayLap: dateWhere } : {})
            },
            attributes: ['phiDichVu']
        });
        const repairRevenue = repairs.reduce((acc, curr) => acc + parseFloat(curr.phiDichVu || 0), 0);

        // Giá vốn máy
        const machineSales = await CtHoaDon.findAll({
            include: [{
                model: HoaDon,
                where: {
                    trangThai: { [Op.ne]: 'Đã hủy' },
                    ...(startDate && endDate ? { ngayLap: dateWhere } : {})
                },
                required: true,
                attributes: []
            }, {
                model: DongMay,
                required: true,
                attributes: ['giaNhap']
            }]
        });
        const machineCogs = machineSales.reduce((acc, curr) => {
            const qty = curr.soLuong || 0;
            const cost = (curr.DongMay && curr.DongMay.giaNhap) || 0;
            return acc + (qty * parseFloat(cost));
        }, 0);

        // Giá vốn linh kiện
        const partUsages = await ChiTietSuaChua.findAll({
            include: [{
                model: PhieuBaoHanh,
                where: {
                    trangThai: { [Op.in]: ['Đã xong', 'Đã trả máy'] },
                    ...(startDate && endDate ? { ngayLap: dateWhere } : {})
                },
                required: true,
                attributes: ['loaiPhieu']
            }, {
                model: LinhKien,
                required: true,
                attributes: ['giaNhap']
            }]
        });

        let repairPartCogs = 0;
        let warrantyCosts = 0;
        partUsages.forEach(pu => {
            const cost = parseFloat((pu.LinhKien && pu.LinhKien.giaNhap) || 0);
            if (pu.PhieuBaoHanh && pu.PhieuBaoHanh.loaiPhieu === 'Sửa chữa') {
                repairPartCogs += cost;
            } else {
                warrantyCosts += cost;
            }
        });

        const totalRevenue = salesRevenue + repairRevenue;
        const totalCogs = machineCogs + repairPartCogs;
        const profit = totalRevenue - (totalCogs + warrantyCosts);

        res.json({
            success: true,
            data: {
                revenue: totalRevenue,
                salesRevenue,
                repairRevenue,
                cogs: totalCogs,
                machineCogs,
                repairPartCogs,
                warrantyCosts,
                profit
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4.2 Thống kê Kho hàng nâng cao
const getInventoryAdvancedReport = async (req, res) => {
    try {
        const serials = await ChiTietMay.findAll({
            include: [{ model: DongMay, attributes: ['giaNhap'] }]
        });

        const statusCounts = {};
        let totalStockValue = 0;

        serials.forEach(s => {
            statusCounts[s.trangThai] = (statusCounts[s.trangThai] || 0) + 1;
            if (s.trangThai === 'Trong kho') {
                totalStockValue += parseFloat((s.DongMay && s.DongMay.giaNhap) || 0);
            }
        });

        const statusCountsArray = Object.keys(statusCounts).map(k => ({ trangThai: k, count: statusCounts[k] }));

        res.json({
            success: true,
            data: {
                statusCounts: statusCountsArray,
                totalStockValue
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4.3 Thống kê Bảo hành & Chất lượng
const getWarrantyQualityReport = async (req, res) => {
    try {
        const modelStats = await DongMay.findAll({
            include: [{
                model: ChiTietMay,
                attributes: ['trangThai', 'soSerial']
            }]
        });

        // 1. Individual Model Failure Rates (Total PBH / Total Sold)
        const pbhCounts = await PhieuBaoHanh.findAll({
            attributes: ['soSerial', 'ngayLap'],
            raw: true
        });

        // Deduplicate tickets: Serial + Date -> 1 Case
        const uniquePbh = pbhCounts.filter((t, index, self) =>
            index === self.findIndex((u) => (
                u.soSerial === t.soSerial &&
                new Date(u.ngayLap).toDateString() === new Date(t.ngayLap).toDateString()
            ))
        );

        const serialFailMap = {};
        uniquePbh.forEach(p => {
            serialFailMap[p.soSerial] = (serialFailMap[p.soSerial] || 0) + 1;
        });

        const failureRates = modelStats.map(m => {
            const items = m.ChiTietMays || [];
            const soldSerials = items.filter(s => s.trangThai === 'Đã bán').map(s => s.soSerial);
            const inRepairSerials = items.filter(s => s.trangThai === 'Đang bảo hành').map(s => s.soSerial);

            const totalUnits = soldSerials.length + inRepairSerials.length;
            let totalClaims = 0;
            [...soldSerials, ...inRepairSerials].forEach(sn => {
                totalClaims += (serialFailMap[sn] || 0);
            });

            const rate = totalUnits > 0 ? (totalClaims / totalUnits) * 100 : 0;
            return {
                maModel: m.maModel,
                name: m.tenModel,
                rate: parseFloat(rate.toFixed(2)),
                totalUnits // Included for potential future use or filtering
            };
        }).sort((a, b) => b.rate - a.rate);

        // 2. High Pillar Metrics (Service Quality)
        const allTickets = await PhieuBaoHanh.findAll();
        const totalTickets = allTickets.length;
        const doneTickets = allTickets.filter(t => ['Đã xong', 'Đã trả máy'].includes(t.trangThai)).length;

        // Success Rate (% Finished)
        const repairSuccessRate = totalTickets > 0 ? (doneTickets / totalTickets) * 100 : 100;

        // No Rework Rate (using same logic as performance)
        let reworkCount = 0;
        uniquePbh.forEach(p => {
            if (p.ngayTraMay) {
                const thirtyDaysAfter = new Date(p.ngayTraMay);
                thirtyDaysAfter.setDate(thirtyDaysAfter.getDate() + 30);
                const isRework = uniquePbh.some(otherP =>
                    otherP.maPbh !== p.maPbh &&
                    otherP.soSerial === p.soSerial &&
                    new Date(otherP.ngayLap) > new Date(p.ngayTraMay) &&
                    new Date(otherP.ngayLap) <= thirtyDaysAfter
                );
                if (isRework) reworkCount++;
            }
        });
        const technicalQuality = uniquePbh.length > 0 ? (1 - reworkCount / uniquePbh.length) * 100 : 100;

        // Parts Availability
        const parts = await LinhKien.findAll({ attributes: ['soLuongTon'] });
        const partsInStock = parts.filter(p => p.soLuongTon > 0).length;
        const partsAvailability = parts.length > 0 ? (partsInStock / parts.length) * 100 : 100;

        // Reliability Index (100 - Avg failure rate of all models)
        const avgFailure = failureRates.length > 0 ? failureRates.reduce((a, b) => a + b.rate, 0) / failureRates.length : 0;
        const machineReliability = Math.max(0, 100 - (avgFailure * 2)); // Coefficient to make it visible

        const serviceQualityMetrics = [
            { name: 'Đúng tiến độ', value: repairSuccessRate },
            { name: 'Kỹ thuật chuẩn', value: technicalQuality },
            { name: 'Phụ tùng sẵn có', value: partsAvailability },
            { name: 'Độ bền máy', value: machineReliability },
            { name: 'Hài lòng (Ước tính)', value: 92 } // Reference constant
        ];

        const repairParts = await ChiTietSuaChua.findAll({
            include: [{ model: LinhKien, attributes: ['tenLk'] }]
        });

        const partFailuresMap = {};
        repairParts.forEach(rp => {
            const key = rp.maLk;
            if (!partFailuresMap[key]) {
                partFailuresMap[key] = {
                    maLk: key,
                    'LinhKien.tenLk': (rp.LinhKien && rp.LinhKien.tenLk) || 'N/A',
                    frequency: 0
                };
            }
            partFailuresMap[key].frequency += 1;
        });

        const topFailingParts = Object.values(partFailuresMap).sort((a, b) => b.frequency - a.frequency).slice(0, 10);

        res.json({
            success: true,
            data: { failureRates, serviceQualityMetrics, topFailingParts }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4.4 Đánh giá Hiệu suất
const getPerformanceAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const dateWhere = {};
        if (startDate && endDate) {
            dateWhere[Op.between] = [new Date(startDate), new Date(endDate)];
        }

        const staff = await NhanVien.findAll({
            include: [
                {
                    model: PhieuBaoHanh,
                    as: 'PhieuSuaChua',
                    attributes: ['maPbh', 'trangThai', 'ngayTraMay', 'soSerial', 'ngayLap'],
                    where: startDate && endDate ? { ngayLap: dateWhere } : {},
                    required: false
                },
                {
                    model: HoaDon,
                    attributes: ['maHd', 'tongTien', 'trangThai', 'ngayLap'],
                    where: {
                        trangThai: { [Op.ne]: 'Đã hủy' },
                        ...(startDate && endDate ? { ngayLap: dateWhere } : {})
                    },
                    required: false
                }
            ]
        });

        const techStats = staff.map(nv => {
            const tickets = nv.PhieuSuaChua || [];

            // Deduplicate: same serial + same day = 1 Case
            const uniqueTickets = tickets.filter((t, index, self) =>
                index === self.findIndex((u) => (
                    u.soSerial === t.soSerial &&
                    new Date(u.ngayLap).toDateString() === new Date(t.ngayLap).toDateString()
                ))
            );

            const total = uniqueTickets.length;
            const done = uniqueTickets.filter(p => ['Đã xong', 'Đã trả máy'].includes(p.trangThai)).length;

            let reworkCount = 0;
            uniqueTickets.forEach(p => {
                if (p.ngayTraMay) {
                    const thirtyDaysAfter = new Date(p.ngayTraMay);
                    thirtyDaysAfter.setDate(thirtyDaysAfter.getDate() + 30);
                    const isRework = uniqueTickets.some(otherP =>
                        otherP.maPbh !== p.maPbh &&
                        otherP.soSerial === p.soSerial &&
                        new Date(otherP.ngayLap) > new Date(p.ngayTraMay) &&
                        new Date(otherP.ngayLap) <= thirtyDaysAfter
                    );
                    if (isRework) reworkCount++;
                }
            });

            return {
                maNv: nv.maNv,
                name: nv.hoTen,
                total,
                done,
                reworkCount,
                qualityRate: total > 0 ? (100 - (reworkCount / total) * 100).toFixed(2) : 100
            };
        }).filter(s => s.total > 0).sort((a, b) => b.done - a.done);

        const salesStats = staff.map(nv => {
            const orders = nv.HoaDons || [];
            const totalRevenue = orders.reduce((acc, curr) => acc + parseFloat(curr.tongTien || 0), 0);
            return {
                maNv: nv.maNv,
                name: nv.hoTen,
                orderCount: orders.length,
                totalRevenue,
                avgOrderValue: orders.length > 0 ? (totalRevenue / orders.length).toFixed(0) : 0
            };
        }).filter(s => s.orderCount > 0).sort((a, b) => b.totalRevenue - a.totalRevenue);

        const customers = await KhachHang.findAll({
            include: [{
                model: HoaDon,
                where: { trangThai: { [Op.ne]: 'Đã hủy' } },
                required: false
            }]
        });

        const topCustomers = customers.map(c => ({
            maKh: c.maKh,
            hoTen: c.hoTen,
            totalSpending: (c.HoaDons || []).reduce((acc, curr) => acc + parseFloat(curr.tongTien || 0), 0)
        })).sort((a, b) => b.totalSpending - a.totalSpending).slice(0, 100);

        res.json({
            success: true,
            data: { techStats, salesStats, topCustomers }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Báo cáo tăng trưởng khách hàng (theo tháng)
const getCustomerGrowth = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const now = new Date();
        // Default to start of current year to ensure January, February etc. are included
        const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), 0, 1);
        const end = endDate ? new Date(endDate) : now;

        const growth = await KhachHang.findAll({
            where: {
                createdAt: { [Op.between]: [start, end] }
            },
            attributes: [
                [sequelize.fn('date_trunc', 'month', sequelize.col('createdAt')), 'month'],
                [sequelize.fn('COUNT', sequelize.col('maKh')), 'count']
            ],
            group: [sequelize.fn('date_trunc', 'month', sequelize.col('createdAt'))],
            order: [[sequelize.fn('date_trunc', 'month', sequelize.col('createdAt')), 'ASC']],
            raw: true
        });

        // 1. Generate all months in the requested range
        const months = [];
        let curr = new Date(start.getFullYear(), start.getMonth(), 1);
        const last = new Date(end.getFullYear(), end.getMonth(), 1);

        while (curr <= last) {
            months.push(new Date(curr));
            curr.setMonth(curr.getMonth() + 1);
        }

        // 2. Map existing growth data to a lookup map
        const dataMap = new Map();
        growth.forEach(g => {
            const d = new Date(g.month);
            dataMap.set(`${d.getFullYear()}-${d.getMonth()}`, parseInt(g.count));
        });

        // 3. Fill the result with 0 for missing months
        const result = months.map(m => {
            const count = dataMap.get(`${m.getFullYear()}-${m.getMonth()}`) || 0;
            return {
                month: m.toISOString(),
                count: count
            };
        });

        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getSalesReport,
    getInventoryReport,
    getStaffPerformance,
    getFinancialReport,
    getInventoryAdvancedReport,
    getWarrantyQualityReport,
    getPerformanceAnalytics,
    getCustomerGrowth
};
