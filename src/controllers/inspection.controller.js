const { PhieuKiemKe, CtKiemKeLk, CtKiemKeMay, NhanVien, Kho, ChiTietMay, LinhKien, KhoLinhKien, DongMay, sequelize } = require('../models');

const inspectionController = {
    getAllInspections: async (req, res) => {
        try {
            const inspections = await PhieuKiemKe.findAll({
                include: [
                    { model: NhanVien, attributes: ['hoTen'] },
                    { model: Kho, attributes: ['tenKho'] }
                ],
                order: [['ngayKiemKe', 'DESC']]
            });
            res.status(200).json(inspections);
        } catch (error) {
            console.error('Error fetching inspections:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    getInspectionById: async (req, res) => {
        try {
            const { id } = req.params;
            const inspection = await PhieuKiemKe.findByPk(id, {
                include: [
                    { model: NhanVien, attributes: ['hoTen'] },
                    { model: Kho, attributes: ['tenKho'] },
                    {
                        model: CtKiemKeMay,
                        include: [{ model: ChiTietMay }]
                    },
                    {
                        model: CtKiemKeLk,
                        include: [{ model: LinhKien }]
                    }
                ]
            });

            if (!inspection) {
                return res.status(404).json({ message: 'Inspection not found' });
            }

            res.status(200).json(inspection);
        } catch (error) {
            console.error('Error fetching inspection details:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    createInspection: async (req, res) => {
        const t = await sequelize.transaction();
        try {
            const { maPk, maNv, maKho, ngayKiemKe, ghiChu, ctMay, ctLk } = req.body;

            // 1. Create PhieuKiemKe
            const inspection = await PhieuKiemKe.create({
                maPk, maNv, maKho, ngayKiemKe, ghiChu
            }, { transaction: t });

            // 2. Process Machine Details
            if (ctMay && ctMay.length > 0) {
                for (const item of ctMay) {
                    await CtKiemKeMay.create({
                        maPk,
                        soSerial: item.soSerial,
                        ttHeThong: item.ttHeThong,
                        ttThucTe: item.ttThucTe
                    }, { transaction: t });

                    // Update status if discrepancy found
                    if (item.ttHeThong !== item.ttThucTe) {
                        const machine = await ChiTietMay.findOne({ where: { soSerial: item.soSerial }, transaction: t });
                        if (machine) {
                            await machine.update({ trangThai: item.ttThucTe }, { transaction: t });
                        }
                    }
                }

                // SYNC: Re-calculate soLuongTon for all models involved in the inspection
                const distinctModels = new Set();
                for (const item of ctMay) {
                    const machine = await ChiTietMay.findOne({ where: { soSerial: item.soSerial }, transaction: t });
                    if (machine) {
                        distinctModels.add(machine.maModel);
                    }
                }
                for (const maModel of distinctModels) {
                    const actualCount = await ChiTietMay.count({
                        where: { maModel: maModel, trangThai: 'Trong kho' },
                        transaction: t
                    });
                    await DongMay.update({ soLuongTon: actualCount }, { where: { maModel: maModel }, transaction: t });
                }
            }

            // 3. Process Spare Part Details
            if (ctLk && ctLk.length > 0) {
                for (const item of ctLk) {
                    await CtKiemKeLk.create({
                        maPk,
                        maLk: item.maLk,
                        slHeThong: item.slHeThong,
                        slThucTe: item.slThucTe,
                        ghiChu: item.ghiChu || ''
                    }, { transaction: t });

                    // Update stock if discrepancy found
                    if (item.slHeThong !== item.slThucTe) {
                        const diff = Number(item.slThucTe) - Number(item.slHeThong);
                        
                        // Update individual warehouse stock
                        await KhoLinhKien.update(
                            { soLuongTon: item.slThucTe },
                            { where: { maLk: item.maLk, maKho: maKho }, transaction: t }
                        );

                        // SYNC: Update global LinhKien stock quantity
                        if (diff !== 0) {
                            if (diff > 0) {
                                await LinhKien.increment('soLuongTon', { by: diff, where: { maLk: item.maLk }, transaction: t });
                            } else {
                                await LinhKien.decrement('soLuongTon', { by: Math.abs(diff), where: { maLk: item.maLk }, transaction: t });
                            }
                        }
                    }
                }
            }

            await t.commit();
            res.status(201).json({ message: 'Inventory check record created successfully', inspection });
        } catch (error) {
            await t.rollback();
            console.error('Error creating inspection:', error);
            res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    }
};

module.exports = inspectionController;
