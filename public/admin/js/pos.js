// ==================== QUAN LY DON HANG (ORDERS) ====================

// loadOrders function removed - now centralized in main.js


function getStatusBadge(status) {
    const map = {
        'Ch\u1edd x\u1eed l\u00fd': 'background:#fef3c7;color:#d97706;',
        '\u0110\u00e3 x\u00e1c nh\u1eadn': 'background:#dbeafe;color:#2563eb;',
        '\u0110ang giao': 'background:#ede9fe;color:#7c3aed;',
        '\u0110\u00e3 giao': 'background:#dcfce7;color:#16a34a;',
        '\u0110\u00e3 h\u1ee7y': 'background:#fee2e2;color:#dc2626;'
    };
    const style = map[status] || 'background:#f1f5f9;color:#64748b;';
    return `<span style="padding:3px 10px;border-radius:20px;font-size:0.8rem;font-weight:600;${style}">${status}</span>`;
}

function renderOrdersTable(orders) {
    const tbody = document.getElementById('orderTableBody');
    if (!tbody) return;
    if (!orders.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:#94a3b8;">Ch\u01b0a c\u00f3 \u0111\u01a1n h\u00e0ng n\u00e0o</td></tr>';
        return;
    }
    tbody.innerHTML = orders.map(o => {
        const kh = o.KhachHang || {};
        return `<tr>
            <td><strong>${o.maHd}</strong></td>
            <td>${kh.hoTen || '&mdash;'}</td>
            <td>${kh.sdt || '&mdash;'}</td>
            <td>${new Date(o.ngayLap).toLocaleString('vi-VN')}</td>
            <td style="color:#ef4444;font-weight:700;">${Number(o.tongTien).toLocaleString()} &#8363;</td>
            <td>${getStatusBadge(o.trangThai)}</td>
            <td><button class="btn-edit" onclick="viewOrderDetail('${o.maHd}')" title="Chi ti\u1ebft"><i class="fas fa-eye"></i></button></td>
        </tr>`;
    }).join('');
}

// ==================== POS MODAL ====================
let posAllProducts = [];
let posCart = {};
let currentOrderDetailId = null;

async function openPOSModal() {
    posCart = {};
    renderPOSCart();
    ['posCustomerName', 'posCustomerPhone', 'posCustomerAddress', 'posSearchInput', 'posOrderNote'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    document.getElementById('posModal').style.display = 'flex';

    // Load payment methods
    try {
        const pmRes = await fetch('/api/orders/payment-methods');
        const pmResult = await pmRes.json();
        const pmSelect = document.getElementById('posPaymentMethod');
        if (pmResult.success && pmResult.data.length) {
            pmSelect.innerHTML = '<option value="">-- Ph\u01b0\u01a1ng th\u1ee9c thanh to\u00e1n --</option>' +
                pmResult.data.map(m => `<option value="${m.maHttt}">${m.tenHttt}</option>`).join('');
        } else {
            pmSelect.innerHTML = '<option value="">-- Kh\u00f4ng c\u00f3 HTTT --</option>';
        }
    } catch (e) {
        console.error('L\u1ed7i t\u1ea3i HTTT', e);
    }

    // Load products
    try {
        const res = await fetch('/api/products?limit=500');
        const result = await res.json();
        if (result.success) {
            posAllProducts = result.data;
            renderPOSProductGrid(posAllProducts);
        }
    } catch (e) { console.error(e); }
}

function closePOSModal() {
    document.getElementById('posModal').style.display = 'none';
}

function searchPOSProducts(query) {
    const q = (query || '').toLowerCase().trim();
    renderPOSProductGrid(q
        ? posAllProducts.filter(p => (p.tenModel || '').toLowerCase().includes(q) || (p.maModel || '').toLowerCase().includes(q))
        : posAllProducts
    );
}

function renderPOSProductGrid(products) {
    const grid = document.getElementById('posProductGrid');
    if (!products || !products.length) {
        grid.innerHTML = '<p style="color:#94a3b8;grid-column:1/-1;text-align:center;padding:30px;">Kh\u00f4ng t\u00ecm th\u1ea5y s\u1ea3n ph\u1ea9m</p>';
        return;
    }
    grid.innerHTML = products.map(p => {
        const qty = posCart[p.maModel] ? posCart[p.maModel].qty : 0;
        const oos = p.soLuongTon <= 0;
        const border = qty > 0 ? '#6366f1' : '#e2e8f0';
        return `
        <div onclick="${oos ? '' : `addToPOSCart('${p.maModel}')`}"
            style="border:2px solid ${border};border-radius:10px;padding:12px;
                   cursor:${oos ? 'not-allowed' : 'pointer'};background:${oos ? '#f8fafc' : 'white'};
                   opacity:${oos ? '0.6' : '1'};transition:all 0.2s;position:relative;"
            onmouseover="${oos ? '' : `this.style.borderColor='#6366f1';this.style.boxShadow='0 4px 12px rgba(99,102,241,0.15)'`}"
            onmouseout="this.style.borderColor='${border}';this.style.boxShadow='none'">
            ${qty > 0 ? `<div style="position:absolute;top:-8px;right:-8px;background:#6366f1;color:white;border-radius:50%;width:22px;height:22px;font-size:0.75rem;font-weight:700;display:flex;align-items:center;justify-content:center;">${qty}</div>` : ''}
            <div style="font-size:0.7rem;color:#94a3b8;margin-bottom:4px; font-weight:700;">${p.maModel}</div>
            <div style="font-weight:600;font-size:0.9rem;color:#1e293b;margin-bottom:6px;line-height:1.3;">${p.tenModel}</div>
            <div style="color:#6366f1;font-weight:700;font-size:1rem;">${Number(p.giaBan || 0).toLocaleString()} &#8363;</div>
            <div style="font-size:0.75rem;color:${p.soLuongTon > 5 ? '#16a34a' : p.soLuongTon > 0 ? '#d97706' : '#dc2626'};margin-top:4px;">
                ${oos ? '&#x26D4; H\u1ebft h\u00e0ng' : '&#x1F7E2; C\u00f2n ' + p.soLuongTon + ' m\u00e1y'}
            </div>
        </div>`;
    }).join('');
}

async function addToPOSCart(maModel) {
    const p = posAllProducts.find(x => x.maModel === maModel);
    if (!p || p.soLuongTon <= 0) return;

    if (!posCart[maModel]) posCart[maModel] = { product: p, qty: 0, serials: [] };

    if (posCart[maModel].qty >= p.soLuongTon) {
        Swal.fire({
            icon: 'warning', title: 'Không đủ hàng',
            text: `Chỉ còn ${p.soLuongTon} máy trong kho`, timer: 1500, showConfirmButton: false
        });
        return;
    }

    try {
        const res = await fetch(`/api/products/${maModel}/serials`);
        const result = await res.json();
        if (!result.success) throw new Error(result.message);

        // Filter out serials already in cart
        const allSelectedSerials = Object.values(posCart).flatMap(item => item.serials || []);
        const availableSerials = result.data.filter(s => !allSelectedSerials.includes(s.soSerial));

        if (!availableSerials.length) {
            return Swal.fire('Lỗi', 'Không còn máy khả dụng trong kho (đã chọn hết vào giỏ)', 'warning');
        }

        const options = availableSerials.map(s =>
            `<option value="${s.soSerial}">${s.soSerial} - ${s.Kho ? s.Kho.tenKho : 'N/A'}</option>`
        ).join('');

        const { value: selectedSerial } = await Swal.fire({
            title: 'Chọn Serial / Kho',
            html: `
                <div style="text-align:left;">
                    <p style="font-size:0.9rem; margin-bottom:10px;">Model: <strong>${p.tenModel}</strong></p>
                    <label style="font-size:0.85rem; font-weight:600;">Chọn máy từ danh sách khả dụng:</label>
                    <select id="swalSerialPicker" class="swal2-select" style="width:100%; margin-top:10px; font-size:0.9rem;">
                        ${options}
                    </select>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Thêm vào giỏ',
            cancelButtonText: 'Hủy',
            preConfirm: () => document.getElementById('swalSerialPicker').value
        });

        if (selectedSerial) {
            posCart[maModel].qty++;
            posCart[maModel].serials.push(selectedSerial);
            _refreshPOSView();
        }
    } catch (e) {
        console.error(e);
        Swal.fire('Lỗi', 'Không thể hiển thị danh sách Serial', 'error');
    }
}

function updatePOSCartQty(maModel, delta) {
    if (!posCart[maModel]) return;

    if (delta > 0) {
        // Adding more - just call the main function to handle serial picker
        addToPOSCart(maModel);
        return;
    }

    // Removing
    posCart[maModel].qty--;
    // Remove the last serial added
    if (posCart[maModel].serials) {
        posCart[maModel].serials.pop();
    }

    if (posCart[maModel].qty <= 0) delete posCart[maModel];
    _refreshPOSView();
}

function _refreshPOSView() {
    renderPOSCart();
    const q = (document.getElementById('posSearchInput').value || '').toLowerCase();
    renderPOSProductGrid(q
        ? posAllProducts.filter(p => (p.tenModel || '').toLowerCase().includes(q) || (p.maModel || '').toLowerCase().includes(q))
        : posAllProducts
    );
}

function renderPOSCart() {
    const list = document.getElementById('posCartList');
    const items = Object.values(posCart);
    document.getElementById('posCartCount').textContent = items.reduce((s, i) => s + i.qty, 0);

    if (!items.length) {
        list.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:20px 0;font-size:0.9rem;">Ch\u01b0a c\u00f3 s\u1ea3n ph\u1ea9m n\u00e0o</p>';
        document.getElementById('posTotalAmount').innerHTML = '0 &#8363;';
        return;
    }

    let total = 0;
    list.innerHTML = items.map(({ product: p, qty, serials }) => {
        const sub = Number(p.giaBan || 0) * qty;
        total += sub;
        const serialList = (serials || []).map(s => `<div style="font-size:0.75rem; color:#64748b; font-family:monospace; padding-left:10px;">• ${s}</div>`).join('');
        return `
        <div style="display:flex;flex-direction:column;padding:8px 0;border-bottom:1px solid #f1f5f9;">
            <div style="display:flex;align-items:center;gap:8px;">
                <div style="flex:1;min-width:0;">
                    <div style="font-size:0.85rem;font-weight:600;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.tenModel}</div>
                    <div style="font-size:0.8rem;color:#6366f1;">${Number(p.giaBan || 0).toLocaleString()} &#8363;/máy</div>
                </div>
                <div style="display:flex;align-items:center;gap:4px;flex-shrink:0;">
                    <button onclick="updatePOSCartQty('${p.maModel}',-1)"
                        style="width:24px;height:24px;border:1px solid #e2e8f0;border-radius:4px;background:white;cursor:pointer;">&#8722;</button>
                    <span style="min-width:20px;text-align:center;font-weight:700;font-size:0.9rem;">${qty}</span>
                    <button onclick="updatePOSCartQty('${p.maModel}',1)"
                        style="width:24px;height:24px;border:1px solid #e2e8f0;border-radius:4px;background:white;cursor:pointer;">+</button>
                </div>
                <div style="min-width:70px;text-align:right;font-weight:700;font-size:0.85rem;color:#ef4444;">
                    ${sub.toLocaleString()}&#8363;
                </div>
            </div>
            <div style="margin-top:4px;">
                ${serialList}
            </div>
        </div>`;
    }).join('');
    document.getElementById('posTotalAmount').innerHTML = total.toLocaleString() + ' &#8363;';
}

async function submitPOSOrder() {
    const items = Object.values(posCart);
    if (!items.length) return Swal.fire('C\u1ea3nh b\u00e1o', 'Gi\u1ecf h\u00e0ng tr\u1ed1ng!', 'warning');

    const name = (document.getElementById('posCustomerName').value || '').trim();
    const phone = (document.getElementById('posCustomerPhone').value || '').trim();
    if (!name || !phone) return Swal.fire('C\u1ea3nh b\u00e1o', 'Vui l\u00f2ng nh\u1eadp H\u1ecd t\u00ean v\u00e0 S\u1ed1 \u0111i\u1ec7n tho\u1ea1i!', 'warning');

    const cfm = await Swal.fire({
        title: 'X\u00e1c nh\u1eadn t\u1ea1o \u0111\u01a1n?',
        html: `<b>${items.length}</b> s\u1ea3n ph\u1ea9m &mdash; T\u1ed5ng: <b style="color:#10b981">${document.getElementById('posTotalAmount').textContent}</b>`,
        icon: 'question', showCancelButton: true,
        confirmButtonText: 'T\u1ea1o \u0111\u01a1n', cancelButtonText: 'H\u1ee7y', confirmButtonColor: '#10b981'
    });
    if (!cfm.isConfirmed) return;

    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerInfo: {
                    fullName: name,
                    phone: phone,
                    address: (document.getElementById('posCustomerAddress').value || '').trim(),
                    email: '',
                    ghiChu: (document.getElementById('posOrderNote').value || '').trim()
                },
                cartItems: items.map(({ product: p, qty, serials }) => ({
                    id: p.maModel, quantity: qty, price: Number(p.giaBan || 0), serials: serials
                })),
                maHttt: document.getElementById('posPaymentMethod').value || null
            })
        });
        const result = await res.json();
        if (result.success) {
            await Swal.fire({
                icon: 'success', title: '\ud83c\udf89 T\u1ea1o \u0111\u01a1n th\u00e0nh c\u00f4ng!',
                html: `M\u00e3 HD: <strong>${result.orderId}</strong><br>T\u1ed5ng: <strong style="color:#10b981">${Number(result.totalAmount).toLocaleString()} &#8363;</strong>`,
                confirmButtonColor: '#6366f1'
            });
            closePOSModal();
            loadOrders();
        } else {
            Swal.fire('L\u1ed7i', result.message, 'error');
        }
    } catch (e) {
        Swal.fire('L\u1ed7i k\u1ebft n\u1ed1i', 'Kh\u00f4ng th\u1ec3 k\u1ebft n\u1ed1i server', 'error');
    }
}

// ==================== ORDER DETAIL ====================
async function viewOrderDetail(maHd) {
    currentOrderDetailId = maHd;
    document.getElementById('orderDetailId').textContent = maHd;
    document.getElementById('orderDetailItemsBody').innerHTML =
        '<tr><td colspan="5" style="text-align:center;padding:20px;color:#94a3b8;">\u0110ang t\u1ea3i...</td></tr>';
    document.getElementById('orderDetailModal').style.display = 'flex';

    try {
        const res = await fetch(`/api/orders/${maHd}`);
        const result = await res.json();
        if (!result.success) return;

        const o = result.data;
        const kh = o.KhachHang || {};

        document.getElementById('orderDetailInfo').innerHTML = `
            <div style="background:#f8fafc;padding:10px;border-radius:8px;"><strong>Kh\u00e1ch h\u00e0ng:</strong><br>${kh.hoTen || '&mdash;'}</div>
            <div style="background:#f8fafc;padding:10px;border-radius:8px;"><strong>S\u1ed1 \u0111i\u1ec7n tho\u1ea1i:</strong><br>${kh.sdt || '&mdash;'}</div>
            <div style="background:#f8fafc;padding:10px;border-radius:8px;"><strong>\u0110\u1ecba ch\u1ec9:</strong><br>${kh.diaChi || '&mdash;'}</div>
            <div style="background:#f8fafc;padding:10px;border-radius:8px;"><strong>Ng\u00e0y l\u1eadp:</strong><br>${new Date(o.ngayLap).toLocaleString('vi-VN')}</div>`;

        document.getElementById('orderDetailStatusSelect').value = o.trangThai;
        document.getElementById('orderDetailTotal').innerHTML = Number(o.tongTien).toLocaleString() + ' &#8363;';

        if (o.DongMays && o.DongMays.length) {
            const rows = await Promise.all(o.DongMays.map(async p => {
                const ct = p.CtHoaDon || {};
                const qty = ct.soLuong || 0;
                const price = Number(ct.donGia || 0);
                const sub = Number(ct.thanhTien || price * qty);
                let serialHtml = '&mdash;';
                try {
                    const sr = await fetch(`/api/orders/${maHd}/serials/${p.maModel}`);
                    const srRes = await sr.json();
                    if (srRes.success && srRes.data && srRes.data.length)
                        serialHtml = `<div style="font-family:monospace;font-size:0.8em;max-height:60px;overflow-y:auto;background:#f8fafc;padding:4px;border-radius:4px;">${srRes.data.join('<br>')}</div>`;
                } catch (_) { }
                return `<tr>
                    <td>${p.tenModel}</td>
                    <td style="text-align:center;">${qty}</td>
                    <td style="text-align:right;">${price.toLocaleString()} &#8363;</td>
                    <td style="text-align:right;">${sub.toLocaleString()} &#8363;</td>
                    <td>${serialHtml}</td>
                </tr>`;
            }));
            document.getElementById('orderDetailItemsBody').innerHTML = rows.join('');
        } else {
            document.getElementById('orderDetailItemsBody').innerHTML =
                '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:20px;">Kh\u00f4ng c\u00f3 s\u1ea3n ph\u1ea9m</td></tr>';
        }
    } catch (e) { console.error(e); }
}

function closeOrderDetailModal() {
    document.getElementById('orderDetailModal').style.display = 'none';
    currentOrderDetailId = null;
}

async function saveOrderStatus() {
    if (!currentOrderDetailId) return;
    const trangThai = document.getElementById('orderDetailStatusSelect').value;
    try {
        const res = await fetch(`/api/orders/${currentOrderDetailId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trangThai })
        });
        const result = await res.json();
        if (result.success) {
            Swal.fire({ icon: 'success', title: '\u0110\u00e3 c\u1eadp nh\u1eadt', timer: 1200, showConfirmButton: false });
            loadOrders();
        } else {
            Swal.fire('L\u1ed7i', result.message, 'error');
        }
    } catch (e) {
        Swal.fire('L\u1ed7i', 'Kh\u00f4ng th\u1ec3 k\u1ebft n\u1ed1i server', 'error');
    }
}
