// Admin Panel Functionality
document.addEventListener('DOMContentLoaded', function() {
    // State
    const adminState = {
        user: null,
        properties: [],
        bookings: [],
        users: [],
        selectedProperties: new Set(),
        currentView: 'properties',
        stats: {
            totalProperties: 0,
            totalRevenue: 0,
            totalUsers: 0,
            activeBookings: 0
        }
    };
    
    // Initialize admin panel
    initAdminPanel();
    
    function initAdminPanel() {
        // Check admin authentication
        checkAdminAuth();
        
        // Load all data
        loadAdminData();
        
        // Setup event listeners
        setupAdminEventListeners();
        
        // Initialize tables
        initPropertiesTable();
        initBookingsTable();
        initUsersTable();
        
        // Update stats
        updateAdminStats();
    }
    
    function checkAdminAuth() {
        const userData = localStorage.getItem('bnbplug_user');
        if (!userData) {
            window.location.href = 'login.html';
            return;
        }
        
        adminState.user = JSON.parse(userData);
        
        // In production, check if user is admin
        if (!adminState.user.isAdmin) {
            BnBPlug.showNotification('Admin access required', 'error');
            setTimeout(() => window.location.href = 'dashboard.html', 2000);
        }
    }
    
    function loadAdminData() {
        // Load properties from XML
        BnBPlug.loadProperties().then(properties => {
            adminState.properties = properties;
            adminState.stats.totalProperties = properties.length;
            
            // Calculate revenue (simulated)
            adminState.stats.totalRevenue = properties.reduce((sum, prop) => {
                // Simulated booking count per property
                const bookings = Math.floor(Math.random() * 10);
                return sum + (prop.price * bookings);
            }, 0);
            
            updatePropertiesTable();
            updateAdminStats();
        });
        
        // Load bookings from localStorage
        const allBookings = JSON.parse(localStorage.getItem('bnbplug_bookings') || '[]');
        adminState.bookings = allBookings;
        adminState.stats.activeBookings = allBookings.filter(b => b.status === 'confirmed').length;
        
        // Load users (simulated)
        adminState.users = [
            { id: 1, name: 'John Doe', email: 'john@example.com', type: 'guest', joined: '2024-01-15', status: 'active' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com', type: 'host', joined: '2024-02-20', status: 'active' },
            { id: 3, name: 'Mike Johnson', email: 'mike@example.com', type: 'guest', joined: '2024-03-05', status: 'pending' },
            { id: 4, name: 'Sarah Williams', email: 'sarah@example.com', type: 'host', joined: '2024-01-30', status: 'active' },
            { id: 5, name: 'David Brown', email: 'david@example.com', type: 'guest', joined: '2024-02-10', status: 'suspended' }
        ];
        adminState.stats.totalUsers = adminState.users.length;
    }
    
    function setupAdminEventListeners() {
        // Admin navigation
        document.querySelectorAll('.admin-nav-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const view = this.getAttribute('href').substring(1);
                
                if (view === 'logout') {
                    handleAdminLogout();
                    return;
                }
                
                adminState.currentView = view;
                updateAdminView();
            });
        });
        
        // Bulk actions
        document.getElementById('selectAll')?.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.property-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
                const propertyId = checkbox.dataset.id;
                if (this.checked) {
                    adminState.selectedProperties.add(propertyId);
                } else {
                    adminState.selectedProperties.delete(propertyId);
                }
            });
            updateBulkActions();
        });
        
        // Add property button
        document.getElementById('saveProperty')?.addEventListener('click', handleAddProperty);
        
        // Import/export buttons
        document.querySelector('[data-bs-target="#importPropertiesModal"]')?.addEventListener('click', function() {
            // Show import modal
            showImportModal();
        });
        
        document.querySelector('[data-bs-target="#exportPropertiesModal"]')?.addEventListener('click', function() {
            // Export properties
            exportProperties();
        });
        
        // Mobile sidebar
        const mobileToggle = document.querySelector('[data-bs-target="#adminMobileSidebar"]');
        if (mobileToggle) {
            mobileToggle.addEventListener('click', function() {
                loadAdminMobileSidebar();
            });
        }
    }
    
    function initPropertiesTable() {
        const table = document.getElementById('adminPropertiesTable');
        if (!table) return;
        
        // Table will be populated by updatePropertiesTable()
    }
    
    function updatePropertiesTable() {
        const table = document.getElementById('adminPropertiesTable');
        if (!table) return;
        
        table.innerHTML = '';
        
        adminState.properties.forEach(property => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <input type="checkbox" class="form-check-input property-checkbox" data-id="${property.id}">
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${property.images?.[0] || 'https://via.placeholder.com/100x70'}" 
                             class="property-image-preview me-2" alt="${property.title}">
                        <div>
                            <h6 class="mb-0">${property.title}</h6>
                            <small class="text-muted">ID: ${property.id}</small>
                        </div>
                    </div>
                </td>
                <td>${property.location}</td>
                <td>
                    <span class="badge bg-info">${property.type}</span>
                </td>
                <td>Ksh ${property.price?.toLocaleString() || '0'}</td>
                <td>
                    <span class="badge ${property.status === 'available' ? 'bg-success' : 'bg-warning'}">
                        ${property.status || 'pending'}
                    </span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary edit-property-btn" data-id="${property.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-success view-property-btn" data-id="${property.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-danger delete-property-btn" data-id="${property.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            table.appendChild(row);
        });
        
        // Add event listeners to checkboxes
        document.querySelectorAll('.property-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const propertyId = this.dataset.id;
                if (this.checked) {
                    adminState.selectedProperties.add(propertyId);
                } else {
                    adminState.selectedProperties.delete(propertyId);
                }
                updateBulkActions();
                
                // Update select all checkbox
                const selectAll = document.getElementById('selectAll');
                if (selectAll) {
                    const allChecked = document.querySelectorAll('.property-checkbox:checked').length === 
                                      document.querySelectorAll('.property-checkbox').length;
                    selectAll.checked = allChecked;
                }
            });
        });
        
        // Add event listeners to action buttons
        addPropertyActionListeners();
    }
    
    function addPropertyActionListeners() {
        // Edit buttons
        document.querySelectorAll('.edit-property-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const propertyId = this.dataset.id;
                editProperty(propertyId);
            });
        });
        
        // View buttons
        document.querySelectorAll('.view-property-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const propertyId = this.dataset.id;
                window.location.href = `property.html?id=${propertyId}`;
            });
        });
        
        // Delete buttons
        document.querySelectorAll('.delete-property-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const propertyId = this.dataset.id;
                deleteProperty(propertyId);
            });
        });
    }
    
    function initBookingsTable() {
        const container = document.getElementById('adminBookingsTable');
        if (!container) return;
        
        // Will be populated when bookings view is active
    }
    
    function initUsersTable() {
        const container = document.getElementById('adminUsersTable');
        if (!container) return;
        
        // Will be populated when users view is active
    }
    
    function updateAdminView() {
        // Hide all views
        document.querySelectorAll('.admin-view').forEach(view => {
            view.style.display = 'none';
        });
        
        // Show current view
        const currentView = document.getElementById(adminState.currentView);
        if (currentView) {
            currentView.style.display = 'block';
        }
        
        // Update active nav link
        document.querySelectorAll('.admin-nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${adminState.currentView}`) {
                link.classList.add('active');
            }
        });
        
        // Load data for current view
        switch(adminState.currentView) {
            case 'properties':
                updatePropertiesTable();
                break;
            case 'bookings':
                updateBookingsTable();
                break;
            case 'users':
                updateUsersTable();
                break;
            case 'reports':
                loadReports();
                break;
        }
    }
    
    function updateBookingsTable() {
        const container = document.getElementById('adminBookingsTable');
        if (!container) return;
        
        if (adminState.bookings.length === 0) {
            container.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    No bookings found
                </div>
            `;
            return;
        }
        
        let html = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Booking ID</th>
                            <th>Property</th>
                            <th>Guest</th>
                            <th>Dates</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        adminState.bookings.forEach(booking => {
            const statusClass = booking.status === 'confirmed' ? 'success' : 
                               booking.status === 'pending' ? 'warning' : 'danger';
            
            html += `
                <tr>
                    <td>${booking.id}</td>
                    <td>${booking.propertyTitle || 'Property'}</td>
                    <td>${booking.personal?.firstName || 'Guest'} ${booking.personal?.lastName || ''}</td>
                    <td>${booking.checkin} to ${booking.checkout}</td>
                    <td>Ksh ${booking.total?.toLocaleString() || '0'}</td>
                    <td><span class="badge bg-${statusClass}">${booking.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary view-booking-btn" data-id="${booking.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = html;
        
        // Add event listeners
        document.querySelectorAll('.view-booking-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const bookingId = this.dataset.id;
                viewBookingDetails(bookingId);
            });
        });
    }
    
    function updateUsersTable() {
        const container = document.getElementById('adminUsersTable');
        if (!container) return;
        
        let html = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>User ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Type</th>
                            <th>Joined</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        adminState.users.forEach(user => {
            const statusClass = user.status === 'active' ? 'success' : 
                               user.status === 'pending' ? 'warning' : 'danger';
            
            html += `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td><span class="badge ${user.type === 'host' ? 'bg-info' : 'bg-secondary'}">${user.type}</span></td>
                    <td>${user.joined}</td>
                    <td><span class="badge bg-${statusClass}">${user.status}</span></td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary edit-user-btn" data-id="${user.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-${user.status === 'suspended' ? 'success' : 'warning'} toggle-user-btn" data-id="${user.id}">
                                <i class="fas fa-${user.status === 'suspended' ? 'check' : 'ban'}"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = html;
        
        // Add event listeners
        document.querySelectorAll('.edit-user-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = this.dataset.id;
                editUser(userId);
            });
        });
        
        document.querySelectorAll('.toggle-user-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = this.dataset.id;
                toggleUserStatus(userId);
            });
        });
    }
    
    function updateAdminStats() {
        // Update stat cards
        updateElement('statTotalProperties', adminState.stats.totalProperties);
        updateElement('statTotalRevenue', `Ksh ${adminState.stats.totalRevenue.toLocaleString()}`);
        updateElement('statTotalUsers', adminState.stats.totalUsers);
        updateElement('statActiveBookings', adminState.stats.activeBookings);
    }
    
    function updateBulkActions() {
        const selectedCount = adminState.selectedProperties.size;
        const bulkActions = document.querySelector('.bulk-actions');
        
        if (bulkActions) {
            if (selectedCount > 0) {
                bulkActions.style.display = 'block';
                bulkActions.querySelector('button').textContent = `Apply to ${selectedCount} selected`;
            } else {
                bulkActions.style.display = 'none';
            }
        }
    }
    
    function handleAddProperty() {
        const form = document.getElementById('addPropertyForm');
        if (!form) return;
        
        // Get form data
        const formData = new FormData(form);
        
        // Create new property object
        const newProperty = {
            id: (adminState.properties.length + 1).toString(),
            title: formData.get('title') || 'New Property',
            description: formData.get('description') || '',
            location: formData.get('location') || '',
            city: formData.get('city') || 'nairobi',
            price: parseInt(formData.get('price')) || 0,
            type: formData.get('type') || 'apartment',
            rating: 0,
            reviews: 0,
            guests: parseInt(formData.get('guests')) || 1,
            bedrooms: parseInt(formData.get('bedrooms')) || 1,
            beds: parseInt(formData.get('beds')) || 1,
            bathrooms: parseInt(formData.get('bathrooms')) || 1,
            featured: false,
            status: 'available',
            images: ['https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80'],
            amenities: ['WiFi', 'Kitchen', 'TV', 'Parking'],
            host: {
                name: adminState.user.name,
                avatar: adminState.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(adminState.user.name)}&background=2a9d8f&color=fff`,
                since: new Date().getFullYear().toString(),
                superhost: false
            }
        };
        
        // Add to properties array
        adminState.properties.push(newProperty);
        adminState.stats.totalProperties = adminState.properties.length;
        
        // Update UI
        updatePropertiesTable();
        updateAdminStats();
        
        // Show success message
        BnBPlug.showNotification('Property added successfully', 'success');
        
        // Close modal
        bootstrap.Modal.getInstance(document.getElementById('addPropertyModal')).hide();
        
        // Clear form
        form.reset();
    }
    
    function editProperty(propertyId) {
        const property = adminState.properties.find(p => p.id === propertyId);
        if (!property) return;
        
        // Create edit modal
        const modalHTML = `
            <div class="modal fade" id="editPropertyModal" tabindex="-1">
                <div class="modal-dialog modal-xl-custom modal-dialog-scrollable">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Edit Property: ${property.title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="editPropertyForm">
                                <div class="row g-3 mb-4">
                                    <div class="col-md-6">
                                        <label class="form-label">Property Title</label>
                                        <input type="text" class="form-control" value="${property.title}" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Property Type</label>
                                        <select class="form-select" required>
                                            <option value="apartment" ${property.type === 'apartment' ? 'selected' : ''}>Apartment</option>
                                            <option value="house" ${property.type === 'house' ? 'selected' : ''}>Entire House</option>
                                            <option value="villa" ${property.type === 'villa' ? 'selected' : ''}>Villa</option>
                                            <option value="cabin" ${property.type === 'cabin' ? 'selected' : ''}>Cabin</option>
                                            <option value="safari" ${property.type === 'safari' ? 'selected' : ''}>Safari Lodge</option>
                                            <option value="beach" ${property.type === 'beach' ? 'selected' : ''}>Beach House</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Location</label>
                                        <input type="text" class="form-control" value="${property.location}" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Price per Night (Ksh)</label>
                                        <input type="number" class="form-control" value="${property.price}" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Status</label>
                                        <select class="form-select">
                                            <option value="available" ${property.status === 'available' ? 'selected' : ''}>Available</option>
                                            <option value="booked" ${property.status === 'booked' ? 'selected' : ''}>Booked</option>
                                            <option value="maintenance" ${property.status === 'maintenance' ? 'selected' : ''}>Maintenance</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Featured</label>
                                        <select class="form-select">
                                            <option value="true" ${property.featured ? 'selected' : ''}>Yes</option>
                                            <option value="false" ${!property.featured ? 'selected' : ''}>No</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="mb-4">
                                    <label class="form-label">Description</label>
                                    <textarea class="form-control" rows="4">${property.description}</textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="savePropertyChanges" data-id="${propertyId}">Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to body
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editPropertyModal'));
        modal.show();
        
        // Handle save
        document.getElementById('savePropertyChanges')?.addEventListener('click', function() {
            const propertyId = this.dataset.id;
            const form = document.getElementById('editPropertyForm');
            
            // Update property
            const propertyIndex = adminState.properties.findIndex(p => p.id === propertyId);
            if (propertyIndex !== -1) {
                adminState.properties[propertyIndex].title = form.querySelector('input[type="text"]').value;
                adminState.properties[propertyIndex].type = form.querySelector('select').value;
                adminState.properties[propertyIndex].location = form.querySelectorAll('input[type="text"]')[1].value;
                adminState.properties[propertyIndex].price = parseInt(form.querySelector('input[type="number"]').value);
                adminState.properties[propertyIndex].status = form.querySelectorAll('select')[1].value;
                adminState.properties[propertyIndex].featured = form.querySelectorAll('select')[2].value === 'true';
                adminState.properties[propertyIndex].description = form.querySelector('textarea').value;
                
                // Update UI
                updatePropertiesTable();
                BnBPlug.showNotification('Property updated successfully', 'success');
            }
            
            modal.hide();
            setTimeout(() => modalContainer.remove(), 500);
        });
        
        // Remove modal on hide
        modal._element.addEventListener('hidden.bs.modal', function() {
            setTimeout(() => {
                if (modalContainer.parentNode) {
                    modalContainer.remove();
                }
            }, 500);
        });
    }
    
    function deleteProperty(propertyId) {
        if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
            return;
        }
        
        // Remove from properties array
        adminState.properties = adminState.properties.filter(p => p.id !== propertyId);
        adminState.stats.totalProperties = adminState.properties.length;
        
        // Update UI
        updatePropertiesTable();
        updateAdminStats();
        
        // Show success message
        BnBPlug.showNotification('Property deleted successfully', 'success');
    }
    
    function viewBookingDetails(bookingId) {
        const booking = adminState.bookings.find(b => b.id === bookingId);
        if (!booking) return;
        
        // Create details modal
        const modalHTML = `
            <div class="modal fade" id="bookingDetailsModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Booking Details: ${booking.id}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Booking Information</h6>
                                    <p><strong>Booking ID:</strong> ${booking.id}</p>
                                    <p><strong>Dates:</strong> ${booking.checkin} to ${booking.checkout}</p>
                                    <p><strong>Guests:</strong> ${booking.guests}</p>
                                    <p><strong>Status:</strong> <span class="badge bg-${booking.status === 'confirmed' ? 'success' : 'warning'}">${booking.status}</span></p>
                                </div>
                                <div class="col-md-6">
                                    <h6>Payment Information</h6>
                                    <p><strong>Total Amount:</strong> Ksh ${booking.total?.toLocaleString() || '0'}</p>
                                    <p><strong>Payment Method:</strong> ${booking.paymentMethod || 'M-Pesa'}</p>
                                    <p><strong>Booking Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <hr>
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Guest Information</h6>
                                    <p><strong>Name:</strong> ${booking.personal?.firstName} ${booking.personal?.lastName}</p>
                                    <p><strong>Email:</strong> ${booking.personal?.email}</p>
                                    <p><strong>Phone:</strong> ${booking.personal?.phone}</p>
                                </div>
                                <div class="col-md-6">
                                    <h6>Property Information</h6>
                                    <p><strong>Property:</strong> ${booking.propertyTitle || 'Property'}</p>
                                    <p><strong>Location:</strong> ${booking.propertyLocation || 'Location'}</p>
                                </div>
                            </div>
                            ${booking.specialRequests ? `
                                <hr>
                                <div class="row">
                                    <div class="col-12">
                                        <h6>Special Requests</h6>
                                        <p>${booking.specialRequests}</p>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            ${booking.status !== 'cancelled' ? `
                                <button type="button" class="btn btn-warning cancel-booking-btn" data-id="${bookingId}">
                                    Cancel Booking
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to body
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('bookingDetailsModal'));
        modal.show();
        
        // Add cancel booking handler
        document.querySelector('.cancel-booking-btn')?.addEventListener('click', function() {
            if (confirm('Are you sure you want to cancel this booking?')) {
                // Update booking status
                const bookingIndex = adminState.bookings.findIndex(b => b.id === bookingId);
                if (bookingIndex !== -1) {
                    adminState.bookings[bookingIndex].status = 'cancelled';
                    adminState.stats.activeBookings = adminState.bookings.filter(b => b.status === 'confirmed').length;
                    updateAdminStats();
                    
                    BnBPlug.showNotification('Booking cancelled successfully', 'success');
                    modal.hide();
                    
                    // Update bookings table if visible
                    if (adminState.currentView === 'bookings') {
                        updateBookingsTable();
                    }
                }
            }
        });
        
        // Remove modal on hide
        modal._element.addEventListener('hidden.bs.modal', function() {
            setTimeout(() => {
                if (modalContainer.parentNode) {
                    modalContainer.remove();
                }
            }, 500);
        });
    }
    
    function editUser(userId) {
        const user = adminState.users.find(u => u.id == userId);
        if (!user) return;
        
        // Create edit modal
        const modalHTML = `
            <div class="modal fade" id="editUserModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Edit User: ${user.name}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="editUserForm">
                                <div class="mb-3">
                                    <label class="form-label">Name</label>
                                    <input type="text" class="form-control" value="${user.name}" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Email</label>
                                    <input type="email" class="form-control" value="${user.email}" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">User Type</label>
                                    <select class="form-select">
                                        <option value="guest" ${user.type === 'guest' ? 'selected' : ''}>Guest</option>
                                        <option value="host" ${user.type === 'host' ? 'selected' : ''}>Host</option>
                                        <option value="admin" ${user.type === 'admin' ? 'selected' : ''}>Admin</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Status</label>
                                    <select class="form-select">
                                        <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
                                        <option value="pending" ${user.status === 'pending' ? 'selected' : ''}>Pending</option>
                                        <option value="suspended" ${user.status === 'suspended' ? 'selected' : ''}>Suspended</option>
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="saveUserChanges" data-id="${userId}">Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to body
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
        modal.show();
        
        // Handle save
        document.getElementById('saveUserChanges')?.addEventListener('click', function() {
            const userId = this.dataset.id;
            const form = document.getElementById('editUserForm');
            
            // Update user
            const userIndex = adminState.users.findIndex(u => u.id == userId);
            if (userIndex !== -1) {
                adminState.users[userIndex].name = form.querySelector('input[type="text"]').value;
                adminState.users[userIndex].email = form.querySelector('input[type="email"]').value;
                adminState.users[userIndex].type = form.querySelector('select').value;
                adminState.users[userIndex].status = form.querySelectorAll('select')[1].value;
                
                // Update UI
                updateUsersTable();
                BnBPlug.showNotification('User updated successfully', 'success');
            }
            
            modal.hide();
            setTimeout(() => modalContainer.remove(), 500);
        });
    }
    
    function toggleUserStatus(userId) {
        const user = adminState.users.find(u => u.id == userId);
        if (!user) return;
        
        const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
        const action = newStatus === 'suspended' ? 'suspend' : 'activate';
        
        if (confirm(`Are you sure you want to ${action} this user?`)) {
            // Update user status
            const userIndex = adminState.users.findIndex(u => u.id == userId);
            if (userIndex !== -1) {
                adminState.users[userIndex].status = newStatus;
                
                // Update UI
                updateUsersTable();
                BnBPlug.showNotification(`User ${action}ed successfully`, 'success');
            }
        }
    }
    
    function showImportModal() {
        // Simple import modal
        const modalHTML = `
            <div class="modal fade" id="importPropertiesModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Import Properties</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p>Import properties from CSV or JSON file.</p>
                            <div class="mb-3">
                                <label class="form-label">Select File</label>
                                <input type="file" class="form-control" accept=".csv,.json">
                            </div>
                            <div class="alert alert-info">
                                <small>
                                    <i class="fas fa-info-circle me-2"></i>
                                    File should contain: title, location, price, type, description
                                </small>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="importPropertiesBtn">Import</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to body
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('importPropertiesModal'));
        modal.show();
        
        // Handle import
        document.getElementById('importPropertiesBtn')?.addEventListener('click', function() {
            // Simulate import
            BnBPlug.showNotification('Import started. Processing properties...', 'info');
            modal.hide();
            
            setTimeout(() => {
                // Simulate adding imported properties
                const importedCount = 3;
                BnBPlug.showNotification(`Successfully imported ${importedCount} properties`, 'success');
                modalContainer.remove();
            }, 2000);
        });
    }
    
    function exportProperties() {
        // Create CSV content
        let csv = 'Title,Location,Price,Type,Status\n';
        adminState.properties.forEach(property => {
            csv += `"${property.title}","${property.location}",${property.price},${property.type},${property.status}\n`;
        });
        
        // Create download link
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bnbplug-properties-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        BnBPlug.showNotification('Properties exported successfully', 'success');
    }
    
    function loadReports() {
        const container = document.getElementById('reportsContainer');
        if (!container) return;
        
        // Create simple reports
        const revenueByMonth = {
            'Jan': 120000,
            'Feb': 150000,
            'Mar': 180000,
            'Apr': 210000,
            'May': 240000,
            'Jun': 270000
        };
        
        let html = `
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Revenue by Month</h5>
                        </div>
                        <div class="card-body">
                            <div class="revenue-chart">
                                <canvas id="revenueChart" height="200"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Property Types Distribution</h5>
                        </div>
                        <div class="card-body">
                            <div class="property-types-chart">
                                <canvas id="propertyTypesChart" height="200"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row mt-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Booking Statistics</h5>
                            <button class="btn btn-sm btn-primary" id="downloadReport">
                                <i class="fas fa-download me-1"></i>Download Report
                            </button>
                        </div>
                        <div class="card-body">
                            <div class="row text-center">
                                <div class="col-md-3">
                                    <div class="stat-card-admin">
                                        <h3>${adminState.stats.activeBookings}</h3>
                                        <p class="text-muted mb-0">Active Bookings</p>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="stat-card-admin">
                                        <h3>${Math.round(adminState.stats.totalRevenue / 1000)}K</h3>
                                        <p class="text-muted mb-0">Total Revenue</p>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="stat-card-admin">
                                        <h3>${adminState.stats.totalProperties}</h3>
                                        <p class="text-muted mb-0">Properties Listed</p>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="stat-card-admin">
                                        <h3>${adminState.stats.totalUsers}</h3>
                                        <p class="text-muted mb-0">Total Users</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        
        // Initialize charts (simulated)
        setTimeout(() => {
            // In production, use Chart.js
            console.log('Charts would be initialized here');
            
            // Add download report handler
            document.getElementById('downloadReport')?.addEventListener('click', function() {
                BnBPlug.showNotification('Report download started', 'info');
            });
        }, 100);
    }
    
    function loadAdminMobileSidebar() {
        const sidebar = document.getElementById('adminMobileSidebar');
        if (!sidebar) return;
        
        sidebar.innerHTML = `
            <div class="offcanvas-header">
                <h5 class="offcanvas-title">Admin Menu</h5>
                <button type="button" class="btn-close text-reset" data-bs-dismiss="offcanvas"></button>
            </div>
            <div class="offcanvas-body">
                <div class="text-center mb-4">
                    <i class="fas fa-user-shield fa-3x text-primary mb-3"></i>
                    <h6 class="mb-0">Administrator</h6>
                    <small class="text-muted">Super Admin Access</small>
                </div>
                <div class="list-group list-group-flush">
                    <a href="#dashboard" class="list-group-item list-group-item-action">
                        <i class="fas fa-tachometer-alt me-2"></i>Dashboard
                    </a>
                    <a href="#properties" class="list-group-item list-group-item-action">
                        <i class="fas fa-home me-2"></i>Properties
                        <span class="badge bg-primary float-end">${adminState.stats.totalProperties}</span>
                    </a>
                    <a href="#bookings" class="list-group-item list-group-item-action">
                        <i class="fas fa-calendar-check me-2"></i>Bookings
                        <span class="badge bg-success float-end">${adminState.stats.activeBookings}</span>
                    </a>
                    <a href="#users" class="list-group-item list-group-item-action">
                        <i class="fas fa-users me-2"></i>Users
                        <span class="badge bg-info float-end">${adminState.stats.totalUsers}</span>
                    </a>
                    <a href="#reports" class="list-group-item list-group-item-action">
                        <i class="fas fa-chart-bar me-2"></i>Reports
                    </a>
                    <hr class="my-2">
                    <a href="#settings" class="list-group-item list-group-item-action">
                        <i class="fas fa-cog me-2"></i>Settings
                    </a>
                    <a href="#logout" class="list-group-item list-group-item-action text-danger">
                        <i class="fas fa-sign-out-alt me-2"></i>Logout
                    </a>
                </div>
            </div>
        `;
        
        // Add event listeners
        setTimeout(() => {
            sidebar.querySelectorAll('.list-group-item').forEach(item => {
                item.addEventListener('click', function(e) {
                    e.preventDefault();
                    const view = this.getAttribute('href').substring(1);
                    
                    if (view === 'logout') {
                        handleAdminLogout();
                        return;
                    }
                    
                    adminState.currentView = view;
                    updateAdminView();
                    
                    // Close offcanvas
                    bootstrap.Offcanvas.getInstance(sidebar).hide();
                });
            });
        }, 100);
    }
    
    function handleAdminLogout() {
        localStorage.removeItem('bnbplug_user');
        localStorage.removeItem('bnbplug_token');
        window.location.href = 'login.html';
    }
    
    function updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }
    
    // Make admin functions available globally
    window.adminModule = {
        state: adminState,
        refreshData: loadAdminData,
        exportProperties: exportProperties
    };
});
