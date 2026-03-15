const { PhieuBaoHanh, ChiTietMay, NhanVien, HinhThucThanhToan, LinhKien, Kho, ChiTietSuaChua, HangSanXuat } = require('./models');
const sequelize = require('./config/database');
const { Op } = require('sequelize');

const seedWarranties = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB...');

        const serials = await ChiTietMay.findAll({ limit: 5 });
        const emps = await NhanVien.findAll({ limit: 2 });
        const httt = await HinhThucThanhToan.findOne();
        const warehouse = await Kho.findOne();
        const hsx = await HangSanXuat.findOne();

        if (serials.length < 5) {
            console.error('Not enough serials to create 5 warranties');
            process.exit(1);
        }

        // --- Ensure Missing Spare Parts ---
        const loa = await LinhKien.findOne({ where: { tenLk: { [Op.iLike]: '%Loa%' } } });
        if (!loa) {
            console.log('Creating missing "Loa" spare part...');
            await LinhKien.create({
                maLk: 'LK_LOA_GEN',
                tenLk: 'Loa Laptop Stereo Gen 2',
                loaiLk: 'Âm thanh',
                giaNhap: 200000,
                soLuongTon: 50,
                maHang: hsx ? hsx.maHang : null
            });
        }

        const scenarios = [
            {
                complaint: 'Màn hình bị sọc ngang',
                conclusion: 'Lỗi panel màn hình, cần thay thế cụm màn hình mới.',
                partKeyword: 'Màn hình'
            },
            {
                complaint: 'Pin sụt nhanh, sạc không vào',
                conclusion: 'Pin bị chai (80% cycle count), tiến hành thay pin chính hãng.',
                partKeyword: 'Pin'
            },
            {
                complaint: 'Bàn phím bị liệt một số phím',
                conclusion: 'Mạch bàn phím bị chập do ẩm, thay thế bàn phím mới.',
                partKeyword: 'Bàn phím'
            },
            {
                complaint: 'Máy thường xuyên bị treo và khởi động lại',
                conclusion: 'Ổ cứng SSD có dấu hiệu bad sector, thay thế bằng SSD mới và cài lại OS.',
                partKeyword: 'SSD'
            },
            {
                complaint: 'Loa rè, không nghe được âm thanh',
                conclusion: 'Màng loa bị rách, thay thế cặp loa mới.',
                partKeyword: 'Loa'
            }
        ];

        const statuses = ['Chờ kiểm tra', 'Đang sửa', 'Đã xong', 'Đã trả máy'];

        console.log('Cleaning old test warranties...');
        await PhieuBaoHanh.destroy({ where: { maPbh: { [Op.like]: 'PBH1%' } } });

        console.log('Inserting/Updating 5 Robust Warranty Certificates...');
        for (let i = 0; i < 5; i++) {
            const scenario = scenarios[i];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const maPbh = 'PBH' + (1000 + i).toString();

            // Find matching part FIRST to calculate cost
            let repairCost = 0;
            let matchedPart = null;

            if (status !== 'Chờ kiểm tra' && warehouse) {
                matchedPart = await LinhKien.findOne({
                    where: { tenLk: { [Op.iLike]: `%${scenario.partKeyword}%` } }
                });

                if (matchedPart) {
                    // Cost = Part price (1.2 margin) + Labor (fixed 200k)
                    const partPrice = matchedPart.giaNhap ? parseFloat(matchedPart.giaNhap) * 1.2 : 500000;
                    repairCost = partPrice + 200000;
                } else if (status === 'Đã xong' || status === 'Đã trả máy') {
                    // If no part found but finished, only labor
                    repairCost = 200000;
                }
            }

            await PhieuBaoHanh.upsert({
                maPbh: maPbh,
                ngayLap: new Date(Date.now() - (7 - i) * 24 * 60 * 60 * 1000),
                moTaLoi: scenario.complaint,
                ketLuanKyThuat: status !== 'Chờ kiểm tra' ? scenario.conclusion : null,
                ngayTraMay: status === 'Đã trả máy' ? new Date() : null,
                trangThai: status,
                soSerial: serials[i].soSerial,
                maNvTiepNhan: emps[0].maNv,
                maNvKyThuat: emps[1] ? emps[1].maNv : emps[0].maNv,
                maHttt: httt ? httt.maHttt : null,
                chiPhiSuaChua: (status === 'Đã xong' || status === 'Đã trả máy') ? repairCost : 0
            });

            if (matchedPart && status !== 'Chờ kiểm tra') {
                await ChiTietSuaChua.upsert({
                    maPbh: maPbh,
                    maLk: matchedPart.maLk,
                    maKhoXuat: warehouse.maKho,
                    soLuong: 1,
                    donGia: matchedPart.giaNhap ? parseFloat(matchedPart.giaNhap) * 1.2 : 500000
                });
                console.log(`✅ Linked ${matchedPart.tenLk} to ${maPbh}, Total Cost: ${repairCost.toLocaleString()} VNĐ`);
            } else if (status !== 'Chờ kiểm tra') {
                console.log(`⚠️ No part found for ${scenario.partKeyword} on ${maPbh}, labor cost only.`);
            }
        }

        console.log('✅ 5 Verified Warranty Certificates seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('Seed Failed:', error);
        process.exit(1);
    }
};

seedWarranties();
