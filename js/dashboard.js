// BnBPlug Dashboard System
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard system loaded');
    
    // Check authentication
    const user = checkAuthentication();
    if (!user) return;
    
    // Load user data
    loadUserData(user);
    
    // Load user bookings
    loadUserBookings(user);
    
    // Setup event listeners
    setupEventListeners(user);
    
    function checkAuthentication() {
        const userData = localStorage.getItem('bnbplug_user');
        const token = localStorage.getItem('bnbplug_token');
        
        if (!userData || !token) {
            showAlert('Please login to access the dashboard', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
            return null;
        }
        
        try {
            return JSON.parse(userData);
        } catch (error) {
            console.error('Error parsing user data:', error);
            localStorage.removeItem('bnbplug_user');
            localStorage.removeItem('bnbplug_token');
            window.location.href = 'login.html';
            return null;
        }
    }
    
    function loadUserData(user) {
        // Update user info
        updateElement('userName', user.name);
        updateElement('userEmail', user.email);
        updateElement('userType', user.type === 'host' ? 'Property Host' : 'Guest');
        
        // Update avatar
        const avatar = document.getElementById('userAvatar');
        if (avatar) {
            avatar.src = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2a9d8f&color=fff`;
        }
        
        // Show admin badge if admin
        if (user.isAdmin) {
            showAdminFeatures();
        }
        
        // Show host features if host
        if (user.type === 'host') {
            showHostFeatures();
        }
    }
    
    function loadUserBookings(user) {
        // Get all bookings
        const allBookings = JSON.parse(localStorage.getItem('bnbplug_bookings') || '[]');
        
        // Filter user's bookings
        const userBookings = allBookings.filter(booking => 
            booking.userId === user.id || booking.email === user.email
        );
        
        // Update booking count
        updateElement('bookingCount', userBookings.length);
        
        // Calculate total spent
        const totalSpent = userBookings.reduce((total, booking) => 
            total + (booking.total || 0), 0
        );
        updateElement('totalSpent', `Ksh ${totalSpent.toLocaleString()}`);
        
        // Display recent bookings
        displayRecentBookings(userBookings);
    }
    
    function displayRecentBookings(bookings) {
        const container = document.getElementById('recentBookings');
        if (!container) return;
        
        if (bookings.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                    <h5>No bookings yet</h5>
                    <p class="text-muted">Your bookings will appear here</p>
                    <a href="properties.html" class="btn btn-primary">Browse Properties</a>
                </div>
            `;
            return;
        }
        
        // Sort by date (newest first)
        const sortedBookings = bookings.sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        ).slice(0, 5); // Show only 5 most recent
        
        let html = '';
        
        sortedBookings.forEach(booking => {
            const date = new Date(booking.date).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
            
            html += `
                <div class="booking-item mb-3 p-3 border rounded">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">${booking.propertyName || 'Property'}</h6>
                            <p class="text-muted mb-1">
                                <i class="fas fa-calendar-alt me-1"></i>
                                ${booking.checkin} - ${booking.checkout}
                            </p>
                            <small class="text-muted">
                                <i class="fas fa-users me-1"></i>${booking.guests || 2} guests
                            </small>
                        </div>
                        <div class="text-end">
                            <span class="badge bg-${getStatusClass(booking.status)}">
                                ${booking.status || 'pending'}
                            </span>
                            <p class="mb-0 mt-1 fw-bold">Ksh ${booking.total?.toLocaleString() || '0'}</p>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    function getStatusClass(status) {
        switch(status?.toLowerCase()) {
            case 'confirmed': return 'success';
            case 'pending': return 'warning';
            case 'cancelled': return 'danger';
            default: return 'secondary';
        }
    }
    
    function showAdminFeatures() {
        // Show admin link
        const adminLink = document.getElementById('adminLink');
        if (adminLink) {
            adminLink.style.display = 'block';
        }
        
        // Show admin badge
        const adminBadge = document.getElementById('adminBadge');
        if (adminBadge) {
            adminBadge.innerHTML = `
                <span class="badge bg-danger">
                    <i class="fas fa-user-shield me-1"></i>Administrator
                </span>
            `;
        }
    }
    
    function showHostFeatures() {
        // Show host specific features
        const hostSection = document.getElementById('hostSection');
        if (hostSection) {
            hostSection.style.display = 'block';
        }
        
        // Load host properties
        loadHostProperties();
    }
    
    function loadHostProperties() {
        // In production, this would fetch from API
        const properties = JSON.parse(localStorage.getItem('bnbplug_properties') || '[]');
        
        // Filter properties by current user (as host)
        const user = JSON.parse(localStorage.getItem('bnbplug_user'));
        const hostProperties = properties.filter(prop => prop.hostId === user.id);
        
        updateElement('propertyCount', hostProperties.length);
        
        // Display host properties
        const container = document.getElementById('hostProperties');
        if (container) {
            if (hostProperties.length === 0) {
                container.innerHTML = `
                    <div class="alert alert-info">
                        <p class="mb-2">You haven't listed any properties yet.</p>
                        <a href="add-property.html" class="btn btn-sm btn-primary">Add Your First Property</a>
                    </div>
                `;
            } else {
                // Display properties list
            }
        }
    }
    
    function setupEventListeners(user) {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                handleLogout();
            });
        }
        
        // Edit profile
        const editProfileBtn = document.getElementById('editProfileBtn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', function() {
                editProfile(user);
            });
        }
        
        // Quick booking
        const quickBookBtn = document.getElementById('quickBookBtn');
        if (quickBookBtn) {
            quickBookBtn.addEventListener('click', function() {
                window.location.href = 'properties.html';
            });
        }
    }
    
    function handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            // Clear session
            localStorage.removeItem('bnbplug_user');
            localStorage.removeItem('bnbplug_token');
            
            showAlert('Logged out successfully', 'success');
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    }
    
    function editProfile(user) {
        // Simple profile edit modal
        const modalHTML = `
            <div class="modal fade" id="editProfileModal">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Edit Profile</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="profileForm">
                                <div class="mb-3">
                                    <label class="form-label">Full Name</label>
                                    <input type="text" class="form-control" value="${user.name}" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Email</label>
                                    <input type="email" class="form-control" value="${user.email}" readonly>
                                    <small class="text-muted">Email cannot be changed</small>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Phone Number</label>
                                    <input type="tel" class="form-control" value="${user.phone || ''}">
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="saveProfile()">Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to page
        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = modalHTML;
        document.body.appendChild(modalDiv);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
        modal.show();
        
        // Remove modal when hidden
        modal._element.addEventListener('hidden.bs.modal', function() {
            modalDiv.remove();
        });
    }
    
    function saveProfile() {
        // In production, this would update via API
        showAlert('Profile updated successfully', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
        modal.hide();
    }
    
    function updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }
    
    function showAlert(message, type = 'info') {
        // Create alert element
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            min-width: 300px;
        `;
        
        alertDiv.innerHTML = `
            ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'} 
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
});
