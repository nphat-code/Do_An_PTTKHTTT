// Khởi tạo giỏ hàng từ localStorage hoặc mảng rỗng nếu chưa có
let cart = JSON.parse(localStorage.getItem('cart')) || [];
const productContainer = document.getElementById("productContainer");
const cartModal = document.getElementById("cartModal");
const checkoutForm = document.getElementById("checkoutForm");

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
        position: 'top-end',
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
window.openCart = () => cartModal.style.display = "block";
window.closeCart = () => cartModal.style.display = "none";
window.onclick = (e) => { if (e.target == cartModal) closeCart(); };

// 6. Xử lý Đặt hàng (Checkout)
checkoutForm.onsubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
        Swal.fire("Giỏ hàng trống", "Vui lòng chọn sản phẩm trước khi thanh toán", "info");
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
                text: 'Mã đơn hàng của bạn là: #' + result.orderId,
                confirmButtonText: 'Tuyệt vời'
            }).then(() => {
                cart = [];
                saveCart();
                updateCartUI();
                closeCart();
                checkoutForm.reset();
                loadProducts(); // Load lại để cập nhật stock mới
            });
        } else {
            Swal.fire("Lỗi đặt hàng", result.message, "error");
        }
    } catch (error) {
        Swal.fire("Lỗi kết nối", "Không thể gửi đơn hàng đến server", "error");
    }
};

// 7. Tìm kiếm sản phẩm
document.getElementById("searchInput").oninput = (e) => {
    loadProducts(e.target.value);
};

// Khởi tạo trang
window.onload = () => {
    loadProducts();
    updateCartUI();
};