// BnBPlug Authentication System
document.addEventListener('DOMContentLoaded', function() {
    console.log('BnBPlug Auth System loaded');
    
    // Check if user is already logged in
    checkExistingSession();
    
    // Initialize forms
    initLoginForm();
    initRegisterForm();
    
    function checkExistingSession() {
        const user = localStorage.getItem('bnbplug_user');
        const token = localStorage.getItem('bnbplug_token');
        
        if (user && token && window.location.pathname.includes('login.html')) {
            // User is already logged in, redirect to dashboard
            showAlert('You are already logged in!', 'info');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        }
    }
    
    function initLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (!loginForm) return;
        
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            
            // Validation
            if (!email || !password) {
                showAlert('Please fill in all fields', 'error');
                return;
            }
            
            if (!validateEmail(email)) {
                showAlert('Please enter a valid email address', 'error');
                return;
            }
            
            // Show loading
            showLoading('Signing in...');
            
            // Simulate API call delay
            setTimeout(() => {
                handleLogin(email, password);
                hideLoading();
            }, 1000);
        });
    }
    
    function initRegisterForm() {
        const registerForm = document.getElementById('registerForm');
        if (!registerForm) return;
        
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const firstName = document.getElementById('firstName').value.trim();
            const lastName = document.getElementById('lastName').value.trim();
            const email = document.getElementById('registerEmail').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const userType = document.querySelector('input[name="userType"]:checked')?.value;
            const terms = document.getElementById('terms').checked;
            
            // Validation
            if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
                showAlert('Please fill in all required fields', 'error');
                return;
            }
            
            if (!validateEmail(email)) {
                showAlert('Please enter a valid email address', 'error');
                return;
            }
            
            if (!validatePhone(phone)) {
                showAlert('Please enter a valid phone number (e.g., 0712 345 678)', 'error');
                return;
            }
            
            if (password.length < 8) {
                showAlert('Password must be at least 8 characters long', 'error');
                return;
            }
            
            if (password !== confirmPassword) {
                showAlert('Passwords do not match', 'error');
                return;
            }
            
            if (!terms) {
                showAlert('Please accept the Terms of Service', 'error');
                return;
            }
            
            // Check if user already exists
            if (userExists(email)) {
                showAlert('An account with this email already exists. Please login instead.', 'error');
                return;
            }
            
            // Show loading
            showLoading('Creating your account...');
            
            // Simulate API call delay
            setTimeout(() => {
                handleRegistration(firstName, lastName, email, phone, password, userType);
                hideLoading();
            }, 1500);
        });
    }
    
    function handleLogin(email, password) {
        // Get all users from localStorage
        const users = JSON.parse(localStorage.getItem('bnbplug_users') || '[]');
        
        // Special admin check (hidden from users)
        if (email === 'admin@bnbplug.co.ke' && password === 'AdminSecurePass2024!') {
            createAdminSession();
            showAlert('Welcome back, Administrator!', 'success');
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1500);
            return;
        }
        
        // Find user by email
        const user = users.find(u => u.email === email);
        
        if (!user) {
            showAlert('No account found with this email. Please register.', 'error');
            return;
        }
        
        // In production, this would compare hashed passwords
        if (user.password !== password) {
            showAlert('Incorrect password. Please try again.', 'error');
            return;
        }
        
        // Create session
        createUserSession(user);
        
        showAlert(`Welcome back, ${user.firstName}!`, 'success');
        
        // Redirect based on user type
        setTimeout(() => {
            if (user.type === 'host') {
                window.location.href = 'dashboard.html?mode=host';
            } else {
                window.location.href = 'dashboard.html';
            }
        }, 1500);
    }
    
    function handleRegistration(firstName, lastName, email, phone, password, userType) {
        // Create new user object
        const newUser = {
            id: generateUserId(),
            firstName: firstName,
            lastName: lastName,
            name: `${firstName} ${lastName}`,
            email: email,
            phone: phone,
            password: password, // In production, this would be hashed
            type: userType || 'guest',
            isAdmin: false,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName + ' ' + lastName)}&background=2a9d8f&color=fff`,
            joined: new Date().toISOString(),
            verified: false,
            bookings: []
        };
        
        // Save user to database
        saveUser(newUser);
        
        // Create session
        createUserSession(newUser);
        
        showAlert(`Welcome to BnBPlug, ${firstName}! Your account has been created.`, 'success');
        
        // Redirect
        setTimeout(() => {
            if (userType === 'host') {
                window.location.href = 'dashboard.html?mode=host';
            } else {
                window.location.href = 'dashboard.html';
            }
        }, 2000);
    }
    
    function createUserSession(user) {
        // Don't store password in session
        const sessionUser = { ...user };
        delete sessionUser.password;
        
        // Generate session token
        const token = generateToken();
        
        // Save to localStorage
        localStorage.setItem('bnbplug_user', JSON.stringify(sessionUser));
        localStorage.setItem('bnbplug_token', token);
        localStorage.setItem('bnbplug_last_login', new Date().toISOString());
    }
    
    function createAdminSession() {
        const adminUser = {
            id: 'admin_001',
            firstName: 'System',
            lastName: 'Administrator',
            name: 'System Administrator',
            email: 'admin@bnbplug.co.ke',
            phone: '+254 700 000 000',
            type: 'admin',
            isAdmin: true,
            avatar: 'https://ui-avatars.com/api/?name=Admin&background=ff6b6b&color=fff',
            joined: '2024-01-01',
            verified: true,
            permissions: ['all']
        };
        
        const token = 'admin_token_' + Date.now();
        
        localStorage.setItem('bnbplug_user', JSON.stringify(adminUser));
        localStorage.setItem('bnbplug_token', token);
        localStorage.setItem('bnbplug_last_login', new Date().toISOString());
    }
    
    function saveUser(user) {
        const users = JSON.parse(localStorage.getItem('bnbplug_users') || '[]');
        users.push(user);
        localStorage.setItem('bnbplug_users', JSON.stringify(users));
    }
    
    function userExists(email) {
        const users = JSON.parse(localStorage.getItem('bnbplug_users') || '[]');
        return users.some(user => user.email === email);
    }
    
    function generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    function generateToken() {
        return 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    function validatePhone(phone) {
        // Kenyan phone number validation
        const re = /^(\+?254|0)?[17]\d{8}$/;
        return re.test(phone.replace(/\s/g, ''));
    }
    
    function showAlert(message, type = 'info') {
        const alertBox = document.getElementById('alertBox');
        if (!alertBox) return;
        
        alertBox.textContent = message;
        alertBox.className = `alert alert-${type}`;
        alertBox.style.display = 'block';
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            alertBox.style.display = 'none';
        }, 5000);
    }
    
    function showLoading(message) {
        // Create loading overlay
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
    
    // Add some demo users if none exist
    if (!localStorage.getItem('bnbplug_users')) {
        const demoUsers = [
            {
                id: 'demo_guest_001',
                firstName: 'John',
                lastName: 'Doe',
                name: 'John Doe',
                email: 'guest@example.com',
                phone: '+254712345678',
                password: 'demo123',
                type: 'guest',
                isAdmin: false,
                avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=2a9d8f&color=fff',
                joined: '2024-01-15',
                verified: true,
                bookings: []
            },
            {
                id: 'demo_host_001',
                firstName: 'Sarah',
                lastName: 'Smith',
                name: 'Sarah Smith',
                email: 'host@example.com',
                phone: '+254723456789',
                password: 'demo123',
                type: 'host',
                isAdmin: false,
                avatar: 'https://ui-avatars.com/api/?name=Sarah+Smith&background=264653&color=fff',
                joined: '2024-02-01',
                verified: true,
                bookings: []
            }
        ];
        
        localStorage.setItem('bnbplug_users', JSON.stringify(demoUsers));
        console.log('Demo users created');
    }
});
