// Lấy maModel từ URL
const urlParams = new URLSearchParams(window.location.search);
const maModel = urlParams.get('id');

if (!maModel) {
    window.location.href = '/';
}

let currentProduct = null;

// Load product detail
async function loadProductDetail() {
    try {
        const response = await fetch(`/api/products/${encodeURIComponent(maModel)}`);
        const result = await response.json();

        if (!result.success || !result.data) {
            Swal.fire('Lỗi', 'Không tìm thấy sản phẩm', 'error').then(() => {
                window.location.href = '/';
            });
            return;
        }

        currentProduct = result.data;
        renderProduct(currentProduct);

    } catch (error) {
        console.error('Lỗi:', error);
        Swal.fire('Lỗi', 'Không thể tải thông tin sản phẩm', 'error');
    }
}

function renderProduct(p) {
    const ch = p.CauHinh || {};
    const hang = p.HangSanXuat ? p.HangSanXuat.tenHang : '';
    const loai = p.LoaiMay ? p.LoaiMay.tenLoai : '';
    const stock = p.soLuongTon || 0;

    // Hide spinner, show content
    document.getElementById('loadingSpinner').style.display = 'none';
    document.getElementById('productDetailContent').style.display = 'block';

    // Breadcrumb
    document.getElementById('breadcrumbName').textContent = p.tenModel;
    document.title = p.tenModel + ' - Phát Laptop';

    // Image
    const imageSection = document.getElementById('productImageSection');
    if (p.hinhAnh) {
        imageSection.innerHTML = `<img src="/${p.hinhAnh}" alt="${p.tenModel}">`;
    } else {
        imageSection.innerHTML = `<div class="product-image-placeholder"><i class="fas fa-laptop"></i></div>`;
    }

    // Brand & Category
    document.getElementById('productBrand').innerHTML = hang ? `<i class="fas fa-building"></i> ${hang}` : '';
    document.getElementById('productCategory').innerHTML = loai ? `<i class="fas fa-tag"></i> ${loai}` : '';
    if (!hang) document.getElementById('productBrand').style.display = 'none';
    if (!loai) document.getElementById('productCategory').style.display = 'none';

    // Title & Price
    document.getElementById('productTitle').textContent = p.tenModel;

    const giaBan = Number(p.giaBan || 0);
    const giaNhap = Number(p.giaNhap || 0);
    const priceHtml = giaBan.toLocaleString() + 'đ';
    document.getElementById('productPrice').innerHTML = priceHtml;

    // Stock
    const stockEl = document.getElementById('stockBadge');
    if (stock > 0) {
        stockEl.className = 'stock-badge in-stock';
        stockEl.innerHTML = `<i class="fas fa-check-circle"></i> Còn hàng (${stock} sản phẩm)`;
    } else {
        stockEl.className = 'stock-badge out-of-stock';
        stockEl.innerHTML = `<i class="fas fa-times-circle"></i> Tạm hết hàng`;
    }

    // Description
    const configParts = [ch.cpu, ch.ram, ch.oCung, ch.vga].filter(Boolean);
    document.getElementById('productDesc').textContent = configParts.length > 0
        ? `Laptop ${hang} ${p.tenModel} với cấu hình ${configParts.join(', ')}. Phù hợp cho ${loai ? loai.toLowerCase() : 'nhiều nhu cầu sử dụng'}.`
        : '';

    // Button
    const btnCart = document.getElementById('btnAddCart');
    if (stock <= 0) {
        btnCart.disabled = true;
        btnCart.innerHTML = '<i class="fas fa-ban"></i> Tạm hết hàng';
    }

    // Specs
    renderSpecs(ch);
}

function renderSpecs(ch) {
    const specsGrid = document.getElementById('specsGrid');
    const specs = [
        { icon: 'cpu', iconClass: 'fas fa-microchip', label: 'Bộ xử lý (CPU)', value: ch.cpu },
        { icon: 'ram', iconClass: 'fas fa-memory', label: 'Bộ nhớ (RAM)', value: ch.ram },
        { icon: 'storage', iconClass: 'fas fa-hdd', label: 'Ổ cứng', value: ch.oCung },
        { icon: 'gpu', iconClass: 'fas fa-desktop', label: 'Card đồ họa (VGA)', value: ch.vga },
        { icon: 'display', iconClass: 'fas fa-tv', label: 'Màn hình', value: ch.manHinh },
        { icon: 'battery', iconClass: 'fas fa-battery-full', label: 'Pin', value: ch.pin },
        { icon: 'weight', iconClass: 'fas fa-weight-hanging', label: 'Trọng lượng', value: ch.trongLuong ? ch.trongLuong + ' kg' : null }
    ];

    specsGrid.innerHTML = specs
        .filter(s => s.value)
        .map(s => `
            <div class="spec-row">
                <div class="spec-icon ${s.icon}">
                    <i class="${s.iconClass}"></i>
                </div>
                <div>
                    <div class="spec-label">${s.label}</div>
                    <div class="spec-value">${s.value}</div>
                </div>
            </div>
        `).join('');
}

// Add to cart
function addToCartDetail() {
    if (!currentProduct) return;

    const cart = JSON.parse(sessionStorage.getItem('cart') || '[]');
    const existing = cart.find(item => item.id === currentProduct.maModel);

    if (existing) {
        if (existing.quantity >= currentProduct.soLuongTon) {
            Swal.fire('Thông báo', 'Đã đạt số lượng tối đa trong kho', 'warning');
            return;
        }
        existing.quantity += 1;
    } else {
        cart.push({
            id: currentProduct.maModel,
            name: currentProduct.tenModel,
            price: Number(currentProduct.giaBan),
            image: currentProduct.hinhAnh || null,
            quantity: 1
        });
    }

    sessionStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();

    Swal.fire({
        icon: 'success',
        title: 'Đã thêm vào giỏ hàng!',
        text: currentProduct.tenModel,
        showConfirmButton: false,
        timer: 1500,
        position: 'top-end',
        toast: true
    });
}

function updateCartCount() {
    const cart = JSON.parse(sessionStorage.getItem('cart') || '[]');
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    const el = document.getElementById('cartCount');
    if (el) el.textContent = total;
}

// Auth check
function checkAuth() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    const authLinks = document.getElementById('authLinks');
    if (user) {
        authLinks.innerHTML = `Xin chào, <a href="profile.html" style="color:#6366f1; text-decoration:underline;">${user.fullName}</a> | <a href="#" onclick="logout()" style="color:#ef4444; text-decoration:none;">Đăng xuất</a>`;
    } else {
        authLinks.innerHTML = `<a href="login.html" style="text-decoration:none; color:#6366f1; font-weight:600;">Đăng nhập</a>`;
    }
}

function logout() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    window.location.reload();
}

// Init
checkAuth();
updateCartCount();
loadProductDetail();
