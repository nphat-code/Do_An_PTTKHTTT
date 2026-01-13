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
async function loadProducts() {
    const keyword = document.getElementById("searchInput").value;
    const priceRange = document.getElementById("priceFilter").value;

    let minPrice = "";
    let maxPrice = "";

    if (priceRange) {
        [minPrice, maxPrice] = priceRange.split("-");
    }

    try {
        // Gửi request kèm theo các tham số lọc
        const url = `http://localhost:3000/api/products?search=${keyword}&minPrice=${minPrice}&maxPrice=${maxPrice}&limit=100`;
        const response = await fetch(url);
        const result = await response.json();

        if (result.success) {
            renderProducts(result.data);
        }
    } catch (error) {
        console.error("Lỗi khi tải sản phẩm:", error);
    }
}

// 2. Lắng nghe sự kiện thay đổi của bộ lọc giá
document.getElementById("priceFilter").onchange = () => {
    loadProducts();
};

// 3. Giữ nguyên sự kiện tìm kiếm cũ nhưng gọi loadProducts không tham số
document.getElementById("searchInput").oninput = () => {
    loadProducts();
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
document.getElementById("searchInput").oninput = (e) => {
    loadProducts(e.target.value);
};

// Check authentication status
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    const authContainer = document.getElementById('authLinks');

    if (user) {
        authContainer.innerHTML = `
            <span>Xin chào, <a href="/profile.html" style="color: inherit; text-decoration: underline;">${user.fullName}</a></span> | 
            <a href="#" onclick="logout()">Đăng xuất</a>
            ${user.role === 'admin' ? ' | <a href="/admin/">Admin</a>' : ''}
        `;
    } else {
        authContainer.innerHTML = `<a href="login.html" style="text-decoration:none; color: inherit;">Đăng nhập</a>`;
    }
}

window.logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
};

// Khởi tạo trang
window.onload = () => {
    loadProducts();
    updateCartUI();
    checkAuth();
};