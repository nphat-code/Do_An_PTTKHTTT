// Lấy các phần tử
const modal = document.getElementById("productModal");
const btnAdd = document.querySelector(".btn-add");
const closeBtn = document.querySelector(".close-btn");
const cancelBtn = document.getElementById("cancelBtn");
const productForm = document.getElementById("productForm");

// Mở modal khi nhấn nút Thêm
btnAdd.onclick = function() {
    modal.style.display = "block";
}

// Đóng modal khi nhấn (x), nút Hủy, hoặc nhấn ra ngoài modal
const closeModal = () => {
    modal.style.display = "none";
}

closeBtn.onclick = closeModal;
cancelBtn.onclick = closeModal;

window.onclick = function(event) {
    if (event.target == modal) {
        closeModal();
    }
}

productForm.onsubmit = async function(e) { // Thêm async ở đây
    e.preventDefault();

    const name = document.getElementById("name").value;
    const price = document.getElementById("price").value;

    // 1. Tạo đối tượng dữ liệu
    const newProduct = {
        name: name,
        price: price
    };

    try {
        // 2. Gửi dữ liệu lên Server qua Fetch API
        const response = await fetch('http://localhost:8080/api/products', { // Thay URL của bạn vào đây
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newProduct) // Chuyển object thành chuỗi JSON
        });

        if (response.ok) {
            alert("Đã lưu vào Database thành công!");
            closeModal();
            productForm.reset();
            // Gọi hàm render lại danh sách để thấy sản phẩm mới trong preview
            // loadProducts(); 
        } else {
            alert("Lỗi server: Không thể lưu sản phẩm.");
        }
    } catch (error) {
        console.error("Lỗi kết nối:", error);
        alert("Không thể kết nối đến Server!");
    }
}

// Gọi hàm này khi trang web vừa tải xong
document.addEventListener("DOMContentLoaded", loadLaptops);