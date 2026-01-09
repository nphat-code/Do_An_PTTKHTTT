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
        saveTabState(tabName); // Lưu trạng thái
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
}

function saveTabState(tabName) {
    localStorage.setItem('activeTab', tabName);
}

let isEditMode = false;
let currentPage = 1;
const limit = 5;
async function loadProducts(page = 1) {
    currentPage = page;
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
                <button type="button" class="btn-edit" onclick='openEditModal(${JSON.stringify(p)}); return false;'>
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
                await Swal.fire('Đã xóa!', 'Sản phẩm đã được loại bỏ.', 'success');
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
    productModal.style.display = "block";
};

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
            await Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: isEditMode ? 'Đã cập nhật sản phẩm' : 'Đã thêm máy tính mới',
                timer: 1500, // Tự động đóng sau 1.5 giây
                showConfirmButton: false
            });
            productModal.style.display = "none";
            loadProducts(currentPage);
        } else {
            const errorData = await response.json();
            alert("Lỗi server: " + errorData.message);
        }
    } catch (error) {
        console.error("Lỗi kết nối:", error);
    }
};

const searchInput = document.getElementById("searchInput");
searchInput.oninput = async (e) => {
    const keyword = e.target.value;
    try {
        const response = await fetch(`http://localhost:3000/api/products?search=${keyword}`);
        const result = await response.json();
        if (result.success) {
            renderTable(result.data); // Truyền mảng data vào hàm vẽ bảng
        }
    } catch (error) {
        console.error("Lỗi tìm kiếm:", error);
    }
};

window.onload = () => {
    const savedTab = localStorage.getItem('activeTab') || 'dashboard'; // Mặc định là dashboard nếu chưa có
    showTab(savedTab);
    loadProducts(1); // Gọi hàm và truyền đúng số trang là 1
};