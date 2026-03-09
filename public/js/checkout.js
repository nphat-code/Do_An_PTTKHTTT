// ==================== CHECKOUT PAGE ====================

// Load cart from localStorage
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function initCheckout() {
    if (cart.length === 0) {
        document.getElementById('checkoutContent').style.display = 'none';
        document.getElementById('emptyCartMsg').style.display = 'block';
        return;
    }

    // Auto-fill thông tin nếu đã đăng nhập
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        setVal('cusName', user.fullName);
        setVal('cusEmail', user.email);
        setVal('cusPhone', user.phone);
        setVal('cusAddress', user.address);
    }

    renderOrderSummary();
    loadPaymentMethods();
}

function setVal(id, val) {
    const el = document.getElementById(id);
    if (el && val) el.value = val;
}

// Hiển thị danh sách sản phẩm trong đơn hàng
function renderOrderSummary() {
    const container = document.getElementById('orderItems');
    const totalEl = document.getElementById('orderTotal');
    const subtotalEl = document.getElementById('subtotal');
    const itemCountEl = document.getElementById('itemCount');
    let total = 0;
    let totalQty = 0;

    container.innerHTML = cart.map(item => {
        const lineTotal = item.price * item.quantity;
        total += lineTotal;
        totalQty += item.quantity;

        // Tìm ảnh sản phẩm (nếu có trong cart data)
        const imgHtml = item.image
            ? `<img src="/${item.image}" class="order-item-img" alt="${item.name}">`
            : `<div class="order-item-img-placeholder"><i class="fas fa-laptop"></i></div>`;

        return `
            <div class="order-item">
                ${imgHtml}
                <div class="order-item-info">
                    <div class="order-item-name">${item.name}</div>
                    <div class="order-item-qty">Số lượng: ${item.quantity}</div>
                </div>
                <div class="order-item-price">${lineTotal.toLocaleString()}đ</div>
            </div>
        `;
    }).join('');

    totalEl.innerText = total.toLocaleString() + 'đ';
    if (subtotalEl) subtotalEl.innerText = total.toLocaleString() + 'đ';
    if (itemCountEl) itemCountEl.innerText = totalQty;
}

// Tải phương thức thanh toán từ API
async function loadPaymentMethods() {
    const container = document.getElementById('paymentMethodsContainer');
    try {
        const response = await fetch('/api/orders/payment-methods');
        const result = await response.json();
        if (result.success && result.data.length > 0) {
            // Icon mapping dựa trên tên phương thức
            const iconMap = {
                'tiền mặt': 'fa-money-bill-wave',
                'cod': 'fa-truck',
                'chuyển khoản': 'fa-university',
                'ngân hàng': 'fa-university',
                'thẻ': 'fa-credit-card',
                'ví điện tử': 'fa-wallet',
                'momo': 'fa-wallet',
                'vnpay': 'fa-qrcode',
            };

            function getIcon(name) {
                const lower = name.toLowerCase();
                for (const [key, icon] of Object.entries(iconMap)) {
                    if (lower.includes(key)) return icon;
                }
                return 'fa-credit-card';
            }

            container.innerHTML = result.data.map((method, index) => `
                <label class="payment-option ${index === 0 ? 'selected' : ''}" onclick="selectPayment(this)">
                    <input type="radio" name="payment" value="${method.maHttt}" ${index === 0 ? 'checked' : ''}>
                    <i class="fas ${getIcon(method.tenHttt)}"></i>
                    <span>${method.tenHttt}</span>
                </label>
            `).join('');
        } else {
            container.innerHTML = '<p style="color:#ef4444; text-align:center;">Không có phương thức thanh toán nào.</p>';
        }
    } catch (error) {
        console.error('Lỗi tải phương thức thanh toán:', error);
        container.innerHTML = '<p style="color:#ef4444; text-align:center;">Lỗi tải phương thức thanh toán.</p>';
    }
}

// Chọn phương thức thanh toán
function selectPayment(el) {
    document.querySelectorAll('.payment-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    el.classList.add('selected');
    el.querySelector('input[type="radio"]').checked = true;
}

// Gửi đơn hàng
async function submitOrder() {
    const form = document.getElementById('checkoutForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    // Validate SĐT
    const phone = document.getElementById('cusPhone').value.trim();
    if (!/^0\d{8,10}$/.test(phone.replace(/\s/g, ''))) {
        Swal.fire('Lỗi', 'Số điện thoại không hợp lệ', 'warning');
        return;
    }

    const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value || null;

    const orderData = {
        customerInfo: {
            fullName: document.getElementById('cusName').value.trim(),
            email: document.getElementById('cusEmail').value.trim(),
            phone: phone,
            address: document.getElementById('cusAddress').value.trim()
        },
        cartItems: cart.map(item => ({ id: item.id, quantity: item.quantity })),
        maHttt: paymentMethod
    };

    // Loading state
    const btn = document.getElementById('btnCheckout');
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ĐANG XỬ LÝ...';
    btn.disabled = true;

    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        const result = await response.json();

        if (result.success) {
            // Xóa giỏ hàng
            localStorage.removeItem('cart');

            Swal.fire({
                icon: 'success',
                title: '🎉 Đặt hàng thành công!',
                html: `
                    <div style="text-align: left; padding: 10px 0;">
                        <p style="margin: 8px 0;"><strong>Mã đơn hàng:</strong> #${result.orderId}</p>
                        <p style="margin: 8px 0;"><strong>Tổng tiền:</strong> <span style="color:#dc2626; font-weight:700;">${Number(result.totalAmount || 0).toLocaleString()}đ</span></p>
                        <p style="margin: 8px 0; color: #64748b; font-size: 0.9rem;">Chúng tôi sẽ liên hệ bạn sớm nhất để xác nhận đơn hàng.</p>
                    </div>
                `,
                confirmButtonText: 'Về trang chủ',
                confirmButtonColor: '#6366f1',
                allowOutsideClick: false
            }).then(() => {
                window.location.href = '/';
            });
        } else {
            Swal.fire('Lỗi đặt hàng', result.message, 'error');
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        }
    } catch (error) {
        console.error(error);
        Swal.fire('Lỗi kết nối', 'Không thể gửi đơn hàng đến server', 'error');
        btn.innerHTML = originalHtml;
        btn.disabled = false;
    }
}

window.onload = initCheckout;
