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
                    <button class="btn-edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete"><i class="fas fa-trash"></i></button>
                </td>
            `;
            previewContainer.appendChild(tr);
        });
    } catch (error) {
        console.error("Không thể tải danh sách sản phẩm:", error);
    }
}

// 2. Xử lý khi gửi form (Submit)
productForm.onsubmit = async function(e) {
    e.preventDefault();

    const productData = {
        name: document.getElementById("name").value,
        cpu: document.getElementById("cpu").value,
        ram: document.getElementById("ram").value,
        price: document.getElementById("price").value,
        stock: document.getElementById("stock").value
    };

    try {
        const response = await fetch('http://localhost:3000/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });

        if (response.ok) {
            alert("Thêm sản phẩm thành công!");
            productForm.reset();
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