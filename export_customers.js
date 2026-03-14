const { KhachHang } = require('./src/models');
const fs = require('fs');

async function exportToCSV() {
    try {
        const customers = await KhachHang.findAll({
            attributes: ['maKh', 'hoTen', 'email', 'sdt', 'diaChi']
        });

        const header = 'Mã KH,Họ tên,Email,Số điện thoại,Địa chỉ,Mật khẩu\n';
        const rows = customers.map(c => {
            return `${c.maKh},${c.hoTen},${c.email},${c.sdt || ''},"${c.diaChi || ''}",123456`;
        }).join('\n');

        // Add UTF-8 BOM so Excel opens it correctly with Vietnamese characters
        const bom = Buffer.from('\uFEFF');
        const content = Buffer.concat([bom, Buffer.from(header + rows)]);

        fs.writeFileSync('DanhSachKhachHang.csv', content);
        console.log('Exported to DanhSachKhachHang.csv');
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

exportToCSV();
