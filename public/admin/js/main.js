// Check Auth - Sử dụng sessionStorage để tách biệt phiên
const token = sessionStorage.getItem('token');
const user = JSON.parse(sessionStorage.getItem('user'));

if (!token || !user || user.role !== 'employee') {
    alert("Bạn cần đăng nhập quyền Nhân viên!");
    window.location.href = '/admin/login.html';
}

// Hiển thị thông tin người dùng
document.addEventListener('DOMContentLoaded', () => {
    const adminNameEl = document.getElementById('adminName');
    const adminRoleEl = document.getElementById('adminRole');
    if (adminNameEl && user.fullName) adminNameEl.innerText = user.fullName;
    if (adminRoleEl && user.role) adminRoleEl.innerText = (user.role === 'employee' ? 'Nhân viên' : user.role);
});

const productModal = document.getElementById("productModal");
const btnAdd = document.querySelector(".btn-add");
const closeBtn = document.querySelector(".close-btn");
const cancelBtn = document.getElementById("cancelBtn");
const productForm = document.getElementById("productForm");
const previewContainer = document.getElementById("previewContainer");

btnAdd.onclick = async () => {
    isEditMode = false;
    productForm.reset();
    document.getElementById("productId").value = "";
    document.getElementById("maModel").disabled = false;
    document.querySelector(".modal-header h2").innerText = "Thêm Laptop Mới";
    await loadDropdowns();
    productModal.style.display = "flex";
};
closeBtn.onclick = () => productModal.style.display = "none";
cancelBtn.onclick = () => productModal.style.display = "none";
window.onclick = (event) => {
    if (event.target == productModal) productModal.style.display = "none";
}

const sidebarLinks = document.querySelectorAll('.sidebar ul li a');
const sections = document.querySelectorAll('.tab-section');

sidebarLinks.forEach(link => {
    link.addEventListener('click', function (e) {
        const tabName = this.getAttribute('data-tab');
        if (!tabName) return;

        e.preventDefault();
        showTab(tabName);
    });
});

function showTab(tabName) {
    sidebarLinks.forEach(item => item.classList.remove('active'));
    sections.forEach(section => section.style.display = 'none');

    const activeLink = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeLink) activeLink.classList.add('active');

    const targetSection = document.getElementById(`${tabName}-content`);
    if (targetSection) targetSection.style.display = 'block';

    localStorage.setItem('activeTab', tabName);

    // Call load functions based on tab
    if (tabName === 'overview') loadDashboardStats();
    if (tabName === 'products') loadProducts();
    if (tabName === 'orders') loadOrders();
    if (tabName === 'customers') loadCustomers();
    if (tabName === 'employees') loadEmployees();
    if (tabName === 'inventory') loadImportHistory();
    if (tabName === 'stock') loadStockData();
}

let isEditMode = false;
let currentPage = 1;
const limit = 5;
async function loadProducts(page = 1) {
    currentPage = page;
    localStorage.setItem('currentPage', page);
    const keyword = document.getElementById("searchInput").value;
    try {
        const response = await fetch(`http://localhost:3000/api/products?page=${page}&limit=${limit}&search=${keyword}`);
        const result = await response.json();
        if (result.success) {
            renderTable(result.data);
            updateStatistics(result.statistics);
            renderPagination(result.pagination);
        }
    } catch (error) {
        console.error("Lỗi tải danh sách:", error);
    }
}

function renderPagination(pagination) {
    const container = document.getElementById("paginationContainer");
    if (!container) return;

    container.innerHTML = "";
    const { totalPages, currentPage } = pagination;

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.innerText = i;
        btn.className = (i === currentPage) ? "btn-page active" : "btn-page";
        btn.onclick = () => loadProducts(i);
        container.appendChild(btn);
    }
}

function renderTable(products) {
    if (!previewContainer) return;
    previewContainer.innerHTML = "";
    products.forEach(p => {
        const cauHinh = p.CauHinh || {};
        const hang = p.HangSanXuat ? p.HangSanXuat.tenHang : '-';
        const configText = [cauHinh.cpu, cauHinh.ram].filter(Boolean).join(' / ') || '-';

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${p.maModel}</strong></td>
            <td>${hang}</td>
            <td><strong>${p.tenModel}</strong></td>
            <td>${configText}</td>
            <td>${Number(p.giaBan || 0).toLocaleString()}đ</td>
            <td>${p.soLuongTon || 0}</td>
            <td>
                <button type="button" class="btn-edit" onclick="openEditModal('${p.maModel}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button type="button" class="btn-delete" onclick="deleteProduct(event, '${p.maModel}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        previewContainer.appendChild(tr);
    });
}

function updateStatistics(stats) {
    if (!stats) return;

    const totalProductsEl = document.getElementById("totalProducts");
    const totalValueEl = document.getElementById("totalValue");
    if (totalProductsEl) totalProductsEl.innerText = stats.totalProducts;
    if (totalValueEl) totalValueEl.innerText = stats.totalValue.toLocaleString() + "đ";
}

async function deleteProduct(event, id) {
    if (event) event.preventDefault();
    const result = await Swal.fire({
        title: 'Bạn có chắc chắn?',
        text: "Sản phẩm sẽ bị xóa vĩnh viễn!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Xóa ngay',
        cancelButtonText: 'Hủy'
    });
    if (result.isConfirmed) {
        try {
            const response = await fetch(`http://localhost:3000/api/products/${id}`, { method: 'DELETE' });
            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Đã xóa!',
                    text: 'Sản phẩm đã được loại bỏ.',
                    timer: 1500,
                    showConfirmButton: false,
                });
                loadProducts(currentPage);
            }
        } catch (error) {
            Swal.fire('Lỗi!', 'Không thể xóa sản phẩm.', 'error');
        }
    }
}

// Hàm load dropdown Hãng + Loại khi mở modal
async function loadDropdowns() {
    try {
        const [brandsRes, catsRes] = await Promise.all([
            fetch('http://localhost:3000/api/products/brands'),
            fetch('http://localhost:3000/api/products/categories')
        ]);
        const brandsData = await brandsRes.json();
        const catsData = await catsRes.json();

        const hangSelect = document.getElementById("maHang");
        const loaiSelect = document.getElementById("maLoai");

        if (hangSelect && brandsData.success) {
            hangSelect.innerHTML = '<option value="">-- Chọn hãng --</option>';
            brandsData.data.forEach(b => {
                hangSelect.innerHTML += `<option value="${b.maHang}">${b.tenHang}</option>`;
            });
        }
        if (loaiSelect && catsData.success) {
            loaiSelect.innerHTML = '<option value="">-- Chọn loại --</option>';
            catsData.data.forEach(c => {
                loaiSelect.innerHTML += `<option value="${c.maLoai}">${c.tenLoai}</option>`;
            });
        }
    } catch (err) {
        console.error("Lỗi tải dropdown:", err);
    }
}

window.openEditModal = async (maModel) => {
    isEditMode = true;
    await loadDropdowns();
    document.querySelector(".modal-header h2").innerText = "Chỉnh sửa sản phẩm";

    try {
        const res = await fetch(`http://localhost:3000/api/products/${maModel}`);
        const result = await res.json();
        if (!result.success) return Swal.fire('Lỗi', result.message, 'error');

        const p = result.data;
        const ch = p.CauHinh || {};

        document.getElementById("productId").value = p.maModel;
        document.getElementById("maModel").value = p.maModel;
        document.getElementById("maModel").disabled = true;
        document.getElementById("tenModel").value = p.tenModel || '';
        document.getElementById("maHang").value = p.maHang || '';
        document.getElementById("maLoai").value = p.maLoai || '';
        document.getElementById("cpu").value = ch.cpu || '';
        document.getElementById("ram").value = ch.ram || '';
        document.getElementById("oCung").value = ch.oCung || '';
        document.getElementById("vga").value = ch.vga || '';
        document.getElementById("manHinh").value = ch.manHinh || '';
        document.getElementById("pin").value = ch.pin || '';
        document.getElementById("trongLuong").value = ch.trongLuong || '';
        document.getElementById("giaNhap").value = p.giaNhap || 0;
        document.getElementById("giaBan").value = p.giaBan || 0;

        // Hiển ảnh hiện tại
        const previewImg = document.getElementById('previewImg');
        if (p.hinhAnh) {
            previewImg.src = `/${p.hinhAnh}`;
            previewImg.style.display = 'block';
        } else {
            previewImg.style.display = 'none';
        }
    } catch (err) {
        console.error(err);
    }

    productModal.style.display = "flex";
};

// Preview ảnh khi chọn file
document.getElementById('hinhAnh').onchange = function (e) {
    const file = e.target.files[0];
    const previewImg = document.getElementById('previewImg');
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            previewImg.src = ev.target.result;
            previewImg.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        previewImg.style.display = 'none';
    }
};

productForm.onsubmit = async function (e) {
    e.preventDefault();
    const id = document.getElementById("productId").value;

    // Sử dụng FormData để hỗ trợ upload ảnh
    const formData = new FormData();
    formData.append('maModel', document.getElementById("maModel").value);
    formData.append('tenModel', document.getElementById("tenModel").value);
    formData.append('maHang', document.getElementById("maHang").value || '');
    formData.append('maLoai', document.getElementById("maLoai").value || '');
    formData.append('cpu', document.getElementById("cpu").value);
    formData.append('ram', document.getElementById("ram").value);
    formData.append('oCung', document.getElementById("oCung").value);
    formData.append('vga', document.getElementById("vga").value);
    formData.append('manHinh', document.getElementById("manHinh").value);
    formData.append('pin', document.getElementById("pin").value);
    formData.append('trongLuong', document.getElementById("trongLuong").value);
    formData.append('giaNhap', document.getElementById("giaNhap").value);
    formData.append('giaBan', document.getElementById("giaBan").value);

    // Thêm file ảnh nếu có chọn
    const fileInput = document.getElementById('hinhAnh');
    if (fileInput.files[0]) {
        formData.append('hinhAnh', fileInput.files[0]);
    }

    const url = isEditMode ? `http://localhost:3000/api/products/${id}` : 'http://localhost:3000/api/products';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            body: formData  // Không set Content-Type, browser sẽ tự set multipart/form-data
        });

        if (response.ok) {
            productModal.style.display = "none";
            document.getElementById("maModel").disabled = false;
            document.getElementById('hinhAnh').value = ''; // Reset file input
            document.getElementById('previewImg').style.display = 'none';
            Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: isEditMode ? 'Đã cập nhật sản phẩm' : 'Đã thêm máy tính mới',
                timer: 1500,
                showConfirmButton: false,
            });
            loadProducts(currentPage);
        } else {
            const errorData = await response.json();
            Swal.fire('Lỗi!', errorData.message || 'Có lỗi xảy ra', 'error');
        }
    } catch (error) {
        console.error("Lỗi kết nối:", error);
        Swal.fire('Lỗi!', 'Không thể kết nối đến server', 'error');
    }
};

const searchInput = document.getElementById("searchInput");
let searchTimeout = null;
if (searchInput) {
    searchInput.oninput = (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            loadProducts(1);
        }, 300);
    };
}

// 1. Hàm tải danh sách đơn hàng
async function loadOrders() {
    try {
        const searchInput = document.getElementById('searchOrderInput');
        const search = searchInput ? searchInput.value.trim() : '';
        const response = await fetch(`/api/orders?search=${encodeURIComponent(search)}`);
        const result = await response.json();
        if (result.success) {
            renderOrdersTable(result.data);
        }
    } catch (error) {
        console.error("Lỗi khi tải đơn hàng:", error);
    }
}

// Add event listener for Order Search with debounce
document.addEventListener('DOMContentLoaded', () => {
    const searchOrderInput = document.getElementById("searchOrderInput");
    let orderSearchTimeout = null;
    if (searchOrderInput) {
        searchOrderInput.oninput = () => {
            clearTimeout(orderSearchTimeout);
            orderSearchTimeout = setTimeout(() => {
                loadOrders();
            }, 300);
        };
    }
});

const ORDER_STATUSES = ['Chờ xử lý', 'Đã hoàn thành', 'Đã hủy'];
const ORDER_STATUS_COLORS = {
    'Chờ xử lý': { bg: '#fef3c7', color: '#d97706' },
    'Đã hoàn thành': { bg: '#dcfce7', color: '#16a34a' },
    'Đã hủy': { bg: '#fecaca', color: '#dc2626' }
};
const ORDER_STATUS_CLASS = {
    'Chờ xử lý': 'pending',
    'Đã hoàn thành': 'delivered',
    'Đã hủy': 'cancelled'
};

// 2. Hàm vẽ bảng đơn hàng
function renderOrdersTable(orders) {
    const container = document.getElementById("orderTableBody");
    if (!container) return;
    container.innerHTML = "";

    orders.forEach(order => {
        const date = new Date(order.ngayLap || order.createdAt).toLocaleString('vi-VN');
        const status = order.trangThai || 'Chờ xử lý';
        const statusClass = ORDER_STATUS_CLASS[status] || 'pending';
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${order.maHd}</strong></td>
            <td>${order.KhachHang ? order.KhachHang.hoTen : 'N/A'}</td>
            <td>${order.KhachHang ? order.KhachHang.sdt : 'N/A'}</td>
            <td>${date}</td>
            <td><strong style="color: #2563eb;">${Number(order.tongTien || 0).toLocaleString()}đ</strong></td>
            <td>
                <span style="display:inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; background: ${ORDER_STATUS_COLORS[status].bg}; color: ${ORDER_STATUS_COLORS[status].color};">
                    ${status}
                </span>
            </td>
            <td>
                <button class="btn-edit" onclick="viewOrderDetails('${order.maHd}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        container.appendChild(tr);
    });
}

async function changeOrderStatus(orderId, trangThai) {
    try {
        const res = await fetch(`http://localhost:3000/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trangThai })
        });
        const result = await res.json();
        if (result.success) {
            Swal.fire({ icon: 'success', title: 'Đã cập nhật trạng thái', timer: 1500, showConfirmButton: false });
            if (currentViewingOrder && currentViewingOrder.maHd === orderId) {
                currentViewingOrder.trangThai = trangThai;
                // Refresh modal nếu đang mở
                viewOrderDetails(orderId);
            }
            loadOrders(); // Reload bảng
            loadDashboardStats(); // Reload biểu đồ ở Dashboard
        } else {
            Swal.fire('Lỗi', result.message || 'Không thể cập nhật', 'error');
        }
    } catch (e) {
        console.error('changeOrderStatus error:', e);
        Swal.fire('Lỗi', 'Không thể kết nối server', 'error');
    }
}

// 3. Cập nhật hàm showTab để tự động tải dữ liệu khi nhấn vào tab Đơn hàng
const originalShowTab = showTab; // Giữ lại hàm cũ
showTab = function (tabName) {
    originalShowTab(tabName); // Gọi hàm chuyển tab cũ
    if (tabName === 'orders') {
        loadOrders();
    } else if (tabName === 'products') {
        loadProducts(currentPage);
    } else if (tabName === 'customers') {
        loadCustomers();
    } else if (tabName === 'inventory') {
        loadImportHistory();
    } else if (tabName === 'suppliers') {
        loadSuppliers();
    } else if (tabName === 'brands') {
        loadBrands();
    } else if (tabName === 'branches') {
        loadBranches();
    } else if (tabName === 'warehouses') {
        loadWarehouses();
    } else if (tabName === 'roles') {
        loadRoles();
    } else if (tabName === 'employees') {
        loadEmployees();
    } else if (tabName === 'overview') {
        loadDashboardStats();
    }
};

let revenueChartInstance = null;
let statusChartInstance = null;

async function loadDashboardStats() {
    try {
        const response = await fetch('http://localhost:3000/api/orders/stats');
        const result = await response.json();

        if (result.success) {
            updateStatistics(result); // Using totalValue from this API if needed, or keep existing logic
            renderCharts(result);
            renderTopProducts(result.topProducts);
        }
    } catch (error) {
        console.error("Lỗi tải thống kê Dashboard:", error);
    }
}

function renderCharts(data) {
    const revenueCtx = document.getElementById('revenueChart');
    const statusCtx = document.getElementById('statusChart');
    if (!revenueCtx || !statusCtx) return;

    // 1. Biểu đồ doanh thu (Line)
    const labels = Object.keys(data.revenueByMonth).reverse();
    const revenueData = Object.values(data.revenueByMonth).reverse();

    if (revenueChartInstance) revenueChartInstance.destroy();

    revenueChartInstance = new Chart(revenueCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Doanh thu (VNĐ)',
                data: revenueData,
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return value.toLocaleString() + 'đ';
                        }
                    }
                }
            }
        }
    });

    // 2. Biểu đồ trạng thái đơn hàng (Doughnut)
    if (data.statusStats && data.statusStats.length > 0) {
        const statusLabels = data.statusStats.map(s => s.trangThai);
        const statusValues = data.statusStats.map(s => parseInt(s.count));

        const statusColors = {
            'Chờ xử lý': '#fbbf24',
            'Đã hoàn thành': '#10b981',
            'Đã hủy': '#ef4444'
        };
        const bgColors = statusLabels.map(l => statusColors[l] || '#cbd5e1');

        if (statusChartInstance) statusChartInstance.destroy();

        statusChartInstance = new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: statusLabels,
                datasets: [{
                    data: statusValues,
                    backgroundColor: bgColors,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 15
                        }
                    }
                }
            }
        });
    }
}

function renderTopProducts(products) {
    const container = document.getElementById('topProductsTable');
    if (!container) return;

    if (!products || products.length === 0) {
        container.innerHTML = '<p style="color:#64748b; text-align:center; padding: 20px;">Chưa có dữ liệu bán hàng.</p>';
        return;
    }

    let html = `
        <div class="table-container" style="margin: 0;">
            <table>
                <thead>
                    <tr>
                        <th style="text-align: left; padding: 12px 15px;">Sản phẩm</th>
                        <th style="text-align: center; padding: 12px 15px;">Số lượng đã bán</th>
                        <th style="text-align: right; padding: 12px 15px;">Doanh thu mang lại</th>
                    </tr>
                </thead>
                <tbody>
    `;

    products.forEach((p, index) => {
        // Add a medal emoji for the top 3
        let medal = '';
        if (index === 0) medal = '🥇 ';
        else if (index === 1) medal = '🥈 ';
        else if (index === 2) medal = '🥉 ';
        else medal = `<span style="color:#94a3b8; font-size:0.8rem; margin-right:4px;">#${index + 1}</span> `;

        html += `
            <tr>
                <td style="padding: 12px 15px; font-weight: 500;">
                    ${medal}${p.name}
                </td>
                <td style="padding: 12px 15px; text-align: center;">
                    <span style="background: #e0e7ff; color: #4338ca; padding: 3px 10px; border-radius: 12px; font-weight: 700;">
                        ${p.totalSold}
                    </span>
                </td>
                <td style="padding: 12px 15px; text-align: right; font-weight: 700; color: #10b981;">
                    ${p.totalRevenue.toLocaleString()} ₫
                </td>
            </tr>
        `;
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

window.onload = () => {
    const savedTab = localStorage.getItem('activeTab') || 'overview';
    const savedPage = parseInt(localStorage.getItem('currentPage')) || 1;

    showTab(savedTab);
    // Nếu active tab là overview thì showTab đã gọi loadDashboardStats rồi
    // Nếu active tab là products thì loadProducts đã được gọi
};

// ------------------------------------------------------------------
// Order Detail Modal Logic (Restored)
const orderDetailModal = document.getElementById("orderDetailModal");

// Đóng modal đơn hàng
document.querySelectorAll(".close-order-btn").forEach(btn => {
    btn.onclick = () => orderDetailModal.style.display = "none";
});

// Hàm xem chi tiết đơn hàng
let currentViewingOrder = null;
async function viewOrderDetails(orderId) {
    try {
        const response = await fetch(`http://localhost:3000/api/orders/${orderId}`);
        const result = await response.json();

        if (result.success) {
            const order = result.data;
            currentViewingOrder = order;

            // 1. Mã đơn hàng
            document.getElementById("displayOrderId").innerText = order.maHd;

            // 2. Thông tin khách hàng & đơn hàng (card style)
            const date = new Date(order.ngayLap || order.createdAt).toLocaleString('vi-VN');
            const status = order.trangThai || 'Chờ xử lý';
            const sc = ORDER_STATUS_COLORS[status] || { bg: '#f1f5f9', color: '#64748b' };

            document.getElementById("orderInfo").innerHTML = `
                <div style="background: #f8fafc; border-radius: 12px; padding: 16px;">
                    <h4 style="font-size: 0.85rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;"><i class="fas fa-user" style="margin-right: 6px;"></i>Khách hàng</h4>
                    <p style="font-weight: 600; font-size: 1rem; margin-bottom: 6px;">${order.KhachHang ? order.KhachHang.hoTen : 'N/A'}</p>
                    <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 4px;"><i class="fas fa-phone" style="width:16px; color:#6366f1;"></i> ${order.KhachHang ? order.KhachHang.sdt : 'N/A'}</p>
                    <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 4px;"><i class="fas fa-envelope" style="width:16px; color:#6366f1;"></i> ${order.KhachHang ? order.KhachHang.email : 'N/A'}</p>
                    <p style="color: #64748b; font-size: 0.9rem;"><i class="fas fa-map-marker-alt" style="width:16px; color:#6366f1;"></i> ${order.KhachHang ? (order.KhachHang.diaChi || 'Chưa cập nhật') : 'N/A'}</p>
                </div>
                <div style="background: #f8fafc; border-radius: 12px; padding: 16px;">
                    <h4 style="font-size: 0.85rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;"><i class="fas fa-info-circle" style="margin-right: 6px;"></i>Thông tin đơn</h4>
                    <p style="margin-bottom: 8px;"><strong>Ngày đặt:</strong> ${date}</p>
                    <p style="margin-bottom: 12px;">
                        <strong>Trạng thái hiện tại:</strong> 
                        <span style="display:inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; background: ${sc.bg}; color: ${sc.color};">${status}</span>
                    </p>
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #e2e8f0;">
                        <label style="display:block; font-size: 0.8rem; color: #64748b; margin-bottom: 5px; font-weight:600;">Cập nhật trạng thái:</label>
                        <select class="status-select" onchange="changeOrderStatus('${order.maHd}', this.value)" style="width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.9rem; cursor: pointer; background: white;">
                            ${ORDER_STATUSES.map(s => `<option value="${s}" ${s === status ? 'selected' : ''}>${s}</option>`).join('')}
                        </select>
                    </div>
                    ${order.ghiChu ? `<p style="margin-top: 8px; color: #64748b; font-size: 0.85rem;"><i class="fas fa-sticky-note" style="color:#f59e0b;"></i> ${order.ghiChu}</p>` : ''}
                </div>
            `;

            // 3. Bảng sản phẩm
            const itemsContainer = document.getElementById("orderItemsTableBody");
            const orderItems = order.DongMays || [];
            if (orderItems.length === 0) {
                itemsContainer.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 30px; color: #94a3b8;"><i class="fas fa-box-open" style="font-size:1.5rem; display:block; margin-bottom:8px;"></i>Chưa có sản phẩm</td></tr>';
            } else {
                itemsContainer.innerHTML = "";
                orderItems.forEach(p => {
                    const ct = p.CtHoaDon || p.ctHoaDon || {};
                    const qty = ct.soLuong || 0;
                    const priceAtPurchase = Number(ct.donGia || 0);
                    const thanhTien = Number(ct.thanhTien || priceAtPurchase * qty);
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td style="padding: 14px 20px;">
                            <div style="display:flex; align-items:center; gap:10px;">
                                ${p.hinhAnh
                            ? `<img src="/${p.hinhAnh}" style="width:40px; height:40px; border-radius:8px; object-fit:cover;">`
                            : `<div style="width:40px; height:40px; border-radius:8px; background:linear-gradient(135deg,#667eea,#764ba2); display:flex; align-items:center; justify-content:center; color:white; font-size:0.8rem;"><i class="fas fa-laptop"></i></div>`
                        }
                                <span style="font-weight:500;">${p.tenModel || '—'}</span>
                            </div>
                        </td>
                        <td style="padding: 14px 20px;">
                            <div style="font-family: monospace; font-size: 0.85em; color: #475569;">
                                ${p.serials && p.serials.length > 0 ? p.serials.join('<br>') : '<span style="color:#94a3b8; font-style:italic;">Trống</span>'}
                            </div>
                        </td>
                        <td style="padding: 14px 20px; text-align: right;">${priceAtPurchase.toLocaleString()}đ</td>
                        <td style="padding: 14px 20px; text-align: center;">
                            <span style="background:#eef2ff; color:#4f46e5; padding:2px 10px; border-radius:6px; font-weight:600;">${qty}</span>
                        </td>
                        <td style="padding: 14px 20px; text-align: right; font-weight: 600; color: #1e293b;">${thanhTien.toLocaleString()}đ</td>
                    `;
                    itemsContainer.appendChild(tr);
                });
            }

            // 4. Tổng tiền
            document.getElementById("orderTotalDetail").innerText = Number(order.tongTien || 0).toLocaleString() + "đ";

            // Hiện modal
            orderDetailModal.style.display = "flex";
        }
    } catch (error) {
        console.error("Lỗi khi tải chi tiết đơn hàng:", error);
        Swal.fire("Lỗi", "Không thể lấy thông tin chi tiết đơn hàng", "error");
    }
}

async function confirmUpdateStatus() {
    const order = currentViewingOrder;
    if (!order) return;
    const { value: trangThai } = await Swal.fire({
        title: 'Cập nhật trạng thái',
        input: 'select',
        inputOptions: Object.fromEntries(ORDER_STATUSES.map(s => [s, s])),
        inputValue: order.trangThai || 'Chờ xử lý',
        showCancelButton: true,
        inputValidator: (v) => !v && 'Chọn trạng thái'
    });
    if (trangThai) await changeOrderStatus(order.maHd, trangThai);
}



function printInvoice() {
    if (!currentViewingOrder) return;

    const order = currentViewingOrder;
    const printWindow = window.open('', '', 'height=600,width=800');

    const date = new Date(order.ngayLap || order.createdAt).toLocaleString('vi-VN');

    let itemsHtml = '';

    const printItems = order.DongMays || [];
    printItems.forEach(p => {
        const ct = p.CtHoaDon || p.ctHoaDon || {};
        const qty = ct.soLuong || 0;
        const price = Number(ct.donGia || 0);
        const total = Number(ct.thanhTien || qty * price);
        itemsHtml += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px;">
                    ${p.tenModel || '—'}
                    ${p.serials && p.serials.length > 0 ? `<br><small style="color: #666; font-family: monospace;">S/N: ${p.serials.join(', ')}</small>` : ''}
                </td>
                <td style="padding: 8px; text-align: center;">${qty}</td>
                <td style="padding: 8px; text-align: right;">${price.toLocaleString()}đ</td>
                <td style="padding: 8px; text-align: right;">${total.toLocaleString()}đ</td>
            </tr>
        `;
    });

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Hóa Đơn ${order.maHd}</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
                .store-name { font-size: 24px; font-weight: bold; color: #4f46e5; text-transform: uppercase; }
                .invoice-title { font-size: 20px; font-weight: bold; margin-top: 15px; }
                .info-section { margin-bottom: 30px; display: flex; justify-content: space-between; }
                .info-box { width: 48%; }
                .info-box h4 { margin: 0 0 10px 0; border-bottom: 1px solid #eee; padding-bottom: 5px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th { background-color: #f8f9fa; padding: 10px; border-bottom: 2px solid #ddd; text-align: left; font-weight: 600; }
                th:last-child, td:last-child { text-align: right; }
                .total-section { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; color: #2563eb; }
                .footer { margin-top: 50px; text-align: center; font-size: 13px; color: #666; font-style: italic; }
                @media print {
                    @page { margin: 20px; }
                    body { margin: 0; }
                    .btn-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="store-name">LAPTOP STORE</div>
                <div>Địa chỉ: 123 Đường Công Nghệ, Q. Thủ Đức, TP.HCM</div>
                <div>Hotline: 0123.456.789 - Email: support@laptopstore.com</div>
                <div class="invoice-title">HÓA ĐƠN BÁN HÀNG</div>
            </div>

            <div class="info-section">
                <div class="info-box">
                    <h4>Khách hàng</h4>
                    <strong>${order.KhachHang ? order.KhachHang.hoTen : ''}</strong><br>
                    SĐT: ${order.KhachHang ? order.KhachHang.sdt : ''}<br>
                    Địa chỉ: ${order.KhachHang ? (order.KhachHang.diaChi || 'Tại cửa hàng') : ''}
                </div>
                <div class="info-box" style="text-align: right;">
                    <h4>Đơn hàng</h4>
                    Đơn số: <strong>${order.maHd}</strong><br>
                    Ngày đặt: ${date}<br>
                    Trạng thái: ${order.trangThai || 'Chờ xử lý'}
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Sản phẩm</th>
                        <th style="text-align: center;">SL</th>
                        <th style="text-align: right;">Đơn giá</th>
                        <th style="text-align: right;">Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>

            <div class="total-section">
                Tổng cộng: ${Number(order.tongTien || 0).toLocaleString()}đ
            </div>

            <div class="footer">
                <p>Cảm ơn quý khách đã mua sắm tại Laptop Store!</p>
                <p>Vui lòng giữ lại hóa đơn để được bảo hành sản phẩm.</p>
            </div>
            
            <script>
                window.onload = function() { 
                    setTimeout(function() { window.print(); }, 500); 
                }
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
}

// 4. Quản lý khách hàng
async function loadCustomers() {
    try {
        const keyword = document.getElementById("searchCustomerInput") ? document.getElementById("searchCustomerInput").value : '';
        const url = keyword
            ? `http://localhost:3000/api/users/search?query=${keyword}`
            : 'http://localhost:3000/api/users';

        const response = await fetch(url);
        const result = await response.json();

        if (result.success) {
            renderCustomersTable(result.data);
        }
    } catch (error) {
        console.error("Lỗi khi tải danh sách khách hàng:", error);
    }
}

function renderCustomersTable(users) {
    const container = document.getElementById("customerTableBody");
    if (!container) return;
    container.innerHTML = "";

    users.forEach(user => {
        const date = new Date(user.createdAt || new Date()).toLocaleDateString('vi-VN');
        const status = user.trangThai; // Boolean
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${user.maKh}</strong></td>
            <td style="font-size: 0.95rem;"><strong>${user.hoTen}</strong> ${user.email ? `<br><small style="color:#94a3b8; font-weight:400;">${user.email}</small>` : ''}</td>
            <td style="font-size: 0.95rem;"><i class="fas fa-phone" style="font-size: 0.75rem; color: #64748b; margin-right: 6px;"></i>${user.sdt}</td>
            <td style="font-size: 0.9rem; color: #475569;">${user.diaChi || '—'}</td>
            <td>${date}</td>
            <td>
                <span class="status-badge ${status ? 'status-active' : 'status-inactive'}">
                    ${status ? 'Hoạt động' : 'Đã khóa'}
                </span>
            </td>
            <td>
                <div style="display: flex; gap: 8px; justify-content: center;">
                    <button class="btn-edit" onclick='openCustomerModal(${JSON.stringify(user)})' title="Sửa"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" style="background:${status ? '#ef4444' : '#10b981'}" onclick="toggleUserLock('${user.maKh}')" title="${status ? 'Khóa' : 'Mở khóa'}">
                        <i class="fas ${status ? 'fa-lock' : 'fa-unlock'}"></i>
                    </button>
                </div>
            </td>
        `;
        container.appendChild(tr);
    });
}

// Hàm xử lý khóa/mở khóa
async function toggleUserLock(userId) {
    const confirmText = "Bạn có chắc chắn muốn thực hiện thao tác này?";
    const result = await Swal.fire({
        title: 'Xác nhận',
        text: confirmText,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Đồng ý',
        cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
        try {
            const response = await fetch(`http://localhost:3000/api/users/${userId}/lock`, {
                method: 'PUT'
            });
            const data = await response.json();

            if (data.success) {
                Swal.fire("Thành công", data.message, "success");
                loadCustomers();
            } else {
                Swal.fire("Lỗi", data.message, "error");
            }
        } catch (error) {
            Swal.fire("Lỗi", "Không thể kết nối đến server", "error");
        }
    }
}

const searchCustomerInput = document.getElementById("searchCustomerInput");
if (searchCustomerInput) {
    let timeout = null;
    searchCustomerInput.oninput = (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            loadCustomers();
        }, 300);
    };
}

// Hàm mở modal Thêm/Sửa khách hàng
// Hàm mở modal Thêm/Sửa khách hàng
async function openCustomerModal(user = null) {
    const isEdit = !!user;
    let nextId = user?.maKh || '';

    // Nếu là thêm mới, tự động lấy mã tiếp theo
    if (!isEdit) {
        try {
            const res = await fetch('http://localhost:3000/api/users/next-id');
            const result = await res.json();
            if (result.success) {
                nextId = result.nextId;
            }
        } catch (error) {
            console.error("Lỗi lấy mã KH tiếp theo:", error);
            nextId = 'KH' + Date.now().toString().slice(-3); // Fallback
        }
    }

    Swal.fire({
        title: isEdit ? 'Cập nhật khách hàng' : 'Thêm khách hàng mới',
        width: 650,
        html: `
            <div style="text-align:left; padding: 10px;">
                <!-- Section 1: Basic Info -->
                <div style="margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">
                    <h4 style="margin-bottom: 12px; font-size: 0.9rem; color: #4f46e5; display: flex; align-items: center;">
                        <i class="fas fa-id-card" style="margin-right: 8px;"></i> Thông tin cơ bản
                    </h4>
                    <div style="display:grid; grid-template-columns: 1fr 2fr; gap:15px; margin-bottom:12px;">
                        <div>
                            <label style="font-weight:600; font-size:0.8rem; display:block; margin-bottom:5px; color: #64748b;">Mã khách hàng</label>
                            <input id="swalMaKh" class="swal2-input" style="width:100%; margin:0; height: 38px; font-size: 0.9rem; background: #f8fafc;" value="${nextId}" disabled placeholder="Tự động tạo">
                        </div>
                        <div>
                            <label style="font-weight:600; font-size:0.8rem; display:block; margin-bottom:5px; color: #64748b;">Họ và tên <span style="color:red;">*</span></label>
                            <input id="swalHoTenKh" class="swal2-input" style="width:100%; margin:0; height: 38px; font-size: 0.9rem;" value="${user?.hoTen || ''}" placeholder="Nguyễn Văn A" autocomplete="off">
                        </div>
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                        <div>
                            <label style="font-weight:600; font-size:0.8rem; display:block; margin-bottom:5px; color: #64748b;">Giới tính</label>
                            <select id="swalGioiTinhKh" class="swal2-input" style="width:100%; margin:0; height: 38px; font-size: 0.9rem; padding: 0 10px; appearance: auto;">
                                <option value="Nam" ${user?.gioiTinh === 'Nam' ? 'selected' : ''}>Nam</option>
                                <option value="Nữ" ${user?.gioiTinh === 'Nữ' ? 'selected' : ''}>Nữ</option>
                                <option value="Khác" ${user?.gioiTinh === 'Khác' ? 'selected' : ''}>Khác</option>
                            </select>
                        </div>
                        <div>
                            <label style="font-weight:600; font-size:0.8rem; display:block; margin-bottom:5px; color: #64748b;">Ngày sinh</label>
                            <input id="swalNgaySinhKh" type="date" class="swal2-input" style="width:100%; margin:0; height: 38px; font-size: 0.9rem;" value="${user?.ngaySinh || ''}">
                        </div>
                    </div>
                </div>

                <!-- Section 2: Contact -->
                <div style="margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">
                    <h4 style="margin-bottom: 12px; font-size: 0.9rem; color: #4f46e5; display: flex; align-items: center;">
                        <i class="fas fa-address-book" style="margin-right: 8px;"></i> Thông tin liên hệ
                    </h4>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:12px;">
                        <div>
                            <label style="font-weight:600; font-size:0.8rem; display:block; margin-bottom:5px; color: #64748b;">Email</label>
                            <input id="swalEmailKh" type="email" class="swal2-input" style="width:100%; margin:0; height: 38px; font-size: 0.9rem;" value="${user?.email || ''}" placeholder="khach@gmail.com" autocomplete="off">
                        </div>
                        <div>
                            <label style="font-weight:600; font-size:0.8rem; display:block; margin-bottom:5px; color: #64748b;">Số điện thoại <span style="color:red;">*</span></label>
                            <input id="swalSdtKh" class="swal2-input" style="width:100%; margin:0; height: 38px; font-size: 0.9rem;" value="${user?.sdt || ''}" placeholder="09xxxxxx" autocomplete="off">
                        </div>
                    </div>
                    <div>
                        <label style="font-weight:600; font-size:0.8rem; display:block; margin-bottom:5px; color: #64748b;">Địa chỉ thường trú</label>
                        <div style="position:relative;">
                            <i class="fas fa-map-marker-alt" style="position:absolute; left:12px; top:11px; color:#94a3b8; font-size:0.9rem;"></i>
                            <input id="swalDiaChiKh" class="swal2-input" style="width:100%; margin:0; height:38px; font-size:0.9rem; padding-left:35px !important;" value="${user?.diaChi || ''}" placeholder="Số nhà, tên đường, phường/xã..." autocomplete="off">
                        </div>
                    </div>
                </div>

                <!-- Section 3: Account (Only for Create) -->
                ${!isEdit ? `
                <div>
                    <h4 style="margin-bottom: 12px; font-size: 0.9rem; color: #4f46e5; display: flex; align-items: center;">
                        <i class="fas fa-lock" style="margin-right: 8px;"></i> Tài khoản đăng nhập
                    </h4>
                    <div style="display:grid; grid-template-columns: 1fr; gap:15px;">
                        <div>
                            <label style="font-weight:600; font-size:0.8rem; display:block; margin-bottom:5px; color: #64748b;">Mật khẩu <span style="color:red;">*</span></label>
                            <input id="swalMatKhauKh" type="password" class="swal2-input" style="width:100%; margin:0; height: 38px; font-size: 0.9rem;" placeholder="Mật khẩu đăng nhập" autocomplete="new-password">
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: isEdit ? 'Cập nhật' : 'Thêm mới',
        cancelButtonText: 'Hủy',
        confirmButtonColor: '#4f46e5',
        preConfirm: () => {
            const maKh = document.getElementById('swalMaKh').value.trim();
            const hoTen = document.getElementById('swalHoTenKh').value.trim();
            const sdt = document.getElementById('swalSdtKh').value.trim();
            const matKhau = document.getElementById('swalMatKhauKh')?.value;

            if (!maKh || !hoTen || !sdt || (!isEdit && !matKhau)) {
                Swal.showValidationMessage('Vui lòng nhập đầy đủ các trường bắt buộc (*)');
                return false;
            }
            return {
                maKh, hoTen, sdt,
                email: document.getElementById('swalEmailKh').value.trim(),
                diaChi: document.getElementById('swalDiaChiKh').value.trim(),
                ngaySinh: document.getElementById('swalNgaySinhKh').value || null,
                gioiTinh: document.getElementById('swalGioiTinhKh').value,
                matKhau
            };
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            await saveCustomer(result.value, isEdit);
        }
    });
}

async function saveCustomer(data, isEdit) {
    try {
        const url = isEdit ? `/api/users/${data.maKh}` : '/api/users';
        const method = isEdit ? 'PUT' : 'POST';
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
            Swal.fire({ icon: 'success', title: result.message, timer: 1500, showConfirmButton: false });
            loadCustomers();
        } else {
            Swal.fire('Lỗi', result.message, 'error');
        }
    } catch (error) {
        Swal.fire('Lỗi', 'Không thể kết nối đến server', 'error');
    }
}

// 5. Quản lý Kho Hàng (Import)
// Lịch sử nhập hàng lấy bằng hàm loadImportHistory ở cuối file

// ------------------------------------------------------------------
// View Import Detail Modal Logic
const viewImportDetailModal = document.getElementById("viewImportDetailModal");

// Đóng modal chi tiết phiếu nhập
document.querySelectorAll(".close-view-import-btn").forEach(btn => {
    btn.onclick = () => viewImportDetailModal.style.display = "none";
});

// Hàm xem chi tiết phiếu nhập
async function viewImportDetails(receiptId) {
    try {
        const response = await fetch(`/api/imports/${receiptId}`);
        const result = await response.json();

        if (result.success) {
            const receipt = result.data;
            const date = new Date(receipt.ngayNhap || receipt.createdAt).toLocaleString('vi-VN');

            // 1. Hiển thị ID và thông tin chung
            document.getElementById("displayImportId").innerText = receipt.maPn;
            document.getElementById("importInfo").innerHTML = `
                <div>
                    <p><strong>Ngày nhập:</strong> ${date}</p>
                    <p><strong>Nhà cung cấp:</strong> ${receipt.NhaCungCap ? receipt.NhaCungCap.tenNcc : '—'}</p>
                </div>
                <div>
                     <p><strong>Nhân viên lập:</strong> ${receipt.NhanVien ? receipt.NhanVien.hoTen : '—'}</p>
                     <p><strong>Ghi chú:</strong> ${receipt.ghiChu || 'Không có'}</p>
                </div>
            `;

            // 2. Hiển thị danh sách sản phẩm
            const itemsContainer = document.getElementById("viewImportItemsTableBody");
            itemsContainer.innerHTML = "";

            if (receipt.DongMays) {
                receipt.DongMays.forEach(p => {
                    const qty = p.CtNhapMay ? p.CtNhapMay.soLuong : 0;
                    const price = p.CtNhapMay ? Number(p.CtNhapMay.donGia) : 0;
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${p.tenModel}</td>
                        <td>${Number(price).toLocaleString()}đ</td>
                        <td>${qty}</td>
                        <td>${(price * qty).toLocaleString()}đ</td>
                    `;
                    itemsContainer.appendChild(tr);
                });
            }

            // 3. Hiển thị tổng tiền
            document.getElementById("viewImportTotalDetail").innerText = Number(receipt.tongTien || 0).toLocaleString() + "đ";

            // Hiện modal
            viewImportDetailModal.style.display = "flex";
        }
    } catch (error) {
        console.error("Lỗi khi tải chi tiết phiếu nhập:", error);
        Swal.fire("Lỗi", "Không thể lấy thông tin chi tiết phiếu nhập", "error");
    }
}

function addImportItem() {
    const select = document.getElementById("importProductSelect");
    const productId = select.value;
    const productName = select.options[select.selectedIndex].getAttribute('data-name') || select.options[select.selectedIndex].text;
    const quantity = parseInt(document.getElementById("importQuantity").value);
    const price = Number(document.getElementById("importPrice").value);

    if (!productId || quantity <= 0 || price < 0) {
        Swal.fire("Lỗi", "Vui lòng kiểm tra lại thông tin nhập", "error");
        return;
    }

    // Kiểm tra xem sản phẩm đã có trong danh sách chưa
    const existingItem = importItems.find(i => i.productId == productId);
    if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.price = price; // Cập nhật giá mới nhất
    } else {
        importItems.push({ productId, productName, quantity, price });
    }

    renderImportItems();
}

function removeImportItem(index) {
    importItems.splice(index, 1);
    renderImportItems();
}

function renderImportItems() {
    const container = document.getElementById("importItemsBody");
    container.innerHTML = "";
    let totalAmount = 0;

    importItems.forEach((item, index) => {
        const subtotal = item.quantity * item.price;
        totalAmount += subtotal;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${item.productName}</td>
            <td>${item.quantity}</td>
            <td>${item.price.toLocaleString()}đ</td>
            <td>${subtotal.toLocaleString()}đ</td>
            <td>
                <button class="btn-delete" onclick="removeImportItem(${index})"><i class="fas fa-trash"></i></button>
            </td>
        `;
        container.appendChild(tr);
    });

    document.getElementById("importTotalAmount").innerText = totalAmount.toLocaleString() + "đ";
}

async function submitImportReceipt() {
    if (importItems.length === 0) {
        Swal.fire("Lỗi", "Danh sách nhập hàng đang trống", "error");
        return;
    }

    const note = document.getElementById("importNote").value;

    try {
        const response = await fetch('/api/imports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                note,
                items: importItems
            })
        });

        const result = await response.json();
        if (result.success) {
            Swal.fire("Thành công", "Đã nhập hàng thành công!", "success");
            importModal.style.display = "none";
            loadImportHistory();
            loadProducts(); // Cập nhật lại kho bên tab Sản phẩm
        } else {
            Swal.fire("Lỗi", result.message, "error");
        }
    } catch (error) {
        console.error(error);
        Swal.fire("Lỗi", "Không thể gửi dữ liệu", "error");
    }
}

// 6. Quản lý Tồn kho (Stock)
async function loadStockData() {
    const keyword = document.getElementById("searchStockInput") ? document.getElementById("searchStockInput").value : '';
    try {
        // Fetch all products for stock view
        const response = await fetch(`/api/products?limit=1000&search=${keyword}`);
        const result = await response.json();

        if (result.success) {
            const products = result.data;
            renderStockStats(products);
            renderStockTable(products);
        }
    } catch (error) {
        console.error("Lỗi tải dữ liệu tồn kho:", error);
    }
}

function renderStockStats(products) {
    const totalProducts = products.length;
    let lowStockCount = 0;
    let totalValue = 0;

    products.forEach(p => {
        if ((p.soLuongTon || 0) < 5) lowStockCount++;
        totalValue += (p.giaBan || 0) * (p.soLuongTon || 0);
    });

    document.getElementById("stockTotalProducts").innerText = totalProducts;
    document.getElementById("stockLowCount").innerText = lowStockCount;
    document.getElementById("stockTotalValue").innerText = totalValue.toLocaleString() + "đ";
}

function renderStockTable(products) {
    const container = document.getElementById("stockTableBody");
    if (!container) return;
    container.innerHTML = "";

    products.forEach(p => {
        let statusHtml = '';
        const soLuong = p.soLuongTon || 0;
        const giaBan = p.giaBan || 0;

        if (soLuong === 0) {
            statusHtml = '<span style="color:red; font-weight:bold;">Hết hàng</span>';
        } else if (soLuong < 5) {
            statusHtml = '<span style="color:orange; font-weight:bold;">Sắp hết</span>';
        } else {
            statusHtml = '<span style="color:green; font-weight:bold;">Còn hàng</span>';
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="/${p.hinhAnh}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;" onerror="this.src='https://via.placeholder.com/40'">
                    <strong>${p.tenModel}</strong>
                </div>
            </td>
            <td>${Number(giaBan).toLocaleString()}đ</td>
            <td style="font-weight:bold; font-size:1.1rem;">${soLuong}</td>
            <td>${(giaBan * soLuong).toLocaleString()}đ</td>
            <td>
                <div style="display:flex; flex-direction: column; align-items: flex-start; gap: 8px;">
                    <div>${statusHtml}</div>
                    <button onclick="viewSerials('${p.maModel}', '${p.tenModel}')" style="background:#6366f1; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer; font-size: 0.8rem;">
                        <i class="fas fa-barcode"></i> Xem Serial
                    </button>
                </div>
            </td>
        `;
        container.appendChild(tr);
    });
}

async function viewSerials(maModel, tenModel) {
    try {
        const response = await fetch('/api/products/' + maModel + '/serials');
        const result = await response.json();

        let html = '';
        if (result.success && result.data && result.data.length > 0) {
            html = '<div style="max-height: 250px; overflow-y: auto; text-align: left; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 10px;">';
            html += result.data.map((s, idx) => `<div style="padding: 6px 0; border-bottom: ${idx < result.data.length - 1 ? '1px solid #e2e8f0' : 'none'}; font-family: monospace; font-size: 0.95rem; color: #334155;"><span style="color:#94a3b8; margin-right:8px;">${idx + 1}.</span> ${s.soSerial}</div>`).join('');
            html += '</div>';
        } else {
            html = '<div style="padding: 15px; background: #fee2e2; color: #dc2626; border-radius: 8px; margin-top: 10px; font-weight: 500;">Sản phẩm này hiện chưa có mã Serial (hoặc đã hết hàng trong kho).</div>';
        }

        Swal.fire({
            title: '<h3 style="font-size: 1.25rem; color: #1e293b; margin: 0; display:flex; align-items:center; justify-content:center; gap:8px;"><i class="fas fa-barcode" style="color:#6366f1;"></i> Danh sách Serial / IMEI</h3>',
            html: `
                <div style="font-weight: 600; font-size: 0.95rem; color: #475569; margin-bottom: 5px;">Model: <span style="color:#0f172a;">${tenModel}</span></div>
                <div style="font-size: 0.85rem; color: #64748b;">(Chỉ hiển thị các máy đang "Trong kho")</div>
                ${html}
            `,
            showCloseButton: true,
            showConfirmButton: true,
            confirmButtonText: 'Đóng',
            confirmButtonColor: '#64748b',
            width: 500,
            customClass: {
                popup: 'swal-wide-popup'
            }
        });
    } catch (error) {
        console.error("Lỗi khi tải serial:", error);
        Swal.fire('Lỗi', 'Không thể xem Serial từ máy chủ', 'error');
    }
}

const searchStockInput = document.getElementById("searchStockInput");
if (searchStockInput) {
    let timeout = null;
    searchStockInput.oninput = () => {
        clearTimeout(timeout);
        timeout = setTimeout(loadStockData, 300);
    }
}

function logoutAdmin() {
    Swal.fire({
        title: 'Đăng xuất?',
        text: "Bạn có chắc chắn muốn đăng xuất không?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Đăng xuất',
        cancelButtonText: 'Hủy'
    }).then((result) => {
        if (result.isConfirmed) {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            window.location.href = '/admin/login.html';
        }
    });
}



// ==================== QUẢN LÝ NHÀ CUNG CẤP ====================

let editingSupplier = null;

async function loadSuppliers() {
    try {
        const search = document.getElementById('searchSupplierInput')?.value || '';
        const response = await fetch(`/api/suppliers?search=${encodeURIComponent(search)}`);
        const result = await response.json();
        if (result.success) {
            renderSuppliersTable(result.data);
        }
    } catch (error) {
        console.error('Lỗi tải NCC:', error);
    }
}

function renderSuppliersTable(suppliers) {
    const tbody = document.getElementById('supplierTableBody');
    if (!tbody) return;
    tbody.innerHTML = suppliers.map(s => `
        <tr>
            <td><strong>${s.maNcc}</strong></td>
            <td>${s.tenNcc}</td>
            <td>${s.sdt || '—'}</td>
            <td>${s.diaChi || '—'}</td>
            <td>
                <span style="padding: 3px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; white-space: nowrap;
                    ${s.trangThai ? 'background:#dcfce7; color:#16a34a;' : 'background:#fecaca; color:#dc2626;'}">
                    ${s.trangThai ? 'Hoạt động' : 'Ngừng HĐ'}
                </span>
            </td>
            <td>
                <button class="btn-edit" onclick='editSupplier(${JSON.stringify(s)})'><i class="fas fa-edit"></i></button>
                <button class="btn-delete" onclick="deleteSupplier('${s.maNcc}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function openSupplierModal(supplier = null) {
    editingSupplier = supplier;
    Swal.fire({
        title: supplier ? 'Cập nhật nhà cung cấp' : 'Thêm nhà cung cấp mới',
        html: `
            <div style="text-align:left;">
                <div style="margin-bottom:12px;">
                    <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:4px;">Mã NCC <span style="color:red;">*</span></label>
                    <input id="swalMaNcc" class="swal2-input" style="width:100%; margin:0;" value="${supplier?.maNcc || ''}" ${supplier ? 'disabled' : ''} placeholder="VD: NCC001">
                </div>
                <div style="margin-bottom:12px;">
                    <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:4px;">Tên NCC <span style="color:red;">*</span></label>
                    <input id="swalTenNcc" class="swal2-input" style="width:100%; margin:0;" value="${supplier?.tenNcc || ''}" placeholder="Tên nhà cung cấp">
                </div>
                <div style="margin-bottom:12px;">
                    <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:4px;">Số điện thoại</label>
                    <input id="swalSdtNcc" class="swal2-input" style="width:100%; margin:0;" value="${supplier?.sdt || ''}" placeholder="0xxx xxx xxx">
                </div>
                <div style="margin-bottom:12px;">
                    <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:4px;">Địa chỉ</label>
                    <input id="swalDiaChiNcc" class="swal2-input" style="width:100%; margin:0;" value="${supplier?.diaChi || ''}" placeholder="Địa chỉ nhà cung cấp">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: supplier ? 'Cập nhật' : 'Thêm mới',
        cancelButtonText: 'Hủy',
        confirmButtonColor: '#6366f1',
        preConfirm: () => {
            const maNcc = document.getElementById('swalMaNcc').value.trim();
            const tenNcc = document.getElementById('swalTenNcc').value.trim();
            if (!maNcc || !tenNcc) {
                Swal.showValidationMessage('Vui lòng nhập mã và tên NCC');
                return false;
            }
            return {
                maNcc,
                tenNcc,
                sdt: document.getElementById('swalSdtNcc').value.trim(),
                diaChi: document.getElementById('swalDiaChiNcc').value.trim()
            };
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            await saveSupplier(result.value, !!supplier);
        }
    });
}

function editSupplier(supplier) {
    openSupplierModal(supplier);
}

async function saveSupplier(data, isEdit) {
    try {
        const url = isEdit ? `/api/suppliers/${data.maNcc}` : '/api/suppliers';
        const method = isEdit ? 'PUT' : 'POST';
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
            Swal.fire({ icon: 'success', title: result.message, timer: 1500, showConfirmButton: false });
            loadSuppliers();
        } else {
            Swal.fire('Lỗi', result.message, 'error');
        }
    } catch (error) {
        Swal.fire('Lỗi', 'Không thể kết nối server', 'error');
    }
}

async function deleteSupplier(maNcc) {
    const confirm = await Swal.fire({
        title: 'Xóa nhà cung cấp?',
        text: `Bạn có chắc muốn xóa NCC: ${maNcc}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        confirmButtonColor: '#ef4444'
    });
    if (!confirm.isConfirmed) return;

    try {
        const response = await fetch(`/api/suppliers/${maNcc}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
            Swal.fire({ icon: 'success', title: result.message, timer: 1500, showConfirmButton: false });
            loadSuppliers();
        } else {
            Swal.fire('Lỗi', result.message, 'error');
        }
    } catch (error) {
        Swal.fire('Lỗi', 'Không thể kết nối server', 'error');
    }
}

// ==================== QUẢN LÝ HÃNG SẢN XUẤT ====================

let editingBrand = null;

async function loadBrands() {
    try {
        const search = document.getElementById('searchBrandInput')?.value || '';
        const response = await fetch(`/api/brands?search=${encodeURIComponent(search)}`);
        const result = await response.json();
        if (result.success) {
            renderBrandsTable(result.data);
        }
    } catch (error) {
        console.error('Lỗi tải Hãng Sản Xuất:', error);
    }
}

function renderBrandsTable(brands) {
    const tbody = document.getElementById('brandTableBody');
    if (!tbody) return;
    tbody.innerHTML = brands.map(b => `
        <tr>
            <td><strong>${b.maHang}</strong></td>
            <td>${b.tenHang}</td>
            <td>${b.quocGia || '—'}</td>
            <td>
                <button class="btn-edit" onclick='editBrand(${JSON.stringify(b)})'><i class="fas fa-edit"></i></button>
                <button class="btn-delete" onclick="deleteBrand('${b.maHang}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function openBrandModal(brand = null) {
    editingBrand = brand;
    Swal.fire({
        title: brand ? 'Cập nhật hãng sx' : 'Thêm hãng sản xuất',
        html: `
            <div style="text-align:left;">
                <div style="margin-bottom:12px;">
                    <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:4px;">Mã hãng <span style="color:red;">*</span></label>
                    <input id="swalMaHang" class="swal2-input" style="width:100%; margin:0;" value="${brand?.maHang || ''}" ${brand ? 'disabled' : ''} placeholder="VD: ACER">
                </div>
                <div style="margin-bottom:12px;">
                    <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:4px;">Tên hãng <span style="color:red;">*</span></label>
                    <input id="swalTenHang" class="swal2-input" style="width:100%; margin:0;" value="${brand?.tenHang || ''}" placeholder="VD: Acer Inc.">
                </div>
                <div style="margin-bottom:12px;">
                    <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:4px;">Quốc gia</label>
                    <input id="swalQuocGia" class="swal2-input" style="width:100%; margin:0;" value="${brand?.quocGia || ''}" placeholder="VD: Đài Loan">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: brand ? 'Cập nhật' : 'Thêm mới',
        cancelButtonText: 'Hủy',
        confirmButtonColor: '#6366f1',
        preConfirm: () => {
            const maHang = document.getElementById('swalMaHang').value.trim();
            const tenHang = document.getElementById('swalTenHang').value.trim();
            if (!maHang || !tenHang) {
                Swal.showValidationMessage('Vui lòng nhập mã và tên hãng');
                return false;
            }
            return {
                maHang,
                tenHang,
                quocGia: document.getElementById('swalQuocGia').value.trim()
            };
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            await saveBrand(result.value, !!brand);
        }
    });
}

function editBrand(brand) {
    openBrandModal(brand);
}

async function saveBrand(data, isEdit) {
    try {
        const url = isEdit ? `/api/brands/${data.maHang}` : '/api/brands';
        const method = isEdit ? 'PUT' : 'POST';
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
            Swal.fire({ icon: 'success', title: result.message, timer: 1500, showConfirmButton: false });
            loadBrands();
        } else {
            Swal.fire('Lỗi', result.message, 'error');
        }
    } catch (error) {
        Swal.fire('Lỗi', 'Không thể kết nối server', 'error');
    }
}

async function deleteBrand(maHang) {
    const confirm = await Swal.fire({
        title: 'Xóa hãng sản xuất?',
        text: `Bạn có chắc muốn xóa hãng: ${maHang}? LƯU Ý: Không thể xóa nếu hãng này đang có sản phẩm.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        confirmButtonColor: '#ef4444'
    });
    if (!confirm.isConfirmed) return;

    try {
        const response = await fetch(`/api/brands/${maHang}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
            Swal.fire({ icon: 'success', title: result.message, timer: 1500, showConfirmButton: false });
            loadBrands();
        } else {
            Swal.fire('Lỗi', result.message, 'error');
        }
    } catch (error) {
        Swal.fire('Lỗi', 'Không thể kết nối server', 'error');
    }
}

// ==================== QUẢN LÝ CHI NHÁNH ====================

let editingBranch = null;

async function loadBranches() {
    try {
        const search = document.getElementById('searchBranchInput')?.value || '';
        const response = await fetch(`/api/branches?search=${encodeURIComponent(search)}`);
        const result = await response.json();
        if (result.success) {
            renderBranchesTable(result.data);
        }
    } catch (error) {
        console.error('Lỗi tải Chi Nhánh:', error);
    }
}

function renderBranchesTable(branches) {
    const tbody = document.getElementById('branchTableBody');
    if (!tbody) return;
    tbody.innerHTML = branches.map(b => `
        <tr>
            <td><strong>${b.maCn}</strong></td>
            <td>${b.tenCn}</td>
            <td>${b.diaChi || '—'}</td>
            <td>${b.QuanLy ? `<i class="fas fa-user-tie" style="color: #6366f1; margin-right: 4px;"></i> ${b.QuanLy.hoTen}` : '—'}</td>
            <td>
                <button class="btn-edit" onclick='editBranch(${JSON.stringify(b)})'><i class="fas fa-edit"></i></button>
                <button class="btn-delete" onclick="deleteBranch('${b.maCn}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

async function openBranchModal(branch = null) {
    editingBranch = branch;

    // Fetch employees for dropdown
    let options = '<option value="">-- Chọn quản lý --</option>';
    try {
        const res = await fetch('/api/branches/employees');
        const result = await res.json();
        if (result.success) {
            options += result.data.map(emp =>
                `<option value="${emp.maNv}" ${branch?.maNvQuanLy === emp.maNv ? 'selected' : ''}>${emp.hoTen} (${emp.maNv})</option>`
            ).join('');
        }
    } catch (e) {
        console.error('Lỗi lấy danh sách nhân viên', e);
    }

    Swal.fire({
        title: branch ? 'Cập nhật chi nhánh' : 'Thêm chi nhánh',
        html: `
            <div style="text-align:left;">
                <div style="margin-bottom:12px;">
                    <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:4px;">Mã CN <span style="color:red;">*</span></label>
                    <input id="swalMaCn" class="swal2-input" style="width:100%; margin:0;" value="${branch?.maCn || ''}" ${branch ? 'disabled' : ''} placeholder="VD: CN01">
                </div>
                <div style="margin-bottom:12px;">
                    <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:4px;">Tên chi nhánh <span style="color:red;">*</span></label>
                    <input id="swalTenCn" class="swal2-input" style="width:100%; margin:0;" value="${branch?.tenCn || ''}" placeholder="VD: Chi nhánh Quận 1">
                </div>
                <div style="margin-bottom:12px;">
                    <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:4px;">Địa chỉ</label>
                    <input id="swalDiaChiCn" class="swal2-input" style="width:100%; margin:0;" value="${branch?.diaChi || ''}" placeholder="VD: 123 Lê Lợi...">
                </div>
                <div style="margin-bottom:12px;">
                    <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:4px;">Người quản lý</label>
                    <select id="swalMaNvQuanLy" class="swal2-input" style="width:100%; margin:0; appearance:auto !important; -webkit-appearance:auto !important; -moz-appearance:auto !important;">
                        ${options}
                    </select>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: branch ? 'Cập nhật' : 'Thêm mới',
        cancelButtonText: 'Hủy',
        confirmButtonColor: '#6366f1',
        preConfirm: () => {
            const maCn = document.getElementById('swalMaCn').value.trim();
            const tenCn = document.getElementById('swalTenCn').value.trim();
            if (!maCn || !tenCn) {
                Swal.showValidationMessage('Vui lòng nhập mã và tên chi nhánh');
                return false;
            }
            return {
                maCn,
                tenCn,
                diaChi: document.getElementById('swalDiaChiCn').value.trim(),
                maNvQuanLy: document.getElementById('swalMaNvQuanLy').value || null
            };
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            await saveBranch(result.value, !!branch);
        }
    });
}

function editBranch(branch) {
    openBranchModal(branch);
}

async function saveBranch(data, isEdit) {
    try {
        const url = isEdit ? `/api/branches/${data.maCn}` : '/api/branches';
        const method = isEdit ? 'PUT' : 'POST';
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
            Swal.fire({ icon: 'success', title: result.message, timer: 1500, showConfirmButton: false });
            loadBranches();
        } else {
            Swal.fire('Lỗi', result.message, 'error');
        }
    } catch (error) {
        Swal.fire('Lỗi', 'Không thể kết nối server', 'error');
    }
}

async function deleteBranch(maCn) {
    const confirm = await Swal.fire({
        title: 'Xóa chi nhánh?',
        text: `Bạn có chắc muốn xóa chi nhánh: ${maCn}? LƯU Ý: Không thể xóa nếu chi nhánh đang có nhân viên hoặc kho.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        confirmButtonColor: '#ef4444'
    });
    if (!confirm.isConfirmed) return;

    try {
        const response = await fetch(`/ api / branches / ${maCn}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
            Swal.fire({ icon: 'success', title: result.message, timer: 1500, showConfirmButton: false });
            loadBranches();
        } else {
            Swal.fire('Lỗi', result.message, 'error');
        }
    } catch (error) {
        Swal.fire('Lỗi', 'Không thể kết nối server', 'error');
    }
}

// ==================== QUẢN LÝ KHO ====================

let editingWarehouse = null;

async function loadWarehouses() {
    try {
        const search = document.getElementById('searchWarehouseInput')?.value || '';
        const response = await fetch(`/api/warehouses?search=${encodeURIComponent(search)}`);
        const result = await response.json();
        if (result.success) {
            renderWarehousesTable(result.data);
        }
    } catch (error) {
        console.error('Lỗi tải Kho:', error);
    }
}

function renderWarehousesTable(warehouses) {
    const tbody = document.getElementById('warehouseTableBody');
    if (!tbody) return;
    tbody.innerHTML = warehouses.map(w => `
        <tr>
            <td><strong>${w.maKho}</strong></td>
            <td>${w.tenKho}</td>
            <td>${w.diaChi || '—'}</td>
            <td>${w.loaiKho || '—'}</td>
            <td>
                <span style="display:inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.85rem; font-weight: 500; white-space: nowrap; ${w.trangThai ? 'background-color: #d1fae5; color: #065f46;' : 'background-color: #fee2e2; color: #991b1b;'}">
                    ${w.trangThai ? 'Hoạt động' : 'Ngừng HĐ'}
                </span>
            </td>
            <td>
                <button class="btn-edit" onclick='editWarehouse(${JSON.stringify(w)})'><i class="fas fa-edit"></i></button>
                <button class="btn-delete" onclick="deleteWarehouse('${w.maKho}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

async function openWarehouseModal(warehouse = null) {
    editingWarehouse = warehouse;

    const loaiKhoOptions = ['Kho lưu trữ', 'Kho trưng bày', 'Kho bảo hành'];
    const typeOptionsHtml = loaiKhoOptions.map(loai =>
        `<option value="${loai}" ${warehouse?.loaiKho === loai ? 'selected' : ''}>${loai}</option>`
    ).join('');

    Swal.fire({
        title: warehouse ? 'Cập nhật kho' : 'Thêm kho mới',
        html: `
            <div style="text-align:left;">
                <div style="margin-bottom:12px;">
                    <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:4px;">Mã kho <span style="color:red;">*</span></label>
                    <input id="swalMaKho" class="swal2-input" style="width:100%; margin:0;" value="${warehouse?.maKho || ''}" ${warehouse ? 'disabled' : ''} placeholder="VD: KH01">
                </div>
                <div style="margin-bottom:12px;">
                    <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:4px;">Tên kho <span style="color:red;">*</span></label>
                    <input id="swalTenKho" class="swal2-input" style="width:100%; margin:0;" value="${warehouse?.tenKho || ''}" placeholder="VD: Kho chính Quận 1">
                </div>
                <div style="margin-bottom:12px;">
                    <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:4px;">Địa chỉ</label>
                    <input id="swalDiaChiKho" class="swal2-input" style="width:100%; margin:0;" value="${warehouse?.diaChi || ''}" placeholder="VD: 123 Lê Lợi...">
                </div>
                <div style="margin-bottom:12px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:4px;">Loại kho</label>
                        <select id="swalLoaiKho" class="swal2-input" style="width:100%; margin:0; appearance:auto !important; -webkit-appearance:auto !important; -moz-appearance:auto !important;">
                            ${typeOptionsHtml}
                        </select>
                    </div>
                    <div>
                        <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:4px;">Trạng thái</label>
                        <select id="swalTrangThaiKho" class="swal2-input" style="width:100%; margin:0; appearance:auto !important; -webkit-appearance:auto !important; -moz-appearance:auto !important;">
                            <option value="true" ${warehouse?.trangThai !== false ? 'selected' : ''}>Hoạt động</option>
                            <option value="false" ${warehouse?.trangThai === false ? 'selected' : ''}>Ngừng HĐ</option>
                        </select>
                    </div>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: warehouse ? 'Cập nhật' : 'Thêm mới',
        cancelButtonText: 'Hủy',
        confirmButtonColor: '#6366f1',
        preConfirm: () => {
            const maKho = document.getElementById('swalMaKho').value.trim();
            const tenKho = document.getElementById('swalTenKho').value.trim();
            if (!maKho || !tenKho) {
                Swal.showValidationMessage('Vui lòng nhập mã và tên kho');
                return false;
            }
            return {
                maKho,
                tenKho,
                diaChi: document.getElementById('swalDiaChiKho').value.trim(),
                loaiKho: document.getElementById('swalLoaiKho').value,
                trangThai: document.getElementById('swalTrangThaiKho').value === 'true'
            };
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            await saveWarehouse(result.value, !!warehouse);
        }
    });
}

function editWarehouse(warehouse) {
    openWarehouseModal(warehouse);
}

async function saveWarehouse(data, isEdit) {
    try {
        const url = isEdit ? `/api/warehouses/${data.maKho}` : '/api/warehouses';
        const method = isEdit ? 'PUT' : 'POST';
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
            Swal.fire({ icon: 'success', title: result.message, timer: 1500, showConfirmButton: false });
            loadWarehouses();
        } else {
            Swal.fire('Lỗi', result.message, 'error');
        }
    } catch (error) {
        Swal.fire('Lỗi', 'Không thể kết nối server', 'error');
    }
}

async function deleteWarehouse(maKho) {
    const confirm = await Swal.fire({
        title: 'Xóa hệ thống kho?',
        text: `Bạn có chắc muốn xóa kho: ${maKho}? LƯU Ý: Nếu kho đang chứa sản phẩm, hệ thống sẽ tự động cập nhật trạng thái Ngừng Hoạt Động thay vì xóa.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Xác nhận xóa',
        cancelButtonText: 'Hủy',
        confirmButtonColor: '#ef4444'
    });
    if (!confirm.isConfirmed) return;

    try {
        const response = await fetch(`/api/warehouses/${maKho}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
            Swal.fire({ icon: 'success', title: result.message, timer: 1500, showConfirmButton: false });
            loadWarehouses();
        } else {
            Swal.fire('Lỗi', result.message, 'error');
        }
    } catch (error) {
        Swal.fire('Lỗi', 'Không thể kết nối server', 'error');
    }
}

// ==================== QUẢN LÝ CHỨC VỤ ====================

let editingRole = null;

async function loadRoles() {
    try {
        const search = document.getElementById('searchRoleInput')?.value || '';
        const response = await fetch(`/api/roles?search=${encodeURIComponent(search)}`);
        const result = await response.json();
        if (result.success) {
            renderRolesTable(result.data);
        }
    } catch (error) {
        console.error('Lỗi tải Chức vụ:', error);
    }
}

function renderRolesTable(roles) {
    const tbody = document.getElementById('roleTableBody');
    if (!tbody) return;
    tbody.innerHTML = roles.map(r => `
        <tr>
            <td><strong>${r.maCv}</strong></td>
            <td>${r.tenCv}</td>
            <td>${r.moTa || '—'}</td>
            <td>${r.luongCoBan ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(r.luongCoBan) : '—'}</td>
            <td>
                <button class="btn-edit" onclick='editRole(${JSON.stringify(r)})'><i class="fas fa-edit"></i></button>
                <button class="btn-delete" onclick="deleteRole('${r.maCv}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

async function openRoleModal(role = null) {
    editingRole = role;

    Swal.fire({
        title: role ? 'Cập nhật chức vụ' : 'Thêm chức vụ mới',
        html: `
            <div style="text-align:left;">
                <div style="margin-bottom:12px;">
                    <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:4px;">Mã chức vụ <span style="color:red;">*</span></label>
                    <input id="swalMaCv" class="swal2-input" style="width:100%; margin:0;" value="${role?.maCv || ''}" ${role ? 'disabled' : ''} placeholder="VD: CV1">
                </div>
                <div style="margin-bottom:12px;">
                    <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:4px;">Tên chức vụ <span style="color:red;">*</span></label>
                    <input id="swalTenCv" class="swal2-input" style="width:100%; margin:0;" value="${role?.tenCv || ''}" placeholder="VD: Quản lý">
                </div>
                <div style="margin-bottom:12px;">
                    <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:4px;">Mô tả</label>
                    <input id="swalMoTa" class="swal2-input" style="width:100%; margin:0;" value="${role?.moTa || ''}" placeholder="Mô tả chức vụ">
                </div>
                <div style="margin-bottom:12px;">
                    <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:4px;">Lương cơ bản (VND)</label>
                    <input id="swalLuongCoBan" type="number" class="swal2-input" style="width:100%; margin:0;" value="${role?.luongCoBan || ''}" placeholder="VD: 10000000">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: role ? 'Cập nhật' : 'Thêm mới',
        cancelButtonText: 'Hủy',
        confirmButtonColor: '#6366f1',
        preConfirm: () => {
            const maCv = document.getElementById('swalMaCv').value.trim();
            const tenCv = document.getElementById('swalTenCv').value.trim();
            if (!maCv || !tenCv) {
                Swal.showValidationMessage('Vui lòng nhập mã và tên chức vụ');
                return false;
            }
            return {
                maCv,
                tenCv,
                moTa: document.getElementById('swalMoTa').value.trim(),
                luongCoBan: document.getElementById('swalLuongCoBan').value || null
            };
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            await saveRole(result.value, !!role);
        }
    });
}

function editRole(role) {
    openRoleModal(role);
}

async function saveRole(data, isEdit) {
    try {
        const url = isEdit ? `/api/roles/${data.maCv}` : '/api/roles';
        const method = isEdit ? 'PUT' : 'POST';
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
            Swal.fire({ icon: 'success', title: result.message, timer: 1500, showConfirmButton: false });
            loadRoles();
        } else {
            Swal.fire('Lỗi', result.message, 'error');
        }
    } catch (error) {
        Swal.fire('Lỗi', 'Không thể kết nối server', 'error');
    }
}

async function deleteRole(maCv) {
    const confirm = await Swal.fire({
        title: 'Xóa chức vụ?',
        text: `Bạn có chắc muốn xóa chức vụ: ${maCv}? LƯU Ý: Không thể xóa nếu đang có nhân viên giữ chức vụ này.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Xác nhận xóa',
        cancelButtonText: 'Hủy',
        confirmButtonColor: '#ef4444'
    });
    if (!confirm.isConfirmed) return;

    try {
        const response = await fetch(`/api/roles/${maCv}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
            Swal.fire({ icon: 'success', title: result.message, timer: 1500, showConfirmButton: false });
            loadRoles();
        } else {
            Swal.fire('Lỗi', result.message, 'error');
        }
    } catch (error) {
        Swal.fire('Lỗi', 'Không thể kết nối server', 'error');
    }
}

// ==================== QUẢN LÝ NHÂN VIÊN ====================

let editingEmployee = null;

async function loadEmployees() {
    try {
        const response = await fetch('/api/employees');
        const result = await response.json();
        if (result.success) {
            renderEmployeesTable(result.data);
        }
    } catch (error) {
        console.error('Lỗi tải nhân viên:', error);
    }
}

function renderEmployeesTable(employees) {
    const tbody = document.getElementById('employeeTableBody');
    if (!tbody) return;
    tbody.innerHTML = employees.map(e => `
        <tr>
            <td><strong>${e.maNv}</strong></td>
            <td>
                <div style="font-weight: 600;">${e.hoTen}</div>
                <div style="font-size: 0.8rem; color: #64748b;">${e.email}</div>
            </td>
            <td>${e.sdt || '—'}</td>
            <td>${e.ChucVu ? e.ChucVu.tenCv : '—'}</td>
            <td>
                <span class="status-badge ${e.trangThai ? 'status-active' : 'status-inactive'}">
                    ${e.trangThai ? 'Hoạt động' : 'Đã khóa'}
                </span>
            </td>
            <td>
                <div style="display: flex; gap: 5px;">
                    <button class="btn-edit" onclick='editEmployee(${JSON.stringify(e)})' title="Sửa thông tin">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" style="background:${e.trangThai ? '#ef4444' : '#10b981'}" onclick="toggleEmployee('${e.maNv}', ${e.trangThai})" title="${e.trangThai ? 'Khóa' : 'Mở khóa'}">
                        <i class="fas ${e.trangThai ? 'fa-lock' : 'fa-unlock'}"></i>
                    </button>
                    <button class="btn-edit" onclick="resetEmpPassword('${e.maNv}')" title="Đặt lại mật khẩu">
                        <i class="fas fa-key"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function openEmployeeModal(employee = null) {
    editingEmployee = employee;
    const isEdit = !!employee;
    let nextMaNv = employee?.maNv || '';

    if (!isEdit) {
        try {
            const res = await fetch('/api/employees/next-id');
            const resData = await res.json();
            if (resData.success) {
                nextMaNv = resData.nextId;
            }
        } catch (err) {
            console.error("Lỗi lấy mã NV:", err);
            nextMaNv = 'NV' + Date.now().toString().slice(-3);
        }
    }

    // Fetch roles for dropdown
    let roles = [];
    try {
        const resRoles = await fetch('/api/roles');
        const roleData = await resRoles.json();
        if (roleData.success) roles = roleData.data;
    } catch (err) {
        console.error("Lỗi tải data dropdown:", err);
    }

    const roleOptions = roles.map(r => `<option value="${r.maCv}" ${employee?.maCv === r.maCv ? 'selected' : ''}>${r.tenCv}</option>`).join('');

    Swal.fire({
        title: isEdit ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới',
        width: 600,
        html: `
            <div style="text-align:left;">
                <div style="display:flex; gap:10px; margin-bottom:12px;">
                    <div style="flex:1;">
                        <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:4px; color: #64748b;">Mã NV <span style="color:red;">*</span></label>
                        <input id="swalMaNv" class="swal2-input" style="width:100%; margin:0; height: 38px; font-size: 0.9rem; background: #f8fafc;" value="${nextMaNv}" disabled readonly placeholder="Tự động tạo">
                    </div>
                    <div style="flex:2;">
                        <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:4px; color: #64748b;"><i class="fas fa-user" style="color:#6366f1;"></i> Họ và tên <span style="color:red;">*</span></label>
                        <input id="swalHoTen" class="swal2-input" style="width:100%; margin:0; height: 38px; font-size: 0.9rem;" value="${employee?.hoTen || ''}" placeholder="Nguyễn Văn A" autocomplete="off">
                    </div>
                </div>
                <div style="margin-bottom:12px;">
                    <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:4px; color: #64748b;"><i class="fas fa-envelope" style="color:#6366f1;"></i> Email <span style="color:red;">*</span></label>
                    <input id="swalEmail" type="email" class="swal2-input" style="width:100%; margin:0; height: 38px; font-size: 0.9rem;" value="${employee?.email || ''}" ${isEdit ? 'disabled' : ''} placeholder="nv@gmail.com" autocomplete="off">
                </div>
                ${!isEdit ? `
                <div style="margin-bottom:12px;">
                    <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:4px; color: #64748b;"><i class="fas fa-key" style="color:#6366f1;"></i> Mật khẩu <span style="color:red;">*</span></label>
                    <input id="swalMatKhau" type="password" class="swal2-input" style="width:100%; margin:0; height: 38px; font-size: 0.9rem;" placeholder="Nhập mật khẩu" autocomplete="new-password">
                </div>
                ` : ''}
                <div style="display:flex; gap:10px; margin-bottom:12px;">
                    <div style="flex:1;">
                        <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:4px; color: #64748b;"><i class="fas fa-phone" style="color:#6366f1;"></i> Số điện thoại</label>
                        <input id="swalSdt" class="swal2-input" style="width:100%; margin:0; height: 38px; font-size: 0.9rem;" value="${employee?.sdt || ''}" placeholder="09xxxx" autocomplete="off">
                    </div>
                    <div style="flex:1;">
                        <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:4px; color: #64748b;"><i class="fas fa-user-tag" style="color:#6366f1;"></i> Chức vụ</label>
                        <select id="swalMaCv" class="swal2-select" style="width:100%; margin:0; padding:4px 10px; border:1px solid #dcdcdc; border-radius:4px; font-size:0.9rem; height: 38px;">
                            <option value="">-- Chọn chức vụ --</option>
                            ${roleOptions}
                        </select>
                    </div>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: employee ? 'Cập nhật' : 'Thêm mới',
        cancelButtonText: 'Hủy',
        confirmButtonColor: '#6366f1',
        preConfirm: () => {
            const maNv = document.getElementById('swalMaNv').value.trim();
            const hoTen = document.getElementById('swalHoTen').value.trim();
            const email = document.getElementById('swalEmail')?.value.trim();
            const matKhau = document.getElementById('swalMatKhau')?.value;

            if (!maNv || !hoTen || (!employee && (!email || !matKhau))) {
                Swal.showValidationMessage('Vui lòng nhập đầy đủ các trường bắt buộc');
                return false;
            }
            return {
                maNv, hoTen, email, matKhau,
                sdt: document.getElementById('swalSdt').value.trim(),
                maCv: document.getElementById('swalMaCv').value || null
            };
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            await saveEmployee(result.value, !!employee);
        }
    });
}

function editEmployee(employee) {
    openEmployeeModal(employee);
}

async function saveEmployee(data, isEdit) {
    try {
        const url = isEdit ? `/api/employees/${data.maNv}` : '/api/employees';
        const method = isEdit ? 'PUT' : 'POST';
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
            Swal.fire({ icon: 'success', title: result.message, timer: 1500, showConfirmButton: false });
            loadEmployees();
        } else {
            Swal.fire('Lỗi', result.message, 'error');
        }
    } catch (error) {
        Swal.fire('Lỗi', 'Không thể kết nối server', 'error');
    }
}

async function toggleEmployee(maNv, currentStatus) {
    const action = currentStatus ? 'khóa' : 'mở khóa';
    const confirm = await Swal.fire({
        title: `${action.charAt(0).toUpperCase() + action.slice(1)} nhân viên?`,
        text: `Bạn có chắc muốn ${action} nhân viên: ${maNv}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Xác nhận',
        cancelButtonText: 'Hủy',
        confirmButtonColor: currentStatus ? '#ef4444' : '#10b981'
    });
    if (!confirm.isConfirmed) return;

    try {
        const response = await fetch(`/api/employees/${maNv}/toggle`, { method: 'PUT' });
        const result = await response.json();
        if (result.success) {
            Swal.fire({ icon: 'success', title: result.message, timer: 1500, showConfirmButton: false });
            loadEmployees();
        } else {
            Swal.fire('Lỗi', result.message, 'error');
        }
    } catch (error) {
        Swal.fire('Lỗi', 'Không thể kết nối server', 'error');
    }
}

// ==================== QUẢN LÝ NHẬP HÀNG (IMPORT) ====================
let importItems = [];

async function loadImportHistory() {
    try {
        const response = await fetch('/api/imports');
        const result = await response.json();
        if (result.success) {
            renderImportHistoryTable(result.data);
        }
    } catch (error) {
        console.error('Lỗi tải lịch sử nhập hàng:', error);
    }
}

function renderImportHistoryTable(receipts) {
    const tbody = document.getElementById('importHistoryTableBody');
    if (!tbody) return;
    tbody.innerHTML = receipts.map(r => {
        let totalQty = r.DongMays ? r.DongMays.reduce((sum, item) => sum + item.CtNhapMay.soLuong, 0) : 0;
        return `
            <tr>
                <td><strong>${r.maPn}</strong></td>
                <td>${new Date(r.ngayNhap).toLocaleString('vi-VN')}</td>
                <td>${totalQty}</td>
                <td style="color:#ef4444; font-weight:700;">${r.tongTien.toLocaleString()} đ</td>
                <td>
                    <div style="font-size:0.85rem; color:#64748b;">NCC: <strong>${r.NhaCungCap ? r.NhaCungCap.tenNcc : '—'}</strong></div>
                    <div style="font-size:0.8rem; color:#94a3b8;">NV: ${r.NhanVien ? r.NhanVien.hoTen : '—'}</div>
                </td>
                <td>
                    <button class="btn-edit" onclick="viewImportDetails('${r.maPn}')" title="Xem chi tiết">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

async function openImportModal() {
    importItems = [];
    renderImportItemsTable();
    document.getElementById('importModal').style.display = 'flex';

    try {
        const [resKho, resNcc] = await Promise.all([
            fetch('/api/warehouses'),
            fetch('/api/suppliers')
        ]);

        const resultKho = await resKho.json();
        if (resultKho.success) {
            const select = document.getElementById('importKhoId');
            select.innerHTML = resultKho.data.map(k => `<option value="${k.maKho}">${k.tenKho}</option>`).join('');
        }

        const resultNcc = await resNcc.json();
        if (resultNcc.success) {
            const selectNcc = document.getElementById('importNccId');
            // Keep the default option and append others
            selectNcc.innerHTML = '<option value="">-- Chọn Nhà Cung Cấp (Tùy chọn) --</option>' +
                resultNcc.data.map(n => `<option value="${n.maNcc}">${n.tenNcc}</option>`).join('');
        }
    } catch (e) {
        console.error('Lỗi tải Data', e);
    }
}

function closeImportModal() {
    document.getElementById('importModal').style.display = 'none';
}

async function addImportItemUI() {
    // Lấy DS model sản phẩm
    let products = [];
    try {
        const res = await fetch('/api/products?limit=1000');
        const result = await res.json();
        if (result.success) products = result.data;
    } catch (e) {
        console.error(e);
        return Swal.fire('Lỗi', 'Không thể tải ds sản phẩm', 'error');
    }

    const options = products.map(p => `<option value="${p.maModel}" data-price="${p.giaNhap || 0}">${p.maModel} - ${p.tenModel}</option>`).join('');

    const { value: formValues } = await Swal.fire({
        title: 'Thêm Model vào phiếu nhập',
        width: 600,
        html: `
            <div style="text-align:left;">
                <label style="font-weight:bold; margin-bottom:5px; display:block;">Chọn sản phẩm:</label>
                <select id="swalImpProductId" class="swal2-select" style="width:100%; margin:0 0 15px 0;">
                    <option value="">-- Chọn sản phẩm --</option>
                    ${options}
                </select>
                
                <label style="font-weight:bold; margin-bottom:5px; display:block;">Đơn giá nhập (1 máy):</label>
                <input id="swalImpPrice" type="number" class="swal2-input" style="width:100%; margin:0 0 15px 0;" placeholder="VD: 15000000">

                <label style="font-weight:bold; margin-bottom:5px; display:block;">Quét mã vạch Serial / IMEI:</label>
                <div style="font-size:0.85rem; color:#64748b; margin-bottom:8px;">Bấm chuột vào ô dưới và Dùng súng quét mã (Scanner). Các mã sẽ tự động xếp thành danh sách.</div>
                <textarea id="swalImpSerials" class="swal2-textarea" style="width:100%; margin:0; height: 120px;" placeholder="SERIAL123\nSERIAL124\nSERIAL125..."></textarea>
            </div>
        `,
        didOpen: () => {
            const input = document.getElementById('swalImpSerials');
            const selectEl = document.getElementById('swalImpProductId');
            const priceEl = document.getElementById('swalImpPrice');

            selectEl.addEventListener('change', (e) => {
                const selectedOption = e.target.options[e.target.selectedIndex];
                if (selectedOption && selectedOption.dataset.price && selectedOption.dataset.price !== '0') {
                    priceEl.value = selectedOption.dataset.price;
                } else {
                    priceEl.value = '';
                }
            });

            input.focus();
            // Người dùng có thể quét hoặc nhập thủ công, cắt dán hàng loạt.
            // Textarea tự động hỗ trợ Enter để xuống dòng.
        },
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Thêm vào danh sách',
        cancelButtonText: 'Hủy',
        preConfirm: () => {
            const selectEl = document.getElementById('swalImpProductId');
            const productId = selectEl.value;
            const productName = selectEl.options.length > 0 && selectEl.selectedIndex >= 0 ? selectEl.options[selectEl.selectedIndex].text : '';
            const price = document.getElementById('swalImpPrice').value;
            const serialText = document.getElementById('swalImpSerials').value;

            if (!productId || !price || !serialText.trim()) {
                Swal.showValidationMessage('Vui lòng nhập đầy đủ Giá và Serial!');
                return false;
            }

            const serials = serialText.split('\n').map(s => s.trim()).filter(s => s !== '');
            if (serials.length === 0) {
                Swal.showValidationMessage('Phải có ít nhất 1 dòng Serial');
                return false;
            }

            // Check duplicates in input
            const uniqueSerials = new Set(serials);
            if (uniqueSerials.size !== serials.length) {
                Swal.showValidationMessage('Có số Serial bị trùng lặp trong ô nhập liệu!');
                return false;
            }

            return {
                productId,
                productName,
                price: Number(price),
                quantity: serials.length,
                serials: serials
            };
        }
    });

    if (formValues) {
        importItems.push(formValues);
        renderImportItemsTable();
    }
}

function removeImportItem(index) {
    importItems.splice(index, 1);
    renderImportItemsTable();
}

function renderImportItemsTable() {
    const tbody = document.getElementById('importItemsTableBody');
    let total = 0;

    if (importItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 30px; color: #64748b;">Chưa có sản phẩm nào được chọn.</td></tr>';
        document.getElementById('importTotalAmount').textContent = '0 ₫';
        return;
    }

    tbody.innerHTML = importItems.map((item, index) => {
        const itemTotal = item.quantity * item.price;
        total += itemTotal;
        return `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px;"><strong>${item.productName}</strong></td>
                <td style="padding: 12px; text-align: center;"><strong>${item.quantity}</strong></td>
                <td style="padding: 12px; text-align: right;">${item.price.toLocaleString()} ₫</td>
                <td style="padding: 12px;"><div style="max-height: 60px; overflow-y: auto; font-family: monospace; font-size: 0.85em; background: #f8fafc; padding: 6px; border-radius: 4px;">${item.serials.join('<br>')}</div></td>
                <td style="padding: 12px; text-align: center;">
                    <button class="btn-delete" onclick="removeImportItem(${index})" style="background:none; color:#ef4444; padding:5px;"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');

    document.getElementById('importTotalAmount').textContent = total.toLocaleString() + ' ₫';
}

async function submitImport() {
    if (importItems.length === 0) {
        return Swal.fire('Cảnh báo', 'Vui lòng thêm ít nhất 1 sản phẩm vào phiếu nhập', 'warning');
    }

    const maKho = document.getElementById('importKhoId').value;
    if (!maKho) {
        return Swal.fire('Cảnh báo', 'Vui lòng chọn kho nhập', 'warning');
    }

    const confirm = await Swal.fire({
        title: 'Xác nhận tạo phiếu?',
        text: 'Dữ liệu Serial sẽ được lưu vào hệ thống và không thể sửa đổi ngay lập tức.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981'
    });

    if (!confirm.isConfirmed) return;

    try {
        const maNcc = document.getElementById('importNccId').value;

        const response = await fetch('/api/imports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                maKho: maKho,
                maNcc: maNcc || null,
                maNv: user.id, // Lấy ID nhân viên đang đăng nhập
                items: importItems
            })
        });

        const result = await response.json();
        if (result.success) {
            Swal.fire('Thành công', 'Đã lưu kho an toàn', 'success');
            closeImportModal();
            loadImportHistory();
            // Nạp lại tab sản phẩm nếu đang mở
        } else {
            Swal.fire('Lỗi', result.message, 'error');
        }
    } catch (error) {
        Swal.fire('Lỗi', 'Không thể kết nối server', 'error');
    }
}
