// Check Auth - Sử dụng sessionStorage để tách biệt phiên
const token = sessionStorage.getItem('token');
const user = JSON.parse(sessionStorage.getItem('user'));

if (!token || !user || user.role !== 'admin') {
    alert("Bạn cần đăng nhập quyền Admin!");
    window.location.href = '/login.html';
}

const productModal = document.getElementById("productModal");
const btnAdd = document.querySelector(".btn-add");
const closeBtn = document.querySelector(".close-btn");
const cancelBtn = document.getElementById("cancelBtn");
const productForm = document.getElementById("productForm");
const previewContainer = document.getElementById("previewContainer");

btnAdd.onclick = () => {
    isEditMode = false;
    productForm.reset();
    document.getElementById("productId").value = "";
    document.querySelector(".modal-header h2").innerText = "Thêm Laptop Mới";
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
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>#${p.id}</td>
            <td>
                <img src="${p.image ? 'http://localhost:3000/' + p.image : 'https://via.placeholder.com/50'}" 
                    alt="laptop" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
            </td>
            <td><strong>${p.name}</strong></td>
            <td>${p.cpu} / ${p.ram}GB</td>
            <td>${Number(p.price).toLocaleString()}đ</td>
            <td>${p.stock}</td>
            <td>
                <button type="button" class="btn-edit" onclick='openEditModal(${JSON.stringify(p).replace(/'/g, "&#39;")}); return false;'>
                    <i class="fas fa-edit"></i>
                </button>
                <button type="button" class="btn-delete" onclick="deleteProduct(event, ${p.id}); return false;">
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

window.openEditModal = (product) => {
    isEditMode = true;
    document.querySelector(".modal-header h2").innerText = "Chỉnh sửa sản phẩm";
    document.getElementById("productId").value = product.id;
    document.getElementById("name").value = product.name;
    document.getElementById("cpu").value = product.cpu;
    document.getElementById("ram").value = product.ram;
    document.getElementById("price").value = product.price;
    document.getElementById("stock").value = product.stock;
    productModal.style.display = "flex";
};

productForm.onsubmit = async function (e) {
    e.preventDefault();
    const id = document.getElementById("productId").value;
    const formData = new FormData();
    formData.append("name", document.getElementById("name").value);
    formData.append("cpu", document.getElementById("cpu").value);
    formData.append("ram", document.getElementById("ram").value);
    formData.append("price", document.getElementById("price").value);
    formData.append("stock", document.getElementById("stock").value);

    const imageFile = document.getElementById("productImage").files[0];
    if (imageFile) {
        formData.append("image", imageFile);
    }

    const url = isEditMode ? `http://localhost:3000/api/products/${id}` : 'http://localhost:3000/api/products';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            body: formData
        });

        if (response.ok) {
            productModal.style.display = "none";
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
        const response = await fetch('http://localhost:3000/api/orders');
        const result = await response.json();
        if (result.success) {
            renderOrdersTable(result.data);
        }
    } catch (error) {
        console.error("Lỗi khi tải đơn hàng:", error);
    }
}

// 2. Hàm vẽ bảng đơn hàng
function renderOrdersTable(orders) {
    const container = document.getElementById("orderTableBody");
    if (!container) return;
    container.innerHTML = "";

    orders.forEach(order => {
        const date = new Date(order.createdAt).toLocaleString('vi-VN');
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>#${order.id}</td>
            <td>${order.user ? order.user.fullName : 'N/A'}</td>
            <td>${order.user ? order.user.phone : 'N/A'}</td>
            <td>${date}</td>
            <td><strong style="color: #2563eb;">${Number(order.totalAmount).toLocaleString()}đ</strong></td>
            <td>
                <span class="status-badge ${order.status}">
                    ${order.status === 'pending' ? 'Chờ xử lý' : (order.status === 'cancelled' ? 'Đã hủy' : 'Đã hoàn thành')}
                </span>
            </td>
            <td>
                <button class="btn-edit" onclick="viewOrderDetails(${order.id})">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        container.appendChild(tr);
    });
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
    const revenueCtx = document.getElementById('revenueChart').getContext('2d');
    const statusCtx = document.getElementById('statusChart').getContext('2d');

    // 1. Biểu đồ doanh thu
    const labels = Object.keys(data.revenueByMonth).reverse(); // Đảo ngược để hiện từ cũ đến mới
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

    // 2. Biểu đồ trạng thái
    if (statusChartInstance) statusChartInstance.destroy();

    const statusLabels = data.statusStats.map(s => {
        if (s.status === 'pending') return 'Chờ xử lý';
        if (s.status === 'completed') return 'Hoàn thành';
        if (s.status === 'cancelled') return 'Đã hủy';
        return s.status;
    });
    const statusValues = data.statusStats.map(s => s.count);

    // Map colors based on status
    const statusColors = data.statusStats.map(s => {
        if (s.status === 'pending') return '#f59e0b'; // Cam - Chờ xử lý
        if (s.status === 'completed') return '#10b981'; // Xanh lá - Hoàn thành
        if (s.status === 'cancelled') return '#ef4444'; // Đỏ - Đã hủy
        return '#9ca3af'; // Mặc định
    });

    statusChartInstance = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
            labels: statusLabels,
            datasets: [{
                data: statusValues,
                backgroundColor: statusColors,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true
        }
    });
}

function renderTopProducts(products) {
    const container = document.getElementById('topProductsTable');
    if (!container) return;

    // Create a simple table HTML
    let html = `
        <table style="width:100%; text-align: left; border-collapse: collapse;">
            <thead>
                <tr style="border-bottom: 2px solid #eee;">
                    <th style="padding: 10px;">Tên sản phẩm</th>
                    <th style="padding: 10px; text-align: right;">Số lượng bán</th>
                </tr>
            </thead>
            <tbody>
    `;

    products.forEach(p => {
        html += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px;">${p.name}</td>
                <td style="padding: 10px; text-align: right; font-weight: bold;">${p.totalSold}</td>
            </tr>
        `;
    });

    html += '</tbody></table>';
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
            document.getElementById("updateStatusSelect").value = order.status;
            // 1. Hiển thị ID đơn hàng
            document.getElementById("displayOrderId").innerText = `#${order.id}`;

            // 2. Hiển thị thông tin khách hàng
            const date = new Date(order.createdAt).toLocaleString('vi-VN');
            document.getElementById("orderInfo").innerHTML = `
                <div>
                    <p><strong>Khách hàng:</strong> ${order.user.fullName}</p>
                    <p><strong>Số điện thoại:</strong> ${order.user.phone}</p>
                    <p><strong>Địa chỉ:</strong> ${order.user.address}</p>
                </div>
                <div>
                    <p><strong>Ngày đặt:</strong> ${date}</p>
                    <p><strong>Trạng thái:</strong> ${order.status === 'pending' ? 'Chờ xử lý' : (order.status === 'cancelled' ? 'Đã hủy' : 'Đã hoàn thành')}</p>
                    <p><strong>Email:</strong> ${order.user.email || 'N/A'}</p>
                </div>
            `;

            // 3. Hiển thị danh sách sản phẩm
            const itemsContainer = document.getElementById("orderItemsTableBody");
            itemsContainer.innerHTML = "";

            // Sequelize trả về mảng products kèm theo thông tin từ bảng trung gian (order_item)
            order.products.forEach(p => {
                const qty = p.order_item.quantity;
                const priceAtPurchase = Number(p.order_item.price);
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${p.name}</td>
                    <td>${priceAtPurchase.toLocaleString()}đ</td>
                    <td>${qty}</td>
                    <td>${(priceAtPurchase * qty).toLocaleString()}đ</td>
                `;
                itemsContainer.appendChild(tr);
            });

            // 4. Hiển thị tổng tiền
            document.getElementById("orderTotalDetail").innerText = Number(order.totalAmount).toLocaleString() + "đ";

            // Hiện modal
            orderDetailModal.style.display = "flex";
        }
    } catch (error) {
        console.error("Lỗi khi tải chi tiết đơn hàng:", error);
        Swal.fire("Lỗi", "Không thể lấy thông tin chi tiết đơn hàng", "error");
    }
}

async function confirmUpdateStatus() {
    const newStatus = document.getElementById("updateStatusSelect").value;

    const confirmText = newStatus === 'cancelled'
        ? "Đơn hàng này sẽ bị hủy và sản phẩm sẽ được cộng lại vào kho!"
        : "Xác nhận thay đổi trạng thái đơn hàng?";

    const result = await Swal.fire({
        title: 'Xác nhận?',
        text: confirmText,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Đồng ý',
        cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
        try {
            const response = await fetch(`http://localhost:3000/api/orders/${currentViewingOrder.id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await response.json();
            if (data.success) {
                Swal.fire("Thành công", data.message, "success");
                orderDetailModal.style.display = "none";
                loadOrders(); // Load lại danh sách đơn hàng ở trang Admin
                loadProducts(); // Load lại danh sách sản phẩm
            } else {
                Swal.fire("Lỗi", data.message, "error");
            }
        } catch (error) {
            Swal.fire("Lỗi", "Không thể kết nối đến server", "error");
        }
    }
}



function printInvoice() {
    if (!currentViewingOrder) return;

    const order = currentViewingOrder;
    const printWindow = window.open('', '', 'height=600,width=800');

    const date = new Date(order.createdAt).toLocaleString('vi-VN');

    let itemsHtml = '';
    order.products.forEach(p => {
        const qty = p.order_item.quantity;
        const price = Number(p.order_item.price);
        const total = qty * price;
        itemsHtml += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px;">${p.name}</td>
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
            <title>Hóa Đơn #${order.id}</title>
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
                    <strong>${order.user.fullName}</strong><br>
                    SĐT: ${order.user.phone}<br>
                    Địa chỉ: ${order.user.address || 'Tại cửa hàng'}
                </div>
                <div class="info-box" style="text-align: right;">
                    <h4>Đơn hàng</h4>
                    Đơn số: #${order.id}<br>
                    Ngày đặt: ${date}<br>
                    Trạng thái: ${order.status === 'pending' ? 'Chờ xử lý' : (order.status === 'cancelled' ? 'Đã hủy' : 'Đã hoàn thành')}
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
                Tổng cộng: ${Number(order.totalAmount).toLocaleString()}đ
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
        // Bỏ qua admin trong danh sách khách hàng nếu muốn (tùy chọn)
        if (user.role === 'admin') return;

        const date = new Date(user.createdAt).toLocaleDateString('vi-VN');
        const statusHtml = user.isLocked
            ? '<span style="color: red; font-weight: bold;">Đã khóa</span>'
            : '<span style="color: green; font-weight: bold;">Hoạt động</span>';

        const btnHtml = user.isLocked
            ? `<button class="btn-secondary" onclick="toggleUserLock(${user.id})" style="background-color: #10b981; color: white;">Mở khóa</button>`
            : `<button class="btn-delete" onclick="toggleUserLock(${user.id})">Khóa</button>`;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>#${user.id}</td>
            <td><strong>${user.fullName}</strong></td>
            <td>${user.phone}</td>
            <td>${user.email || 'N/A'}</td>
            <td>${user.address || 'N/A'}</td>
            <td>${date}</td>
            <td>${statusHtml}</td>
            <td>${btnHtml}</td>
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

// 5. Quản lý Kho Hàng (Import)
const importModal = document.getElementById("importModal");
let importItems = []; // Danh sách tạm thời các sản phẩm sẽ nhập

// Đóng modal nhập hàng
document.querySelectorAll(".close-import-btn").forEach(btn => {
    btn.onclick = () => importModal.style.display = "none";
});

async function loadImportHistory() {
    try {
        const response = await fetch('http://localhost:3000/api/imports');
        const result = await response.json();
        if (result.success) {
            renderImportHistoryTable(result.data);
        }
    } catch (error) {
        console.error("Lỗi tải lịch sử nhập hàng:", error);
    }
}

function renderImportHistoryTable(receipts) {
    const container = document.getElementById("importHistoryTableBody");
    if (!container) return;
    container.innerHTML = "";

    receipts.forEach(receipt => {
        const date = new Date(receipt.createdAt).toLocaleString('vi-VN');
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>#${receipt.id}</td>
            <td>${date}</td>
            <td>${receipt.totalBox || 0}</td>
            <td><strong style="color: #2563eb;">${Number(receipt.totalAmount || 0).toLocaleString()}đ</strong></td>
            <td>${receipt.note || ''}</td>
            <td>
                <button class="btn-edit" onclick="viewImportDetails(${receipt.id})">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        container.appendChild(tr);
    });
}

// Mở modal và tải danh sách sản phẩm để chọn
async function openImportModal() {
    importItems = [];
    renderImportItems();
    document.getElementById("importNote").value = "";
    document.getElementById("importQuantity").value = 1;
    document.getElementById("importPrice").value = 0;

    // Tải danh sách sản phẩm cho dropdown
    const select = document.getElementById("importProductSelect");
    select.innerHTML = '<option value="">Đang tải...</option>';

    try {
        // Lấy tất cả sản phẩm (có thể cần API lấy all không phân trang, hoặc dùng limit lớn)
        const response = await fetch('http://localhost:3000/api/products?limit=100');
        const result = await response.json();
        if (result.success) {
            select.innerHTML = '';
            result.data.forEach(p => {
                const option = document.createElement("option");
                option.value = p.id;
                option.text = `${p.name} (Kho: ${p.stock})`;
                // Lưu giá hiện tại vào data attribute để tham khảo nếu cần
                option.dataset.price = p.price;
                option.dataset.name = p.name;
                select.appendChild(option);
            });

            // Tự động set giá nhập gợi ý (ví dụ = 70% giá bán)
            if (result.data.length > 0) {
                select.value = result.data[0].id;
                document.getElementById("importPrice").value = result.data[0].price * 0.7;
            }

            select.onchange = function () {
                const selectedOption = select.options[select.selectedIndex];
                const currentPrice = selectedOption.dataset.price;
                document.getElementById("importPrice").value = currentPrice * 0.7;
            }
        }
    } catch (error) {
        console.error("Lỗi tải danh sách sản phẩm:", error);
    }

    importModal.style.display = "flex";
}

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
        const response = await fetch(`http://localhost:3000/api/imports/${receiptId}`);
        const result = await response.json();

        if (result.success) {
            const receipt = result.data;
            const date = new Date(receipt.createdAt).toLocaleString('vi-VN');

            // 1. Hiển thị ID và thông tin chung
            document.getElementById("displayImportId").innerText = `#${receipt.id}`;
            document.getElementById("importInfo").innerHTML = `
                <div>
                    <p><strong>Ngày nhập:</strong> ${date}</p>
                    <p><strong>Tổng số thùng/món:</strong> ${receipt.totalBox}</p>
                </div>
                <div>
                     <p><strong>Ghi chú:</strong> ${receipt.note || 'Không có'}</p>
                </div>
            `;

            // 2. Hiển thị danh sách sản phẩm
            const itemsContainer = document.getElementById("viewImportItemsTableBody");
            itemsContainer.innerHTML = "";

            receipt.products.forEach(p => {
                const qty = p.ImportReceiptItem ? p.ImportReceiptItem.quantity : 0;
                const price = p.ImportReceiptItem ? Number(p.ImportReceiptItem.price) : 0;
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${p.name}</td>
                    <td>${Number(price).toLocaleString()}đ</td>
                    <td>${qty}</td>
                    <td>${(price * qty).toLocaleString()}đ</td>
                `;
                itemsContainer.appendChild(tr);
            });

            // 3. Hiển thị tổng tiền
            document.getElementById("viewImportTotalDetail").innerText = Number(receipt.totalAmount).toLocaleString() + "đ";

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
        const response = await fetch('http://localhost:3000/api/imports', {
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
        const response = await fetch(`http://localhost:3000/api/products?limit=1000&search=${keyword}`);
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
        if (p.stock < 5) lowStockCount++;
        totalValue += p.price * p.stock;
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
        if (p.stock === 0) {
            statusHtml = '<span style="color:red; font-weight:bold;">Hết hàng</span>';
        } else if (p.stock < 5) {
            statusHtml = '<span style="color:orange; font-weight:bold;">Sắp hết</span>';
        } else {
            statusHtml = '<span style="color:green; font-weight:bold;">Còn hàng</span>';
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="http://localhost:3000/${p.image}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;" onerror="this.src='https://via.placeholder.com/40'">
                    <strong>${p.name}</strong>
                </div>
            </td>
            <td>${Number(p.price).toLocaleString()}đ</td>
            <td style="font-weight:bold; font-size:1.1rem;">${p.stock}</td>
            <td>${(p.price * p.stock).toLocaleString()}đ</td>
            <td>${statusHtml}</td>
        `;
        container.appendChild(tr);
    });
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
            window.location.href = '/login.html';
        }
    });
}
