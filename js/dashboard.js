// Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard loaded');
    
    // State
    let currentUser = null;
    
    // Initialize
    initDashboard();
    
    function initDashboard() {
        // Check authentication
        checkAuth();
        
        // Load user data
        loadUserData();
        
        // Setup event listeners
        setupEventListeners();
    }
    
    function checkAuth() {
        const userData = localStorage.getItem('bnbplug_user');
        if (!userData) {
            showMessage('Please login to access dashboard', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
            return;
        }
        
        currentUser = JSON.parse(userData);
        updateUserDisplay();
    }
    
    function updateUserDisplay() {
        if (!currentUser) return;
        
        // Update user info
        const userInfo = document.getElementById('userInfo');
        const welcomeMessage = document.getElementById('welcomeMessage');
        const userBadge = document.getElementById('userBadge');
        
        if (userInfo) {
            userInfo.innerHTML = `
                <img src="${currentUser.avatar}" 
                     class="rounded-circle mb-2" width="80" alt="User">
                <h6 class="mb-1">${currentUser.name}</h6>
                <p class="text-muted small mb-2">${currentUser.email}</p>
            `;
        }
        
        if (welcomeMessage) {
            welcomeMessage.textContent = `Welcome back, ${currentUser.firstName || currentUser.name.split(' ')[0]}!`;
        }
        
        if (userBadge) {
            let badgeClass = 'guest-badge';
            let badgeText = 'Guest';
            
            if (currentUser.isAdmin) {
                badgeClass = 'admin-badge';
                badgeText = 'Administrator';
            } else if (currentUser.type === 'host') {
                badgeClass = 'host-badge';
                badgeText = 'Host';
            }
            
            userBadge.innerHTML = `<span class="user-badge ${badgeClass}">${badgeText}</span>`;
        }
        
        // Show/hide appropriate sections
        updateUserSections();
        
        // Load user-specific data
        loadUserSpecificData();
    }
    
    function updateUserSections() {
        const guestLinks = document.getElementById('guestLinks');
        const hostLinks = document.getElementById('hostLinks');
        const adminLink = document.getElementById('adminLink');
        const bookingsTabItem = document.getElementById('bookingsTabItem');
        const propertiesTabItem = document.getElementById('propertiesTabItem');
        const quickActions = document.getElementById('quickActions');
        
        // Hide all first
        if (guestLinks) guestLinks.style.display = 'none';
        if (hostLinks) hostLinks.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
        if (bookingsTabItem) bookingsTabItem.style.display = 'none';
        if (propertiesTabItem) propertiesTabItem.style.display = 'none';
        
        // Show appropriate sections
        if (currentUser.isAdmin) {
            if (adminLink) adminLink.style.display = 'block';
            loadAdminActions(quickActions);
        } else if (currentUser.type === 'host') {
            if (hostLinks) hostLinks.style.display = 'block';
            if (propertiesTabItem) propertiesTabItem.style.display = 'block';
            loadHostActions(quickActions);
        } else {
            if (guestLinks) guestLinks.style.display = 'block';
            if (bookingsTabItem) bookingsTabItem.style.display = 'block';
            loadGuestActions(quickActions);
        }
    }
    
    function loadGuestActions(container) {
        if (!container) return;
        
        container.innerHTML = `
            <div class="col-md-4">
                <a href="properties.html" class="action-card guest-action">
                    <div class="action-icon" style="color: #4d96ff;">🏠</div>
                    <h5>Browse Properties</h5>
                    <p class="text-muted">Find your perfect stay</p>
                </a>
            </div>
            <div class="col-md-4">
                <a href="#" class="action-card guest-action" onclick="viewBookings()">
                    <div class="action-icon" style="color: #4d96ff;">📅</div>
                    <h5>My Bookings</h5>
                    <p class="text-muted">View your reservations</p>
                </a>
            </div>
            <div class="col-md-4">
                <a href="#" class="action-card guest-action" onclick="editProfile()">
                    <div class="action-icon" style="color: #4d96ff;">👤</div>
                    <h5>Edit Profile</h5>
                    <p class="text-muted">Update your information</p>
                </a>
            </div>
        `;
    }
    
    function loadHostActions(container) {
        if (!container) return;
        
        container.innerHTML = `
            <div class="col-md-4">
                <a href="#" class="action-card host-action" data-bs-toggle="modal" data-bs-target="#addPropertyModal">
                    <div class="action-icon" style="color: #ff6b6b;">🏠</div>
                    <h5>Add Property</h5>
                    <p class="text-muted">List a new property</p>
                </a>
            </div>
            <div class="col-md-4">
                <a href="#" class="action-card host-action" onclick="viewMyProperties()">
                    <div class="action-icon" style="color: #ff6b6b;">📋</div>
                    <h5>My Properties</h5>
                    <p class="text-muted">Manage your listings</p>
                </a>
            </div>
            <div class="col-md-4">
                <a href="#" class="action-card host-action" onclick="viewHostBookings()">
                    <div class="action-icon" style="color: #ff6b6b;">💰</div>
                    <h5>Earnings</h5>
                    <p class="text-muted">View your revenue</p>
                </a>
            </div>
        `;
    }
    
    function loadAdminActions(container) {
        if (!container) return;
        
        container.innerHTML = `
            <div class="col-md-4">
                <a href="admin.html" class="action-card" style="border-top: 4px solid #ff6b6b;">
                    <div class="action-icon" style="color: #ff6b6b;">⚙️</div>
                    <h5>Admin Panel</h5>
                    <p class="text-muted">Manage the platform</p>
                </a>
            </div>
            <div class="col-md-4">
                <a href="#" class="action-card" style="border-top: 4px solid #4d96ff;" onclick="viewAllUsers()">
                    <div class="action-icon" style="color: #4d96ff;">👥</div>
                    <h5>User Management</h5>
                    <p class="text-muted">Manage all users</p>
                </a>
            </div>
            <div class="col-md-4">
                <a href="#" class="action-card" style="border-top: 4px solid #2a9d8f;" onclick="viewPlatformStats()">
                    <div class="action-icon" style="color: #2a9d8f;">📊</div>
                    <h5>Platform Stats</h5>
                    <p class="text-muted">View analytics</p>
                </a>
            </div>
        `;
    }
    
    function loadUserSpecificData() {
        // Load bookings for guests
        if (currentUser.type === 'guest') {
            loadGuestBookings();
        }
        
        // Load properties for hosts
        if (currentUser.type === 'host') {
            loadHostProperties();
        }
        
        // Update stats
        updateStats();
    }
    
    function loadGuestBookings() {
        const bookings = JSON.parse(localStorage.getItem('bnbplug_bookings') || '[]');
        const userBookings = bookings.filter(b => b.userId === currentUser.id);
        const bookingsList = document.getElementById('bookingsList');
        
        if (!bookingsList) return;
        
        if (userBookings.length === 0) {
            bookingsList.innerHTML = `
                <p class="text-center text-muted">You have no bookings yet.</p>
                <div class="text-center">
                    <a href="properties.html" class="btn btn-primary">Browse Properties</a>
                </div>
            `;
            return;
        }
        
        let html = '';
        userBookings.forEach(booking => {
            html += `
                <div class="booking-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">${booking.propertyName || 'Property'}</h6>
                            <p class="text-muted mb-1">
                                <i class="fas fa-map-marker-alt"></i> ${booking.propertyLocation || 'Location'}
                            </p>
                            <small class="text-muted">
                                <i class="fas fa-calendar"></i> ${booking.checkin} - ${booking.checkout}
                            </small>
                        </div>
                        <div class="text-end">
                            <h6 class="text-primary mb-1">Ksh ${booking.total?.toLocaleString() || '0'}</h6>
                            <span class="badge bg-${booking.status === 'confirmed' ? 'success' : 'warning'}">
                                ${booking.status || 'pending'}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        bookingsList.innerHTML = html;
        
        // Update booking count
        document.getElementById('bookingCount').textContent = userBookings.length;
    }
    
    function loadHostProperties() {
        // Get properties owned by this host
        const allProperties = JSON.parse(localStorage.getItem('bnbplug_properties') || '[]');
        const hostProperties = allProperties.filter(p => p.hostId === currentUser.id);
        const propertiesList = document.getElementById('propertiesList');
        
        if (!propertiesList) return;
        
        if (hostProperties.length === 0) {
            propertiesList.innerHTML = `
                <p class="text-center text-muted">You haven't listed any properties yet.</p>
            `;
            return;
        }
        
        let html = '';
        hostProperties.forEach(property => {
            html += `
                <div class="property-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">${property.name}</h6>
                            <p class="text-muted mb-1">
                                <i class="fas fa-map-marker-alt"></i> ${property.location}, ${property.city}
                            </p>
                            <small class="text-muted">
                                <i class="fas fa-user-friends"></i> ${property.guests} guests • 
                                <i class="fas fa-bed"></i> ${property.bedrooms || 'N/A'} bedrooms
                            </small>
                        </div>
                        <div class="text-end">
                            <h6 class="text-primary mb-1">Ksh ${property.price?.toLocaleString() || '0'}/night</h6>
                            <span class="badge bg-${property.status === 'available' ? 'success' : 'warning'}">
                                ${property.status || 'pending'}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        propertiesList.innerHTML = html;
        
        // Update property count
        document.getElementById('propertyCount').textContent = hostProperties.length;
    }
    
    function updateStats() {
        // Calculate total spent for guests
        if (currentUser.type === 'guest') {
            const bookings = JSON.parse(localStorage.getItem('bnbplug_bookings') || '[]');
            const userBookings = bookings.filter(b => b.userId === currentUser.id);
            const totalSpent = userBookings.reduce((sum, booking) => sum + (booking.total || 0), 0);
            
            document.getElementById('revenueCount').textContent = `Ksh ${totalSpent.toLocaleString()}`;
        }
        
        // Calculate revenue for hosts
        if (currentUser.type === 'host') {
            const allProperties = JSON.parse(localStorage.getItem('bnbplug_properties') || '[]');
            const hostProperties = allProperties.filter(p => p.hostId === currentUser.id);
            
            // Simulate revenue (in real app, calculate from bookings)
            const revenue = hostProperties.reduce((sum, property) => {
                return sum + (property.price * (property.bookings || 0));
            }, 0);
            
            document.getElementById('revenueCount').textContent = `Ksh ${revenue.toLocaleString()}`;
        }
    }
    
    function setupEventListeners() {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
        
        // Add property button
        const addPropertyBtn = document.getElementById('addPropertyBtn');
        if (addPropertyBtn) {
            addPropertyBtn.addEventListener('click', function() {
                const modal = new bootstrap.Modal(document.getElementById('addPropertyModal'));
                modal.show();
            });
        }
        
        // Save property button
        const savePropertyBtn = document.getElementById('savePropertyBtn');
        if (savePropertyBtn) {
            savePropertyBtn.addEventListener('click', saveProperty);
        }
        
        // Tab switching
        const tabLinks = document.querySelectorAll('[data-bs-toggle="tab"]');
        tabLinks.forEach(link => {
            link.addEventListener('shown.bs.tab', function() {
                const target = this.getAttribute('data-bs-target');
                if (target === '#bookings') {
                    loadGuestBookings();
                } else if (target === '#properties') {
                    loadHostProperties();
                }
            });
        });
    }
    
    function saveProperty() {
        const name = document.getElementById('propertyName').value;
        const type = document.getElementById('propertyType').value;
        const location = document.getElementById('propertyLocation').value;
        const city = document.getElementById('propertyCity').value;
        const price = parseInt(document.getElementById('propertyPrice').value);
        const guests = parseInt(document.getElementById('propertyGuests').value);
        const description = document.getElementById('propertyDescription').value;
        const amenities = document.getElementById('propertyAmenities').value;
        
        // Validation
        if (!name || !type || !location || !city || !price || !guests) {
            showMessage('Please fill in all required fields', 'error');
            return;
        }
        
        // Create property object
        const newProperty = {
            id: 'property_' + Date.now(),
            name: name,
            type: type,
            location: location,
            city: city,
            price: price,
            guests: guests,
            description: description,
            amenities: amenities.split(',').map(a => a.trim()),
            hostId: currentUser.id,
            hostName: currentUser.name,
            status: 'available',
            createdAt: new Date().toISOString(),
            bookings: 0,
            rating: 0,
            reviews: [],
            images: ['https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80']
        };
        
        // Save to localStorage
        const allProperties = JSON.parse(localStorage.getItem('bnbplug_properties') || '[]');
        allProperties.push(newProperty);
        localStorage.setItem('bnbplug_properties', JSON.stringify(allProperties));
        
        // Close modal
        bootstrap.Modal.getInstance(document.getElementById('addPropertyModal')).hide();
        
        // Show success message
        showMessage('Property listed successfully!', 'success');
        
        // Refresh properties list
        setTimeout(() => {
            loadHostProperties();
            document.getElementById('properties-tab').click();
        }, 1000);
    }
    
    function handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('bnbplug_user');
            localStorage.removeItem('bnbplug_token');
            showMessage('Logged out successfully', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    }
    
    function showMessage(message, type = 'info') {
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            min-width: 300px;
        `;
        
        messageDiv.innerHTML = `
            ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'} 
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
    
    // Global functions for action buttons
    window.viewBookings = function() {
        document.getElementById('bookings-tab').click();
    };
    
    window.viewMyProperties = function() {
        document.getElementById('properties-tab').click();
    };
    
    window.editProfile = function() {
        alert('Profile editing would be implemented here');
    };
    
    window.viewHostBookings = function() {
        alert('Host bookings view would be implemented here');
    };
    
    window.viewAllUsers = function() {
        window.location.href = 'admin.html#users';
    };
    
    window.viewPlatformStats = function() {
        window.location.href = 'admin.html#stats';
    };
});
