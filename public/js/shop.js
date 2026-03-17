let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentCategory = "";
let _currentProducts = [];
let currentPage = 1;
const itemsPerPage = 8;
const productContainer = document.getElementById("productContainer");
const cartModal = document.getElementById("cartModal");
const checkoutForm = document.getElementById("checkoutForm");

// Banner Carousel Logic
let currentSlide = 0;
const itemsPerView = 2;

window.moveSlide = function (direction) {
    const track = document.getElementById('bannerTrack');
    if (!track) return;

    const slides = track.children;
    const totalSlides = slides.length;
    const maxIndex = totalSlides - itemsPerView;

    currentSlide += direction;

    if (currentSlide < 0) {
        currentSlide = maxIndex;
    } else if (currentSlide > maxIndex) {
        currentSlide = 0;
    }

    const translateValue = -(currentSlide * 50); // 50% width per slide
    track.style.transform = `translateX(${translateValue}%)`;
};

// Auto slide
setInterval(() => {
    moveSlide(1);
}, 5000);

// 1. Tải danh sách sản phẩm từ API
async function loadProducts(searchValue, page = 1) {
    currentPage = page;
    const keyword = searchValue !== undefined ? searchValue : document.getElementById("searchInput").value;
    const priceRange = document.getElementById("priceFilter").value;
    const brand = document.getElementById("brandFilter").value;
    const ram = document.getElementById("ramFilter").value;

    let minPrice = "";
    let maxPrice = "";

    if (priceRange) {
        [minPrice, maxPrice] = priceRange.split("-");
    }

    try {
        let url = `http://localhost:3000/api/products?search=${keyword}&minPrice=${minPrice}&maxPrice=${maxPrice}&brand=${brand}&ram=${ram}&loai=${currentCategory}&limit=${itemsPerPage}&page=${page}`;

        const response = await fetch(url);
        const result = await response.json();

        if (result.success) {
            _currentProducts = result.data;
            renderProducts(result.data);
            renderPagination(result.pagination);
        }
    } catch (error) {
        console.error("Lỗi khi tải sản phẩm:", error);
    }
}

window.filterByCategory = (category) => {
    currentCategory = category;
    document.getElementById('sectionTitle').scrollIntoView({ behavior: 'smooth' });
    const titles = {
        'GAMING': 'Laptop Gaming',
        'VANPHONG': 'Laptop Văn Phòng',
        'DOHOA': 'Laptop Đồ Họa',
        'MONG_NHE': 'Laptop Mỏng Nhẹ'
    };
    document.getElementById('sectionTitle').innerText = titles[category] || 'Tất cả sản phẩm';
    loadProducts();
};

function renderPagination(pagination) {
    const container = document.getElementById("pagination");
    if (!container) return;
    container.innerHTML = "";

    const { totalPages, currentPage } = pagination;
    if (totalPages <= 1) return;

    // Prev Button
    const prevBtn = document.createElement("button");
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.className = "btn-secondary";
    prevBtn.style.padding = "10px 15px";
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => loadProducts(undefined, currentPage - 1);
    container.appendChild(prevBtn);

    // Page Numbers
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.innerText = i;
        btn.className = i === currentPage ? "btn-primary" : "btn-secondary";
        btn.style.width = "40px";
        btn.style.height = "40px";
        btn.style.padding = "0";
        btn.style.display = "flex";
        btn.style.alignItems = "center";
        btn.style.justifyContent = "center";

        if (i !== currentPage) {
            btn.onclick = () => loadProducts(undefined, i);
        }
        container.appendChild(btn);
    }

    // Next Button
    const nextBtn = document.createElement("button");
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.className = "btn-secondary";
    nextBtn.style.padding = "10px 15px";
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => loadProducts(undefined, currentPage + 1);
    container.appendChild(nextBtn);
}

// 2. Lắng nghe sự kiện thay đổi của bộ lọc
document.getElementById("priceFilter").onchange = () => loadProducts();
document.getElementById("brandFilter").onchange = () => loadProducts();
document.getElementById("ramFilter").onchange = () => loadProducts();

// 3. Giữ nguyên sự kiện tìm kiếm
document.getElementById("searchInput").oninput = (e) => {
    loadProducts(e.target.value);
};

window.resetFilters = () => {
    document.getElementById("brandFilter").value = "";
    document.getElementById("ramFilter").value = "";
    document.getElementById("priceFilter").value = "";
    document.getElementById("searchInput").value = "";
    currentCategory = "";
    document.getElementById('sectionTitle').innerText = 'Sản phẩm mới về';
    document.getElementById('sectionTitle').scrollIntoView({ behavior: 'smooth' });
    loadProducts();
};

window.toggleFilters = () => {
    const filters = document.getElementById("advancedFilters");
    if (filters.style.display === "none") {
        filters.style.display = "flex";
    } else {
        filters.style.display = "none";
    }
};

// 2. Hiển thị sản phẩm lên giao diện dạng Card
function renderProducts(products) {
    productContainer.innerHTML = "";
    if (products.length === 0) {
        productContainer.innerHTML = "<p>Không tìm thấy sản phẩm nào phù hợp.</p>";
        return;
    }

    products.forEach(p => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.style.cursor = "pointer";
        const cauHinh = p.CauHinh || {};
        const hang = p.HangSanXuat ? p.HangSanXuat.tenHang : '';
        const configParts = [cauHinh.cpu, cauHinh.ram, cauHinh.oCung].filter(Boolean);
        const configText = configParts.length > 0 ? configParts.join(' | ') : 'Chưa cập nhật cấu hình';
        const stock = p.soLuongTon || 0;
        const imageHtml = p.hinhAnh
            ? `<img src="/${p.hinhAnh}" class="product-img" alt="${p.tenModel}" style="width:100%; height:200px; object-fit:cover;">`
            : `<div class="product-img" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display:flex; align-items:center; justify-content:center; color:white; font-size:2.5rem; height:200px;">
                <i class="fas fa-laptop"></i>
            </div>`;

        card.innerHTML = `
            ${imageHtml}
            <div class="product-info">
                ${hang ? `<div style="font-size:0.75rem; color:#6366f1; font-weight:600; margin-bottom:4px;">${hang}</div>` : ''}
                <div class="product-name">${p.tenModel}</div>
                <div class="product-config">${configText}</div>
                <div class="product-price">${Number(p.giaBan || 0).toLocaleString()}đ</div>
                <p style="font-size: 0.8rem; color: ${stock > 0 ? 'green' : 'red'}">
                    ${stock > 0 ? `Còn lại: ${stock}` : 'Hết hàng'}
                </p>
                <button class="btn-buy" onclick="event.stopPropagation(); addToCart('${p.maModel}')" 
                    ${stock <= 0 ? 'disabled style="background:#ccc"' : ''}>
                    ${stock > 0 ? 'Thêm vào giỏ hàng' : 'Tạm hết hàng'}
                </button>
            </div>
        `;

        card.onclick = () => {
            window.location.href = `/product-detail.html?id=${encodeURIComponent(p.maModel)}`;
        };

        productContainer.appendChild(card);
    });
}

// 3. Thêm sản phẩm vào giỏ hàng
function addToCart(maModel) {
    const product = _currentProducts.find(p => p.maModel === maModel);
    if (!product) return;

    const stock = product.soLuongTon || 0;
    const existingItem = cart.find(item => item.id === maModel);

    if (existingItem) {
        if (existingItem.quantity >= stock) {
            Swal.fire("Thông báo", "Số lượng trong kho không đủ!", "warning");
            return;
        }
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: maModel,
            name: product.tenModel,
            price: Number(product.giaBan || 0),
            quantity: 1,
            stock: stock
        });
    }

    updateCartUI();
    saveCart();

    const Toast = Swal.mixin({
        toast: true,
        position: 'bottom-end',
        showConfirmButton: false,
        timer: 1500
    });
    Toast.fire({ icon: 'success', title: 'Đã thêm vào giỏ hàng' });
}

// 4. Cập nhật giao diện giỏ hàng
function updateCartUI() {
    const cartCount = document.getElementById("cartCount");
    const cartItemsContainer = document.getElementById("cartItemsContainer");
    const cartTotal = document.getElementById("cartTotal");

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.innerText = totalItems;

    cartItemsContainer.innerHTML = "";
    let totalMoney = 0;

    cart.forEach((item, index) => {
        totalMoney += item.price * item.quantity;
        const div = document.createElement("div");
        div.className = "cart-item";
        div.innerHTML = `
            <div>
                <strong>${item.name}</strong><br>
                <small>${Number(item.price).toLocaleString()}đ x ${item.quantity}</small>
            </div>
            <div>
                <button onclick="changeQty(${index}, -1)" style="padding:2px 8px">-</button>
                <button onclick="changeQty(${index}, 1)" style="padding:2px 8px">+</button>
                <button onclick="removeFromCart(${index})" style="color:red; margin-left:10px; border:none; background:none; cursor:pointer;"><i class="fas fa-trash"></i></button>
            </div>
        `;
        cartItemsContainer.appendChild(div);
    });

    cartTotal.innerText = totalMoney.toLocaleString() + "đ";
}

function changeQty(index, delta) {
    const item = cart[index];
    if (item.quantity + delta > item.stock) {
        Swal.fire("Lỗi", "Vượt quá số lượng tồn kho!", "error");
        return;
    }
    item.quantity += delta;
    if (item.quantity <= 0) cart.splice(index, 1);
    updateCartUI();
    saveCart();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
    saveCart();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// 5. Xử lý đóng/mở Modal
window.openCart = () => {
    cartModal.style.display = "block";
};
window.closeCart = () => cartModal.style.display = "none";
window.onclick = (e) => { if (e.target == cartModal) closeCart(); };

// Check authentication status
function checkAuth() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    const authContainer = document.getElementById('authLinks');

    if (user) {
        authContainer.innerHTML = `
            <span>Xin chào, <a href="/profile.html" style="color: inherit; text-decoration: underline;">${user.fullName}</a></span> | 
            <a href="#" onclick="logout()">Đăng xuất</a>
            ${user.role === 'employee' ? ' | <a href="/admin/">Quản lý</a>' : ''}
        `;
        verifySession();
    } else {
        authContainer.innerHTML = `<a href="login.html" style="text-decoration:none; color: inherit;">Đăng nhập</a>`;
    }
}

async function verifySession() {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const result = await response.json();
            if (response.status === 403 && result.message.includes('khóa')) {
                alert(result.message);
            }
            logout();
        }
    } catch (error) {
        console.error("Session verification failed", error);
    }
}

window.logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    window.location.reload();
};

async function loadBrandFilter() {
    try {
        const res = await fetch('http://localhost:3000/api/products/brands');
        const data = await res.json();
        if (data.success) {
            const select = document.getElementById('brandFilter');
            select.innerHTML = '<option value="">Thương hiệu</option>';
            data.data.forEach(b => {
                select.innerHTML += `<option value="${b.maHang}">${b.tenHang}</option>`;
            });
        }
    } catch (e) {
        console.error('Lỗi tải hãng:', e);
    }
}

// Khởi tạo trang
window.onload = async () => {
    await loadBrandFilter();
    loadProducts();
    updateCartUI();
    checkAuth();
};

// ==================== INFO MODAL HANDLER ====================
window.handleInfoModal = (type) => {
    const modal = document.getElementById('infoModal');
    const titleEl = document.getElementById('infoModalTitle');
    const bodyEl = document.getElementById('infoModalBody');
    if (!modal || !titleEl || !bodyEl) return;

    modal.style.display = 'flex';
    bodyEl.innerHTML = '<div style="text-align:center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div>';

    const contents = {
        'warranty': {
            title: 'Chính sách bảo hành',
            html: `
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                    <i class="fas fa-shield-alt" style="font-size: 2.5rem; color: #4f46e5;"></i>
                    <h3 style="margin: 0;">Bảo hành chính hãng 12-24 tháng</h3>
                </div>
                <p>P-Tech Laptop cam kết cung cấp dịch vụ bảo hành tốt nhất cho khách hàng:</p>
                <ul>
                    <li><strong>Bảo hành phần cứng:</strong> Miễn phí thay thế linh kiện lỗi do nhà sản xuất trong suốt thời gian bảo hành.</li>
                    <li><strong>Bảo hành phần mềm:</strong> Hỗ trợ cài đặt Windows, Office và các phần mềm cơ bản trọn đời.</li>
                    <li><strong>Thời gian xử lý:</strong> Tối đa 3-5 ngày làm việc. Nếu quá thời gian trên, chúng tôi sẽ cho khách hàng mượn máy tương đương để sử dụng.</li>
                    <li><strong>Địa điểm:</strong> Tất cả các cửa hàng trong hệ thống P-Tech trên toàn quốc.</li>
                </ul>
            `
        },
        'returns': {
            title: 'Chính sách đổi trả',
            html: `
                <i class="fas fa-undo-alt" style="font-size: 2.5rem; color: #ef4444; margin-bottom: 20px;"></i>
                <p>Khách hàng có thể yên tâm mua sắm với chính sách "Đổi trả dễ dàng":</p>
                <ul>
                    <li><strong>7 ngày đầu:</strong> Lỗi là đổi mới 100% không mất phí.</li>
                    <li><strong>30 ngày đầu:</strong> Thu lại máy với phí 10% nếu khách hàng không còn nhu cầu sử dụng (máy còn nguyên vẹn).</li>
                    <li><strong>Điều kiện:</strong> Máy không bị biến dạng, vào nước, cháy nổ do sử dụng sai cách và còn đầy đủ hộp, phụ kiện đi kèm.</li>
                </ul>
            `
        },
        'guide': {
            title: 'Hướng dẫn mua hàng',
            html: `
                <div style="background: #f8fafc; padding: 20px; border-radius: 12px;">
                    <h4 style="margin-top: 0;"><i class="fas fa-shopping-cart"></i> 3 Bước mua hàng đơn giản:</h4>
                    <ol>
                        <li><strong>Chọn sản phẩm:</strong> Tìm kiếm và thêm máy vào giỏ hàng.</li>
                        <li><strong>Đặt hàng:</strong> Nhập thông tin giao hàng và chọn phương thức thanh toán.</li>
                        <li><strong>Nhận hàng:</strong> Kiểm tra máy, ký nhận và thanh toán (nếu chọn COD).</li>
                    </ol>
                    <p style="margin-bottom: 0;"><i class="fas fa-phone-alt"></i> Cần hỗ trợ gấp? Gọi ngay <strong>1900 1234</strong> (8:00 - 21:00).</p>
                </div>
            `
        },
        'contact': {
            title: 'Liên hệ với chúng tôi',
            html: `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <p><strong><i class="fas fa-map-marker-alt"></i> Địa chỉ:</strong><br>123 Nguyễn Văn Linh, Quận 7, TP. HCM</p>
                        <p><strong><i class="fas fa-phone"></i> Điện thoại:</strong><br>1900 1234 - 0909 000 999</p>
                        <p><strong><i class="fas fa-envelope"></i> Email:</strong><br>support@ptechlaptop.vn</p>
                    </div>
                    <div style="background: #eef2ff; padding: 15px; border-radius: 12px; font-size: 0.9rem;">
                        <strong>Thời gian làm việc:</strong><br>
                        Thứ 2 - Thứ 7: 08:30 - 21:00<br>
                        Chủ nhật: 09:00 - 18:00
                    </div>
                </div>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="text-align: center; font-style: italic;">Hân hạnh được phục vụ quý khách!</p>
            `
        },
        'news': {
            title: 'Tin tức công nghệ',
            html: `
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-newspaper" style="font-size: 3rem; color: #6366f1; margin-bottom: 20px;"></i>
                    <p>Hệ thống Tin tức đang được cập nhật...</p>
                    <p style="font-size: 0.9rem; color: #94a3b8;">Vui lòng theo dõi Fanpage của P-Tech để cập nhật những công nghệ mới nhất!</p>
                </div>
            `
        },
        'order-check': {
            title: 'Tra cứu đơn hàng',
            html: `
                <p>Để tra cứu trạng thái đơn hàng, vui lòng đăng nhập vào tài khoản của bạn và vào mục <strong>Lịch sử mua hàng</strong>.</p>
                <p>Nếu bạn mua hàng không cần tài khoản, vui lỏng gọi <strong>1900 1234</strong> cung cấp số điện thoại để tổng đài viên hỗ trợ.</p>
            `
        }
    };

    const content = contents[type];
    if (content) {
        titleEl.innerText = content.title;
        bodyEl.innerHTML = content.html;
    }
};
