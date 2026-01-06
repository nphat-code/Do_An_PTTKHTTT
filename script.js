const productModal = document.getElementById("productModal");
const btnAdd = document.querySelector(".btn-add"); // Nút "Thêm máy tính mới"
const closeBtn = document.querySelector(".close-btn");
const cancelBtn = document.getElementById("cancelBtn");
const productForm = document.getElementById("productForm");
const previewContainer = document.getElementById("previewContainer"); // Nơi hiển thị danh sách

btnAdd.onclick = () => productModal.style.display = "block";
closeBtn.onclick = () => productModal.style.display = "none";
cancelBtn.onclick = () => productModal.style.display = "none";
window.onclick = (event) => {
    if (event.target == productModal) productModal.style.display = "none";
}

let isEditMode = false;
// 1. Hàm hiển thị sản phẩm lên giao diện (Preview)
async function loadProducts() {
    try {
        const response = await fetch('http://localhost:3000/api/products');
        const products = await response.json();
        previewContainer.innerHTML = ""; 
        products.forEach(p => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>#${p.id}</td>
                <td><img src="https://picsum.photos/50" alt="laptop"></td>
                <td>${p.name}</td>
                <td>${p.cpu} / ${p.ram}GB</td>
                <td>${Number(p.price).toLocaleString()}đ</td>
                <td>${p.stock}</td>
                <td>
                    <button class="btn-edit" onclick='openEditModal(${JSON.stringify(p)})'><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
                </td>
            `;
            previewContainer.appendChild(tr);
        });
    } catch (error) {
        console.error("Không thể tải danh sách sản phẩm:", error);
    }
}

// 2. Hàm Xóa sản phẩm
async function deleteProduct(id) {
    if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
        try {
            const response = await fetch(`http://localhost:3000/api/products/${id}`, { method: 'DELETE' });
            if (response.ok) {
                loadProducts(); // Tải lại bảng
            }
        } catch (error) {
            alert("Lỗi khi xóa!");
        }
    }
}

// 3. Hàm Mở modal để Sửa
window.openEditModal = (product) => {
    isEditMode = true;
    document.querySelector(".modal-header h2").innerText = "Chỉnh sửa sản phẩm";
    
    // Đổ dữ liệu cũ vào form
    document.getElementById("productId").value = product.id;
    document.getElementById("name").value = product.name;
    document.getElementById("cpu").value = product.cpu;
    document.getElementById("ram").value = product.ram;
    document.getElementById("price").value = product.price;
    document.getElementById("stock").value = product.stock;
    
    productModal.style.display = "block";
};

// 4. Reset form khi bấm nút "Thêm mới"
btnAdd.onclick = () => {
    isEditMode = false;
    productForm.reset();
    document.querySelector(".modal-header h2").innerText = "Thêm Laptop Mới";
    productModal.style.display = "block";
};

// 5. Xử lý khi gửi form (Submit)
productForm.onsubmit = async function(e) {
    e.preventDefault();
    const id = document.getElementById("productId").value;
    const productData = {
        name: document.getElementById("name").value,
        cpu: document.getElementById("cpu").value,
        ram: document.getElementById("ram").value,
        price: document.getElementById("price").value,
        stock: document.getElementById("stock").value
    };
    const url = isEditMode ? `http://localhost:3000/api/products/${id}` : 'http://localhost:3000/api/products';
    const method = isEditMode ? 'PUT' : 'POST';
    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });

        if (response.ok) {
            alert(isEditMode ? "Cập nhật thành công!" : "Thêm thành công!");
            productModal.style.display = "none";
            loadProducts();
        } else {
            alert("Lỗi khi lưu vào database!");
        }
    } catch (error) {
        console.error("Lỗi kết nối:", error);
    }
};

// Gọi hàm tải dữ liệu ngay khi trang web vừa mở
window.onload = loadProducts;