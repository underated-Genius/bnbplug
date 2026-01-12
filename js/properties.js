// Properties Page Specific Functionality
document.addEventListener('DOMContentLoaded', function() {
    // State management
    const state = {
        properties: [],
        filteredProperties: [],
        currentPage: 1,
        itemsPerPage: 6,
        filters: {
            location: '',
            price: '',
            type: '',
            checkin: '',
            checkout: '',
            guests: '2'
        },
        sortBy: 'featured',
        viewMode: 'grid'
    };

    // DOM Elements
    const elements = {
        propertiesContainer: document.getElementById('propertiesContainer'),
        propertyCount: document.getElementById('propertyCount'),
        locationFilter: document.getElementById('locationFilter'),
        priceFilter: document.getElementById('priceFilter'),
        typeFilter: document.getElementById('typeFilter'),
        checkinDate: document.getElementById('checkinDate'),
        checkoutDate: document.getElementById('checkoutDate'),
        guestsFilter: document.getElementById('guestsFilter'),
        applyFilters: document.getElementById('applyFilters'),
        resetFilters: document.getElementById('resetFilters'),
        sortOptions: document.getElementById('sortOptions'),
        viewGrid: document.getElementById('viewGrid'),
        viewList: document.getElementById('viewList'),
        pagination: document.getElementById('pagination')
    };

    // Initialize
    initPropertiesPage();

    function initPropertiesPage() {
        // Set minimum dates for checkin/checkout
        const today = new Date().toISOString().split('T')[0];
        if (elements.checkinDate) {
            elements.checkinDate.min = today;
            elements.checkinDate.addEventListener('change', function() {
                if (elements.checkoutDate) {
                    elements.checkoutDate.min = this.value;
                }
            });
        }

        // Load properties
        loadPropertiesFromURL();
        
        // Set up event listeners
        setupEventListeners();
        
        // Initialize view mode
        if (localStorage.getItem('bnbplug_view_mode')) {
            state.viewMode = localStorage.getItem('bnbplug_view_mode');
            updateViewMode();
        }
    }

    function loadPropertiesFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Get filters from URL
        state.filters.location = urlParams.get('location') || '';
        state.filters.price = urlParams.get('price') || '';
        state.filters.type = urlParams.get('type') || '';
        
        // Update filter UI
        if (state.filters.location && elements.locationFilter) {
            elements.locationFilter.value = state.filters.location;
        }
        
        if (state.filters.price && elements.priceFilter) {
            elements.priceFilter.value = state.filters.price;
        }
        
        if (state.filters.type && elements.typeFilter) {
            elements.typeFilter.value = state.filters.type;
        }
        
        // Load and display properties
        loadAndDisplayProperties();
    }

    function loadAndDisplayProperties() {
        BnBPlug.showLoading('Loading properties...');
        
        BnBPlug.loadProperties(state.filters).then(properties => {
            state.properties = properties;
            applySorting();
            updatePropertyCount();
            renderProperties();
            renderPagination();
            BnBPlug.hideLoading();
        });
    }

    function applySorting() {
        switch(state.sortBy) {
            case 'price_low':
                state.filteredProperties = [...state.properties].sort((a, b) => a.price - b.price);
                break;
            case 'price_high':
                state.filteredProperties = [...state.properties].sort((a, b) => b.price - a.price);
                break;
            case 'rating':
                state.filteredProperties = [...state.properties].sort((a, b) => b.rating - a.rating);
                break;
            case 'newest':
                state.filteredProperties = [...state.properties].sort((a, b) => b.id - a.id);
                break;
            default:
                state.filteredProperties = [...state.properties].filter(p => p.featured)
                    .concat([...state.properties].filter(p => !p.featured));
                break;
        }
    }

    function renderProperties() {
        if (!elements.propertiesContainer) return;
        
        elements.propertiesContainer.innerHTML = '';
        
        // Calculate pagination
        const startIndex = (state.currentPage - 1) * state.itemsPerPage;
        const endIndex = startIndex + state.itemsPerPage;
        const pageProperties = state.filteredProperties.slice(startIndex, endIndex);
        
        if (pageProperties.length === 0) {
            elements.propertiesContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h4>No properties found</h4>
                    <p class="text-muted">Try adjusting your search filters</p>
                    <button class="btn btn-primary mt-3" id="clearAllFilters">Clear All Filters</button>
                </div>
            `;
            
            document.getElementById('clearAllFilters')?.addEventListener('click', clearAllFilters);
            return;
        }
        
        // Render properties based on view mode
        if (state.viewMode === 'list') {
            renderListView(pageProperties);
        } else {
            renderGridView(pageProperties);
        }
    }

    function renderGridView(properties) {
        properties.forEach(property => {
            const col = document.createElement('div');
            col.className = 'col-lg-4 col-md-6 mb-4';
            
            const card = document.createElement('div');
            card.className = 'property-card h-100';
            card.innerHTML = getPropertyCardHTML(property);
            
            card.addEventListener('click', () => {
                window.location.href = `property.html?id=${property.id}`;
            });
            
            col.appendChild(card);
            elements.propertiesContainer.appendChild(col);
        });
    }

    function renderListView(properties) {
        properties.forEach(property => {
            const col = document.createElement('div');
            col.className = 'col-12 mb-4';
            
            const card = document.createElement('div');
            card.className = 'property-card';
            card.style.cursor = 'pointer';
            
            card.innerHTML = `
                <div class="row g-0">
                    <div class="col-md-4">
                        <div class="property-image h-100" style="background-image: url('${property.images[0]}')"></div>
                    </div>
                    <div class="col-md-8">
                        <div class="property-content p-4 h-100 d-flex flex-column justify-content-between">
                            <div>
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <h5 class="mb-0">${property.title}</h5>
                                    <div class="property-rating">
                                        <i class="fas fa-star"></i> ${property.rating} (${property.reviews})
                                    </div>
                                </div>
                                <p class="text-muted mb-2">
                                    <i class="fas fa-map-marker-alt text-primary"></i> ${property.location}
                                </p>
                                <p class="mb-3">${property.description.substring(0, 150)}...</p>
                                <div class="property-amenities mb-3">
                                    ${property.amenities.slice(0, 3).map(a => `
                                        <span class="badge bg-light text-dark me-1 mb-1">
                                            <i class="fas fa-check"></i> ${a}
                                        </span>
                                    `).join('')}
                                </div>
                            </div>
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <span class="property-price h4">Ksh ${property.price.toLocaleString()}</span>
                                    <small class="text-muted"> / night</small>
                                </div>
                                <div>
                                    <span class="badge bg-light text-dark me-1">
                                        <i class="fas fa-user-friends"></i> ${property.guests}
                                    </span>
                                    <span class="badge bg-light text-dark me-1">
                                        <i class="fas fa-bed"></i> ${property.bedrooms}
                                    </span>
                                    <span class="badge bg-light text-dark">
                                        <i class="fas fa-bath"></i> ${property.bathrooms}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            card.addEventListener('click', () => {
                window.location.href = `property.html?id=${property.id}`;
            });
            
            col.appendChild(card);
            elements.propertiesContainer.appendChild(col);
        });
    }

    function getPropertyCardHTML(property) {
        return `
            <div class="property-image" style="background-image: url('${property.images[0]}')">
                <span class="property-badge">${property.type.charAt(0).toUpperCase() + property.type.slice(1)}</span>
                ${property.featured ? '<span class="property-badge" style="left: auto; right: 15px; background: #e9c46a;">Featured</span>' : ''}
            </div>
            <div class="property-content">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h5 class="mb-0">${property.title}</h5>
                    <div class="property-rating">
                        <i class="fas fa-star"></i> ${property.rating}
                    </div>
                </div>
                <p class="text-muted mb-2">
                    <i class="fas fa-map-marker-alt text-primary"></i> ${property.location}
                </p>
                <p class="property-description">${property.description.substring(0, 100)}...</p>
                <div class="d-flex justify-content-between align-items-center mt-3">
                    <div>
                        <span class="property-price">Ksh ${property.price.toLocaleString()}</span>
                        <small class="text-muted"> / night</small>
                    </div>
                    <div>
                        <span class="badge bg-light text-dark">
                            <i class="fas fa-user-friends me-1"></i>${property.guests}
                        </span>
                        <span class="badge bg-light text-dark ms-1">
                            <i class="fas fa-bed me-1"></i>${property.bedrooms}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    function renderPagination() {
        if (!elements.pagination) return;
        
        const totalPages = Math.ceil(state.filteredProperties.length / state.itemsPerPage);
        
        if (totalPages <= 1) {
            elements.pagination.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <li class="page-item ${state.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${state.currentPage - 1}">Previous</a>
            </li>
        `;
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= state.currentPage - 1 && i <= state.currentPage + 1)) {
                paginationHTML += `
                    <li class="page-item ${i === state.currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" data-page="${i}">${i}</a>
                    </li>
                `;
            } else if (i === state.currentPage - 2 || i === state.currentPage + 2) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }
        
        // Next button
        paginationHTML += `
            <li class="page-item ${state.currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${state.currentPage + 1}">Next</a>
            </li>
        `;
        
        elements.pagination.innerHTML = paginationHTML;
        
        // Add event listeners
        elements.pagination.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const page = parseInt(this.dataset.page);
                if (page && page !== state.currentPage) {
                    state.currentPage = page;
                    renderProperties();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        });
    }

    function updatePropertyCount() {
        if (elements.propertyCount) {
            elements.propertyCount.textContent = state.filteredProperties.length;
        }
    }

    function updateViewMode() {
        if (state.viewMode === 'list') {
            elements.viewGrid?.classList.remove('active');
            elements.viewList?.classList.add('active');
            elements.propertiesContainer?.classList.add('list-view');
        } else {
            elements.viewGrid?.classList.add('active');
            elements.viewList?.classList.remove('active');
            elements.propertiesContainer?.classList.remove('list-view');
        }
        
        renderProperties();
        localStorage.setItem('bnbplug_view_mode', state.viewMode);
    }

    function setupEventListeners() {
        // Filter controls
        if (elements.applyFilters) {
            elements.applyFilters.addEventListener('click', applyFilters);
        }
        
        if (elements.resetFilters) {
            elements.resetFilters.addEventListener('click', clearAllFilters);
        }
        
        // Sorting
        if (elements.sortOptions) {
            elements.sortOptions.addEventListener('change', function() {
                state.sortBy = this.value;
                applySorting();
                state.currentPage = 1;
                renderProperties();
                renderPagination();
            });
        }
        
        // View mode
        if (elements.viewGrid) {
            elements.viewGrid.addEventListener('click', function() {
                state.viewMode = 'grid';
                updateViewMode();
            });
        }
        
        if (elements.viewList) {
            elements.viewList.addEventListener('click', function() {
                state.viewMode = 'list';
                updateViewMode();
            });
        }
        
        // Real-time filter updates
        [elements.locationFilter, elements.priceFilter, elements.typeFilter].forEach(filter => {
            if (filter) {
                filter.addEventListener('change', function() {
                    state.filters[this.id.replace('Filter', '')] = this.value;
                });
            }
        });
    }

    function applyFilters() {
        // Update state from UI
        state.filters.location = elements.locationFilter?.value || '';
        state.filters.price = elements.priceFilter?.value || '';
        state.filters.type = elements.typeFilter?.value || '';
        state.filters.checkin = elements.checkinDate?.value || '';
        state.filters.checkout = elements.checkoutDate?.value || '';
        state.filters.guests = elements.guestsFilter?.value || '2';
        
        state.currentPage = 1;
        loadAndDisplayProperties();
        
        // Update URL
        updateURLWithFilters();
    }

    function clearAllFilters() {
        // Reset all filters
        if (elements.locationFilter) elements.locationFilter.value = '';
        if (elements.priceFilter) elements.priceFilter.value = '';
        if (elements.typeFilter) elements.typeFilter.value = '';
        if (elements.checkinDate) elements.checkinDate.value = '';
        if (elements.checkoutDate) elements.checkoutDate.value = '';
        if (elements.guestsFilter) elements.guestsFilter.value = '2';
        
        // Reset state
        state.filters = {
            location: '',
            price: '',
            type: '',
            checkin: '',
            checkout: '',
            guests: '2'
        };
        
        state.currentPage = 1;
        loadAndDisplayProperties();
        
        // Clear URL parameters
        window.history.pushState({}, '', 'properties.html');
    }

    function updateURLWithFilters() {
        const params = new URLSearchParams();
        
        if (state.filters.location) params.set('location', state.filters.location);
        if (state.filters.price) params.set('price', state.filters.price);
        if (state.filters.type) params.set('type', state.filters.type);
        
        const url = params.toString() ? `properties.html?${params.toString()}` : 'properties.html';
        window.history.pushState({}, '', url);
    }

    // Make functions available globally for this page
    window.propertiesModule = {
        applyFilters,
        clearAllFilters,
        state
    };
});
