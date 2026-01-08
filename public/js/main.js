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
    productModal.style.display = "block";
};
closeBtn.onclick = () => productModal.style.display = "none";
cancelBtn.onclick = () => productModal.style.display = "none";
window.onclick = (event) => {
    if (event.target == productModal) productModal.style.display = "none";
}

const sidebarLinks = document.querySelectorAll('.sidebar ul li a');
const sections = document.querySelectorAll('.tab-section');

sidebarLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        const tabName = this.getAttribute('data-tab');
        if (!tabName) return;

        e.preventDefault();
        sidebarLinks.forEach(item => item.classList.remove('active'));
        sections.forEach(section => section.style.display = 'none');
        this.classList.add('active');
        const targetSection = document.getElementById(`${tabName}-content`);
        if (targetSection) targetSection.style.display = 'block';
    });
});

let isEditMode = false;
// 1. Hàm hiển thị sản phẩm lên giao diện (Preview)
async function loadProducts() {
    try {
        const response = await fetch('http://localhost:3000/api/products');
        const result = await response.json();
        renderTable(result.data);
        updateStatistics(result.data);
    } catch (error) {
        console.error("Lỗi tải danh sách:", error);
    }
}

// 2. Hàm vẽ bảng dữ liệu
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
                <button class="btn-edit" onclick='openEditModal(${JSON.stringify(p)})'><i class="fas fa-edit"></i></button>
                <button class="btn-delete" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
            </td>
        `;
        previewContainer.appendChild(tr);
    });
}

// 3. Hàm cập nhật thống kê (Tab Tổng quan)
function updateStatistics(products) {
    if (!products || !Array.isArray(products)) {
        console.warn("Dữ liệu thống kê không hợp lệ");
        return;
    }
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => sum + (Number(p.price) * Number(p.stock)), 0);

    const totalProductsEl = document.getElementById("totalProducts");
    const totalValueEl = document.getElementById("totalValue");

    if (totalProductsEl) totalProductsEl.innerText = totalProducts; 
    if (totalValueEl) totalValueEl.innerText = totalValue.toLocaleString() + "đ";
}

// 4. Hàm Xóa sản phẩm
async function deleteProduct(id) {
    if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
        try {
            const response = await fetch(`http://localhost:3000/api/products/${id}`, { method: 'DELETE' });
            if (response.ok) loadProducts();
        } catch (error) {
            alert("Lỗi khi xóa!");
        }
    }
}

// 5. Mở modal sửa
window.openEditModal = (product) => {
    isEditMode = true;
    document.querySelector(".modal-header h2").innerText = "Chỉnh sửa sản phẩm";
    document.getElementById("productId").value = product.id;
    document.getElementById("name").value = product.name;
    document.getElementById("cpu").value = product.cpu;
    document.getElementById("ram").value = product.ram;
    document.getElementById("price").value = product.price;
    document.getElementById("stock").value = product.stock;
    productModal.style.display = "block";
};

// 6. Lưu sản phẩm (Thêm/Sửa)
productForm.onsubmit = async function(e) {
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
            alert("Thành công!");
            productModal.style.display = "none";
            loadProducts();
        } else {
            const errorData = await response.json();
            alert("Lỗi server: " + errorData.message);
        }
    } catch (error) {
        console.error("Lỗi kết nối:", error);
    }
};

// Tìm kiếm
const searchInput = document.getElementById("searchInput");
searchInput.oninput = async (e) => {
    const keyword = e.target.value;
    try {
        const response = await fetch(`http://localhost:3000/api/products?search=${keyword}`);
        const result = await response.json();
        if (result.success && result.data) {
            renderTable(result.data);
        }
        renderTable(products);
    } catch (error) {
        console.error("Lỗi tìm kiếm:", error);
    }
};

window.onload = loadProducts;
