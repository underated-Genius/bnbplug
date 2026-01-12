// Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard loaded');
    
    // Check authentication
    checkAuth();
    
    // Load user data
    loadUserData();
    
    // Setup event listeners
    setupEventListeners();
    
    function checkAuth() {
        const userData = localStorage.getItem('bnbplug_user');
        if (!userData) {
            // Redirect to login if not authenticated
            showNotification('Please login first', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
            return;
        }
        
        const user = JSON.parse(userData);
        updateUserDisplay(user);
    }
    
    function updateUserDisplay(user) {
        // Update user info in sidebar
        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
            userInfo.innerHTML = `
                <img src="${user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2a9d8f&color=fff`}" 
                     class="rounded-circle mb-2" width="80" alt="User">
                <h6 class="mb-1">${user.name}</h6>
                <p class="text-muted small mb-2">${user.email}</p>
                ${user.isAdmin ? '<span class="admin-badge">Admin</span>' : ''}
            `;
        }
        
        // Update welcome message
        const welcomeMessage = document.getElementById('welcomeMessage');
        if (welcomeMessage) {
            welcomeMessage.textContent = `Welcome back, ${user.name}!`;
        }
        
        // Show admin link if user is admin
        const adminLink = document.getElementById('adminLink');
        if (adminLink && user.isAdmin) {
            adminLink.style.display = 'block';
        }
        
        // Show admin indicator
        const adminIndicator = document.getElementById('adminIndicator');
        if (adminIndicator && user.isAdmin) {
            adminIndicator.innerHTML = `
                <span class="admin-badge">
                    <i class="fas fa-user-shield me-1"></i>Administrator
                </span>
            `;
        }
    }
    
    function loadUserData() {
        // Load bookings from localStorage
        const bookings = JSON.parse(localStorage.getItem('bnbplug_bookings') || '[]');
        const userData = JSON.parse(localStorage.getItem('bnbplug_user') || '{}');
        
        // Update stats
        document.getElementById('bookingCount').textContent = bookings.length;
        
        // Calculate total spent
        const totalSpent = bookings.reduce((sum, booking) => {
            return sum + (booking.total || 0);
        }, 0);
        document.getElementById('totalSpent').textContent = `Ksh ${totalSpent.toLocaleString()}`;
        
        // Load recent activity
        loadRecentActivity(bookings);
    }
    
    function loadRecentActivity(bookings) {
        const recentActivity = document.getElementById('recentActivity');
        if (!recentActivity) return;
        
        if (bookings.length === 0) {
            recentActivity.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                    <h5>No bookings yet</h5>
                    <p class="text-muted">Your bookings will appear here</p>
                    <a href="properties.html" class="btn btn-primary">Browse Properties</a>
                </div>
            `;
            return;
        }
        
        // Show recent bookings
        const recentBookings = bookings.slice(0, 5); // Show 5 most recent
        let html = '';
        
        recentBookings.forEach(booking => {
            const date = new Date(booking.date).toLocaleDateString();
            html += `
                <div class="activity-item mb-3 p-3 border rounded">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">${booking.propertyTitle || 'Property Booking'}</h6>
                            <p class="text-muted mb-0">
                                <i class="fas fa-calendar me-1"></i>${booking.checkin} to ${booking.checkout}
                            </p>
                        </div>
                        <div class="text-end">
                            <span class="badge bg-${booking.status === 'confirmed' ? 'success' : 'warning'}">
                                ${booking.status || 'pending'}
                            </span>
                            <p class="mb-0 mt-1">Ksh ${booking.total?.toLocaleString() || '0'}</p>
                        </div>
                    </div>
                </div>
            `;
        });
        
        recentActivity.innerHTML = html;
    }
    
    function setupEventListeners() {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                handleLogout();
            });
        }
        
        // Sidebar navigation
        const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                if (this.getAttribute('href') === '#logout') {
                    e.preventDefault();
                    return;
                }
                
                // Remove active class from all links
                navLinks.forEach(l => l.classList.remove('active'));
                // Add active class to clicked link
                this.classList.add('active');
            });
        });
    }
    
    function handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            // Clear user session
            localStorage.removeItem('bnbplug_user');
            localStorage.removeItem('bnbplug_token');
            
            // Redirect to login
            showNotification('Logged out successfully', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        }
    }
    
    function showNotification(message, type = 'info') {
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
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
});
