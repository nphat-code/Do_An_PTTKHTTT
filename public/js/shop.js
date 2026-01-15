// Khởi tạo giỏ hàng từ localStorage hoặc mảng rỗng nếu chưa có
let cart = JSON.parse(localStorage.getItem('cart')) || [];
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
    // Calculate max index correctly based on how many "shifts" are possible
    // If 4 slides and we show 2, we can shift 0, 1, 2. (Showing [0,1], [1,2], [2,3]). 
    // Wait, if grid is 50%, we can shift freely.
    // Let's implement simple circular sliding.

    // Actually, simple calculation:
    // We want to show index i and i+1.
    // Max index is totalSlides - itemsPerView.

    // But if we want it to be circular and infinite-feeling, that's complex without cloning.
    // Let's stick to simple bounded sliding for now, or simple loop to beginning.

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
// 1. Tải danh sách sản phẩm từ API
// 1. Tải danh sách sản phẩm từ API
let currentPage = 1;
const itemsPerPage = 8; // Số sản phẩm mỗi trang

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
        // Gửi request kèm theo các tham số lọc
        let url = `http://localhost:3000/api/products?search=${keyword}&minPrice=${minPrice}&maxPrice=${maxPrice}&brand=${brand}&ram=${ram}&limit=${itemsPerPage}&page=${page}`;

        const response = await fetch(url);
        const result = await response.json();

        if (result.success) {
            renderProducts(result.data);
            renderPagination(result.pagination);
        }
    } catch (error) {
        console.error("Lỗi khi tải sản phẩm:", error);
    }
}

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
    loadProducts();
};

window.toggleFilters = () => {
    const filters = document.getElementById("advancedFilters");
    // Toggle giữa 'flex' và 'none' để giữ layout flex đã set trong HTML
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
        const imageUrl = p.image ? `http://localhost:3000/${p.image}` : 'https://via.placeholder.com/250x200?text=No+Image';

        card.innerHTML = `
            <img src="${imageUrl}" class="product-img" alt="${p.name}">
            <div class="product-info">
                <div class="product-name">${p.name}</div>
                <div class="product-config">CPU: ${p.cpu} | RAM: ${p.ram}GB</div>
                <div class="product-price">${Number(p.price).toLocaleString()}đ</div>
                <p style="font-size: 0.8rem; color: ${p.stock > 0 ? 'green' : 'red'}">
                    ${p.stock > 0 ? `Còn lại: ${p.stock}` : 'Hết hàng'}
                </p>
                <button class="btn-buy" onclick='addToCart(${JSON.stringify(p).replace(/'/g, "&#39;")})' 
                    ${p.stock <= 0 ? 'disabled style="background:#ccc"' : ''}>
                    ${p.stock > 0 ? 'Thêm vào giỏ hàng' : 'Tạm hết hàng'}
                </button>
            </div>
        `;
        productContainer.appendChild(card);
    });
}

// 3. Thêm sản phẩm vào giỏ hàng
function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        if (existingItem.quantity >= product.stock) {
            Swal.fire("Thông báo", "Số lượng trong kho không đủ!", "warning");
            return;
        }
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            stock: product.stock
        });
    }

    updateCartUI();
    saveCart();

    // Thông báo nhanh
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

    // Cập nhật badge số lượng
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.innerText = totalItems;

    // Hiển thị danh sách trong Modal
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
// 5. Xử lý đóng/mở Modal
window.openCart = () => {
    cartModal.style.display = "block";
};
window.closeCart = () => cartModal.style.display = "none";
window.onclick = (e) => { if (e.target == cartModal) closeCart(); };

// checkout logic moved to checkout.js

// 7. Tìm kiếm sản phẩm
// 7. Tìm kiếm sản phẩm (Đã được xử lý ở trên)

// Check authentication status
// Check authentication status
function checkAuth() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    const authContainer = document.getElementById('authLinks');

    if (user) {
        authContainer.innerHTML = `
            <span>Xin chào, <a href="/profile.html" style="color: inherit; text-decoration: underline;">${user.fullName}</a></span> | 
            <a href="#" onclick="logout()">Đăng xuất</a>
            ${user.role === 'admin' ? ' | <a href="/admin/">Admin</a>' : ''}
        `;
        verifySession(); // Verify if token is still valid
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
            // Token invalid or User locked
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

// Khởi tạo trang
window.onload = () => {
    loadProducts();
    updateCartUI();
    checkAuth();
};