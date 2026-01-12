// BnBPlug Authentication System
document.addEventListener('DOMContentLoaded', function() {
    console.log('Auth system loaded');
    
    // Check if user is already logged in
    const user = localStorage.getItem('bnbplug_user');
    if (user && window.location.pathname.includes('login.html')) {
        window.location.href = 'dashboard.html';
    }
    
    // Initialize login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin();
        });
    }
    
    // Initialize register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleRegister();
        });
    }
    
    // Switch between login/register tabs
    const switchToLogin = document.getElementById('switchToLogin');
    if (switchToLogin) {
        switchToLogin.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector('#login-tab').click();
        });
    }
    
    // Forgot password
    const forgotPassword = document.getElementById('forgotPassword');
    if (forgotPassword) {
        forgotPassword.addEventListener('click', function(e) {
            e.preventDefault();
            showForgotPasswordModal();
        });
    }
    
    // Show password toggle
    const showPassword = document.getElementById('showPassword');
    if (showPassword) {
        showPassword.addEventListener('change', function() {
            const passwordInput = document.getElementById('loginPassword');
            if (passwordInput) {
                passwordInput.type = this.checked ? 'text' : 'password';
            }
        });
    }
    
    // Admin login shortcut (for testing)
    const adminLoginBtn = document.getElementById('adminLogin');
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            quickAdminLogin();
        });
    }
    
    function handleLogin() {
        const email = document.getElementById('loginEmail')?.value;
        const password = document.getElementById('loginPassword')?.value;
        
        if (!email || !password) {
            showNotification('Please fill in all fields', 'error');
            return;
        }
        
        // Simple validation
        if (!validateEmail(email)) {
            showNotification('Please enter a valid email', 'error');
            return;
        }
        
        // Show loading
        showLoading('Logging in...');
        
        // Simulate API call
        setTimeout(() => {
            // Create user object
            const user = {
                id: 'user_' + Date.now(),
                email: email,
                name: email.split('@')[0],
                type: 'guest',
                isAdmin: email === 'admin@bnbplug.co.ke',
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=2a9d8f&color=fff`,
                joined: new Date().toISOString()
            };
            
            // Save to localStorage
            localStorage.setItem('bnbplug_user', JSON.stringify(user));
            localStorage.setItem('bnbplug_token', 'token_' + Date.now());
            
            hideLoading();
            showNotification('Login successful!', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
            
        }, 1500);
    }
    
    function handleRegister() {
        const firstName = document.getElementById('firstName')?.value;
        const lastName = document.getElementById('lastName')?.value;
        const email = document.getElementById('registerEmail')?.value;
        const phone = document.getElementById('phone')?.value;
        const password = document.getElementById('registerPassword')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;
        const accountType = document.querySelector('input[name="accountType"]:checked')?.value;
        
        // Validation
        if (!firstName || !lastName || !email || !phone || !password) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showNotification('Passwords do not match', 'error');
            return;
        }
        
        if (!validateEmail(email)) {
            showNotification('Please enter a valid email', 'error');
            return;
        }
        
        if (password.length < 6) {
            showNotification('Password must be at least 6 characters', 'error');
            return;
        }
        
        showLoading('Creating account...');
        
        setTimeout(() => {
            const user = {
                id: 'user_' + Date.now(),
                firstName: firstName,
                lastName: lastName,
                name: firstName + ' ' + lastName,
                email: email,
                phone: phone,
                type: accountType || 'guest',
                isAdmin: false,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName + ' ' + lastName)}&background=2a9d8f&color=fff`,
                joined: new Date().toISOString()
            };
            
            // Save user
            localStorage.setItem('bnbplug_user', JSON.stringify(user));
            localStorage.setItem('bnbplug_token', 'token_' + Date.now());
            
            hideLoading();
            showNotification('Account created successfully!', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
            
        }, 2000);
    }
    
    function quickAdminLogin() {
        // Auto-fill admin credentials
        document.getElementById('loginEmail').value = 'admin@bnbplug.co.ke';
        document.getElementById('loginPassword').value = 'admin123';
        showNotification('Admin credentials filled. Click Login.', 'info');
    }
    
    function showForgotPasswordModal() {
        alert('Password reset feature would be implemented here. In production, this would send a reset email.');
    }
    
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            min-width: 300px;
        `;
        
        notification.innerHTML = `
            ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'} 
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
    
    function showLoading(message = 'Loading...') {
        const overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.7);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            color: white;
        `;
        
        overlay.innerHTML = `
            <div class="spinner-border text-light" style="width: 3rem; height: 3rem;">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3">${message}</p>
        `;
        
        document.body.appendChild(overlay);
    }
    
    function hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.remove();
        }
    }
});
