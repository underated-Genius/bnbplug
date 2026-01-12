// BnBPlug Authentication System
document.addEventListener('DOMContentLoaded', function() {
    console.log('Authentication system loaded');
    
    // Elements
    const loginTabBtn = document.getElementById('loginTabBtn');
    const registerTabBtn = document.getElementById('registerTabBtn');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginFormData = document.getElementById('loginFormData');
    const registerFormData = document.getElementById('registerFormData');
    const userTypeBtns = document.querySelectorAll('.user-type-btn');
    const userTypeInput = document.getElementById('userType');
    const showAdminLogin = document.getElementById('showAdminLogin');
    const adminLoginSection = document.getElementById('adminLoginSection');
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const showLoginPassword = document.getElementById('showLoginPassword');
    const registerPassword = document.getElementById('registerPassword');
    const passwordStrengthText = document.getElementById('passwordStrengthText');
    const authMessage = document.getElementById('authMessage');
    
    // Initialize
    initAuth();
    
    function initAuth() {
        // Check if user is already logged in
        const user = localStorage.getItem('bnbplug_user');
        if (user) {
            const userData = JSON.parse(user);
            if (window.location.pathname.includes('login.html')) {
                window.location.href = userData.isAdmin ? 'admin.html' : 'dashboard.html';
            }
        }
        
        // Tab switching
        if (loginTabBtn) {
            loginTabBtn.addEventListener('click', function() {
                switchTab('login');
            });
        }
        
        if (registerTabBtn) {
            registerTabBtn.addEventListener('click', function() {
                switchTab('register');
            });
        }
        
        // User type selection
        userTypeBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                userTypeBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                userTypeInput.value = this.dataset.type;
            });
        });
        
        // Login form submission
        if (loginFormData) {
            loginFormData.addEventListener('submit', handleLogin);
        }
        
        // Register form submission
        if (registerFormData) {
            registerFormData.addEventListener('submit', handleRegister);
        }
        
        // Show password toggle
        if (showLoginPassword) {
            showLoginPassword.addEventListener('change', function() {
                const passwordInput = document.getElementById('loginPassword');
                passwordInput.type = this.checked ? 'text' : 'password';
            });
        }
        
        // Show admin login section
        if (showAdminLogin) {
            showAdminLogin.addEventListener('click', function(e) {
                e.preventDefault();
                adminLoginSection.classList.toggle('hidden');
            });
        }
        
        // Admin login button
        if (adminLoginBtn) {
            adminLoginBtn.addEventListener('click', handleAdminLogin);
        }
        
        // Password strength checker
        if (registerPassword) {
            registerPassword.addEventListener('input', checkPasswordStrength);
        }
        
        // Check URL parameters for registration
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('action') === 'register') {
            switchTab('register');
        }
    }
    
    function switchTab(tabName) {
        // Update tabs
        loginTabBtn.classList.toggle('active', tabName === 'login');
        registerTabBtn.classList.toggle('active', tabName === 'register');
        
        // Show/hide forms
        loginForm.classList.toggle('hidden', tabName !== 'login');
        registerForm.classList.toggle('hidden', tabName !== 'register');
        
        // Clear messages
        clearMessage();
    }
    
    function handleLogin(e) {
        e.preventDefault();
        clearMessage();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        // Validation
        if (!email || !password) {
            showMessage('Please fill in all fields', 'error');
            return;
        }
        
        if (!validateEmail(email)) {
            showMessage('Please enter a valid email address', 'error');
            return;
        }
        
        // Get all users
        const users = JSON.parse(localStorage.getItem('bnbplug_users') || '[]');
        
        // Find user
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            showMessage('Invalid email or password', 'error');
            return;
        }
        
        // Create session
        const userSession = {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            phone: user.phone,
            type: user.type,
            isAdmin: user.isAdmin || false,
            avatar: user.avatar,
            joined: user.joined
        };
        
        localStorage.setItem('bnbplug_user', JSON.stringify(userSession));
        localStorage.setItem('bnbplug_token', 'token_' + Date.now());
        
        showMessage('Login successful! Redirecting...', 'success');
        
        // Redirect based on user type
        setTimeout(() => {
            if (userSession.isAdmin) {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        }, 1500);
    }
    
    function handleRegister(e) {
        e.preventDefault();
        clearMessage();
        
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const email = document.getElementById('registerEmail').value;
        const phone = document.getElementById('phone').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const userType = userTypeInput.value;
        const terms = document.getElementById('terms').checked;
        
        // Validation
        if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
            showMessage('Please fill in all required fields', 'error');
            return;
        }
        
        if (!terms) {
            showMessage('Please accept the terms and conditions', 'error');
            return;
        }
        
        if (!validateEmail(email)) {
            showMessage('Please enter a valid email address', 'error');
            return;
        }
        
        if (!validatePhone(phone)) {
            showMessage('Please enter a valid Kenyan phone number (07XX XXX XXX)', 'error');
            return;
        }
        
        if (password.length < 8) {
            showMessage('Password must be at least 8 characters', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showMessage('Passwords do not match', 'error');
            return;
        }
        
        // Check if email already exists
        const users = JSON.parse(localStorage.getItem('bnbplug_users') || '[]');
        if (users.find(u => u.email === email)) {
            showMessage('Email already registered. Please login instead.', 'error');
            return;
        }
        
        // Create new user
        const newUser = {
            id: 'user_' + Date.now(),
            firstName: firstName,
            lastName: lastName,
            email: email,
            phone: phone,
            password: password, // In production, this should be hashed
            type: userType,
            isAdmin: false,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName + ' ' + lastName)}&background=2a9d8f&color=fff`,
            joined: new Date().toISOString(),
            properties: userType === 'host' ? [] : null,
            bookings: userType === 'guest' ? [] : null
        };
        
        // Save user
        users.push(newUser);
        localStorage.setItem('bnbplug_users', JSON.stringify(users));
        
        // Create session
        const userSession = {
            id: newUser.id,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            name: `${newUser.firstName} ${newUser.lastName}`,
            email: newUser.email,
            phone: newUser.phone,
            type: newUser.type,
            isAdmin: false,
            avatar: newUser.avatar,
            joined: newUser.joined
        };
        
        localStorage.setItem('bnbplug_user', JSON.stringify(userSession));
        localStorage.setItem('bnbplug_token', 'token_' + Date.now());
        
        showMessage('Account created successfully! Redirecting to dashboard...', 'success');
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
    }
    
    function handleAdminLogin() {
        clearMessage();
        
        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;
        
        // Hardcoded admin credentials (In production, this would be in a database)
        // Default admin credentials: admin@bnbplug.co.ke / Admin@123
        const adminCredentials = [
            {
                email: 'admin@bnbplug.co.ke',
                password: 'Admin@123', // In production, use hashed password
                name: 'System Administrator'
            },
            {
                email: 'admin@example.com',
                password: 'Admin123',
                name: 'Demo Admin'
            }
        ];
        
        const admin = adminCredentials.find(a => a.email === email && a.password === password);
        
        if (!admin) {
            showMessage('Invalid admin credentials', 'error');
            return;
        }
        
        // Create admin session
        const adminSession = {
            id: 'admin_001',
            firstName: 'Admin',
            lastName: 'User',
            name: admin.name,
            email: admin.email,
            phone: '+254700000000',
            type: 'admin',
            isAdmin: true,
            avatar: 'https://ui-avatars.com/api/?name=Admin&background=ff6b6b&color=fff',
            joined: '2024-01-01'
        };
        
        localStorage.setItem('bnbplug_user', JSON.stringify(adminSession));
        localStorage.setItem('bnbplug_token', 'admin_token_' + Date.now());
        
        showMessage('Admin login successful! Redirecting...', 'success');
        
        // Redirect to admin panel
        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 1500);
    }
    
    function checkPasswordStrength() {
        const password = this.value;
        const strengthText = passwordStrengthText.querySelector('span');
        
        if (!password) {
            strengthText.textContent = 'Weak';
            strengthText.className = 'strength-weak';
            return;
        }
        
        let strength = 0;
        
        // Length
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        
        // Complexity
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;
        
        // Determine strength
        if (strength <= 2) {
            strengthText.textContent = 'Weak';
            strengthText.className = 'strength-weak';
        } else if (strength <= 4) {
            strengthText.textContent = 'Fair';
            strengthText.className = 'strength-fair';
        } else {
            strengthText.textContent = 'Strong';
            strengthText.className = 'strength-good';
        }
    }
    
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    function validatePhone(phone) {
        const re = /^(\+?254|0)?[71]\d{8}$/;
        return re.test(phone.replace(/\s/g, ''));
    }
    
    function showMessage(message, type = 'info') {
        clearMessage();
        
        const alertClass = type === 'error' ? 'alert-danger' : 
                          type === 'success' ? 'alert-success' : 'alert-info';
        
        authMessage.innerHTML = `
            <div class="alert ${alertClass} alert-dismissible fade show">
                ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
    }
    
    function clearMessage() {
        authMessage.innerHTML = '';
    }
    
    // Make some functions globally available
    window.authModule = {
        validateEmail,
        validatePhone,
        showMessage,
        clearMessage
    };
});
