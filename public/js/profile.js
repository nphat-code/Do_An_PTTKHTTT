// Kiểm tra đăng nhập
const token = sessionStorage.getItem('token');
const user = JSON.parse(sessionStorage.getItem('user'));

if (!token || !user || user.role !== 'customer') {
    window.location.href = '/login.html';
}

// Auth links
function setupAuth() {
    const authLinks = document.getElementById('authLinks');
    authLinks.innerHTML = `Xin chào, <strong>${user.fullName}</strong> | <a href="#" onclick="logout()" style="color:#ef4444; text-decoration:none;">Đăng xuất</a>`;
}

function logout() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    window.location.href = '/';
}

// Load profile
function loadProfile() {
    document.getElementById('headerName').textContent = user.fullName || '';
    document.getElementById('headerEmail').textContent = user.email || '';
    document.getElementById('profileName').value = user.fullName || '';
    document.getElementById('profileEmail').value = user.email || '';
    document.getElementById('profilePhone').value = user.phone || '';
    document.getElementById('profileId').value = user.id || '';
    document.getElementById('profileAddress').value = user.address || '';
}

// Tab switching
function switchProfileTab(tabName) {
    document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));

    event.target.closest('.profile-tab').classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');

    if (tabName === 'orders') {
        loadMyOrders();
    }
}

// Save profile
document.getElementById('profileForm').onsubmit = async (e) => {
    e.preventDefault();

    const data = {
        hoTen: document.getElementById('profileName').value,
        sdt: document.getElementById('profilePhone').value,
        diaChi: document.getElementById('profileAddress').value
    };

    try {
        const response = await fetch('/api/orders/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();

        if (result.success) {
            // Cập nhật sessionStorage
            const updatedUser = { ...user, ...result.data };
            sessionStorage.setItem('user', JSON.stringify(updatedUser));

            document.getElementById('headerName').textContent = result.data.fullName;

            Swal.fire({
                icon: 'success',
                title: 'Đã cập nhật!',
                text: result.message,
                timer: 1500,
                showConfirmButton: false
            });
        } else {
            Swal.fire('Lỗi', result.message, 'error');
        }
    } catch (error) {
        Swal.fire('Lỗi', 'Không thể kết nối server', 'error');
    }
};

// Load orders
async function loadMyOrders() {
    const container = document.getElementById('ordersContainer');

    try {
        const response = await fetch('/api/orders/my-orders', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const result = await response.json();

        if (!result.success) {
            container.innerHTML = `<div class="empty-orders"><i class="fas fa-exclamation-triangle"></i><p>${result.message}</p></div>`;
            return;
        }

        if (result.data.length === 0) {
            container.innerHTML = `
                <div class="empty-orders">
                    <i class="fas fa-shopping-bag"></i>
                    <p>Bạn chưa có đơn hàng nào</p>
                    <a href="/" style="color: #6366f1; text-decoration: none; font-weight: 600;">Mua sắm ngay →</a>
                </div>`;
            return;
        }

        container.innerHTML = result.data.map(order => {
            const statusMap = {
                'Chờ xử lý': { class: 'status-pending', icon: '⏳' },
                'Đã xác nhận': { class: 'status-confirmed', icon: '✅' },
                'Đang giao': { class: 'status-shipping', icon: '🚚' },
                'Đã giao': { class: 'status-delivered', icon: '📦' },
                'Đã hủy': { class: 'status-cancelled', icon: '❌' }
            };
            const status = statusMap[order.trangThai] || { class: 'status-pending', icon: '⏳' };
            const ngayLap = order.ngayLap ? new Date(order.ngayLap).toLocaleDateString('vi-VN') : '';

            const itemsHtml = (order.DongMays || []).map(item => {
                const ct = item.CtHoaDon || {};
                return `
                    <div class="order-item">
                        ${item.hinhAnh
                        ? `<img src="/${item.hinhAnh}" class="order-item-img" alt="${item.tenModel}">`
                        : `<div class="order-item-img" style="display:flex; align-items:center; justify-content:center; background:#e2e8f0;"><i class="fas fa-laptop" style="color:#94a3b8;"></i></div>`
                    }
                        <span class="order-item-name">${item.tenModel}</span>
                        <span class="order-item-qty">x${ct.soLuong || 1}</span>
                        <span class="order-item-price">${Number(ct.thanhTien || 0).toLocaleString()}đ</span>
                    </div>`;
            }).join('');

            return `
                <div class="order-card">
                    <div class="order-header">
                        <div>
                            <div class="order-code"><i class="fas fa-receipt"></i> ${order.maHd || order.soHd}</div>
                            <div class="order-date">${ngayLap}</div>
                        </div>
                        <span class="order-status ${status.class}">${status.icon} ${order.trangThai || 'Chờ xử lý'}</span>
                    </div>
                    <div class="order-items">${itemsHtml}</div>
                    <div class="order-total">Tổng: ${Number(order.tongTien || 0).toLocaleString()}đ</div>
                </div>`;
        }).join('');

    } catch (error) {
        console.error(error);
        container.innerHTML = `<div class="empty-orders"><i class="fas fa-exclamation-triangle"></i><p>Không thể tải đơn hàng</p></div>`;
    }
}

// Init
setupAuth();
loadProfile();
