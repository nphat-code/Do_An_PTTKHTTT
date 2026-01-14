// Load cart and display
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function initCheckout() {
    if (cart.length === 0) {
        alert("Giỏ hàng trống! Vui lòng chọn sản phẩm.");
        window.location.href = '/';
        return;
    }

    // Auto-fill user info
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        if (document.getElementById("cusName")) document.getElementById("cusName").value = user.fullName || '';
        if (document.getElementById("cusEmail")) document.getElementById("cusEmail").value = user.email || '';
        if (document.getElementById("cusPhone")) document.getElementById("cusPhone").value = user.phone || '';
        if (document.getElementById("cusAddress")) document.getElementById("cusAddress").value = user.address || '';
    }

    renderOrderSummary();
}

function renderOrderSummary() {
    const container = document.getElementById('orderItems');
    const totalEl = document.getElementById('orderTotal');
    let total = 0;

    container.innerHTML = cart.map(item => {
        total += item.price * item.quantity;
        return `
            <div class="order-summary-item">
                <div>
                    <strong>${item.name}</strong> <small>x${item.quantity}</small>
                </div>
                <div>${(item.price * item.quantity).toLocaleString()}đ</div>
            </div>
        `;
    }).join('');

    totalEl.innerText = total.toLocaleString() + 'đ';
}

async function submitOrder() {
    const form = document.getElementById('checkoutForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const orderData = {
        customerInfo: {
            fullName: document.getElementById("cusName").value,
            email: document.getElementById("cusEmail").value,
            phone: document.getElementById("cusPhone").value,
            address: document.getElementById("cusAddress").value
        },
        cartItems: cart.map(item => ({ id: item.id, quantity: item.quantity }))
    };

    try {
        // Show loading state
        const btn = document.querySelector('.btn-confirm');
        const originalText = btn.innerText;
        btn.innerText = "ĐANG XỬ LÝ...";
        btn.disabled = true;

        const response = await fetch('http://localhost:3000/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        const result = await response.json();

        if (result.success) {
            Swal.fire({
                icon: 'success',
                title: 'Đặt hàng thành công!',
                text: 'Mã đơn hàng: #' + result.orderId,
                confirmButtonText: 'Về trang chủ'
            }).then(() => {
                // Clear cart
                localStorage.removeItem('cart');
                window.location.href = '/';
            });
        } else {
            Swal.fire("Lỗi đặt hàng", result.message, "error");
            btn.innerText = originalText;
            btn.disabled = false;
        }
    } catch (error) {
        Swal.fire("Lỗi kết nối", "Không thể gửi đơn hàng đến server", "error");
        document.querySelector('.btn-confirm').disabled = false;
    }
}

window.onload = initCheckout;
