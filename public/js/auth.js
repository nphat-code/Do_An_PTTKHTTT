const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

if (loginForm) {
    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const result = await response.json();

            if (result.success) {
                // Lưu token và thông tin user
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));

                Swal.fire({
                    icon: 'success',
                    title: 'Đăng nhập thành công',
                    showConfirmButton: false,
                    timer: 1500
                }).then(() => {
                    // Redirect dựa trên role
                    if (result.user.role === 'admin') {
                        window.location.href = '/admin/';
                    } else {
                        window.location.href = '/';
                    }
                });
            } else {
                Swal.fire('Lỗi', result.message, 'error');
            }
        } catch (error) {
            Swal.fire('Lỗi', 'Không thể kết nối đến server', 'error');
        }
    };
}

if (registerForm) {
    registerForm.onsubmit = async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const phone = document.getElementById('phone').value;
        const address = document.getElementById('address').value;

        try {
            const response = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, email, password, phone, address })
            });
            const result = await response.json();

            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Đăng ký thành công',
                    text: 'Vui lòng đăng nhập',
                }).then(() => {
                    window.location.href = 'login.html';
                });
            } else {
                Swal.fire('Lỗi', result.message, 'error');
            }
        } catch (error) {
            Swal.fire('Lỗi', 'Không thể kết nối đến server', 'error');
        }
    };
}
