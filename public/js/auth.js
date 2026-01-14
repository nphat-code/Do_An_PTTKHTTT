const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

if (loginForm) {
    // Tự động điền nếu vừa đăng ký thành công
    const autoFillEmail = sessionStorage.getItem('autoFillEmail');
    const autoFillPassword = sessionStorage.getItem('autoFillPassword');

    if (autoFillEmail && autoFillPassword) {
        document.getElementById('email').value = autoFillEmail;
        document.getElementById('password').value = autoFillPassword;
        // Xóa thông tin đã lưu để không tự điền lần sau
        sessionStorage.removeItem('autoFillEmail');
        sessionStorage.removeItem('autoFillPassword');
    }

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
                // Lưu token và thông tin user vào sessionStorage để tách biệt phiên làm việc giữa các tab
                sessionStorage.setItem('token', result.token);
                sessionStorage.setItem('user', JSON.stringify(result.user));

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
                    sessionStorage.setItem('autoFillEmail', email);
                    sessionStorage.setItem('autoFillPassword', password);
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

// Forgot Password
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
if (forgotPasswordForm) {
    forgotPasswordForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const btn = document.querySelector('.btn-submit');

        btn.disabled = true;
        btn.innerText = 'Đang gửi...';

        try {
            const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const result = await response.json();

            if (result.success) {
                // Demo: Show link in Alert
                Swal.fire({
                    icon: 'success',
                    title: 'Đã gửi email!',
                    html: `Vui lòng kiểm tra email của bạn để đặt lại mật khẩu.<br><br>
                           <b>(Demo Only) Link reset:</b><br>
                           <a href="${result.resetLink}">${result.resetLink}</a>`,
                });
            } else {
                Swal.fire('Lỗi', result.message, 'error');
            }
        } catch (error) {
            Swal.fire('Lỗi', 'Không thể kết nối đến server', 'error');
        } finally {
            btn.disabled = false;
            btn.innerText = 'Gửi yêu cầu';
        }
    };
}

// Reset Password
const resetPasswordForm = document.getElementById('resetPasswordForm');
if (resetPasswordForm) {
    resetPasswordForm.onsubmit = async (e) => {
        e.preventDefault();

        // Get token from URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (!token) {
            Swal.fire('Lỗi', 'Link không hợp lệ hoặc thiếu token', 'error');
            return;
        }

        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;

        if (newPassword !== confirmNewPassword) {
            Swal.fire('Lỗi', 'Mật khẩu xác nhận không khớp', 'error');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword })
            });
            const result = await response.json();

            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Thành công!',
                    text: 'Mật khẩu đã được đặt lại. Vui lòng đăng nhập.',
                    timer: 2000,
                    showConfirmButton: false
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
