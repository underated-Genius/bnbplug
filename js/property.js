// Property Details Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Get property ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('id');
    
    if (!propertyId) {
        window.location.href = 'properties.html';
        return;
    }
    
    // Initialize property page
    initPropertyPage(propertyId);
    
    function initPropertyPage(id) {
        BnBPlug.showLoading('Loading property details...');
        
        // Load property data
        BnBPlug.loadProperties().then(properties => {
            const property = properties.find(p => p.id === id);
            
            if (!property) {
                BnBPlug.showNotification('Property not found', 'error');
                setTimeout(() => window.location.href = 'properties.html', 2000);
                return;
            }
            
            // Render property details
            renderPropertyDetails(property);
            
            // Load similar properties
            loadSimilarProperties(property);
            
            // Initialize booking calculator
            initBookingCalculator(property);
            
            // Initialize gallery
            initGallery(property.images);
            
            BnBPlug.hideLoading();
        });
    }
    
    function renderPropertyDetails(property) {
        // Update page title
        document.title = `${property.title} | BnBPlug Kenya`;
        
        // Update breadcrumb
        const breadcrumb = document.getElementById('propertyBreadcrumb');
        if (breadcrumb) {
            breadcrumb.textContent = property.title;
        }
        
        // Update main elements
        updateElement('propertyTitle', property.title);
        updateElement('propertyLocation', property.location);
        updateElement('propertyRating', `${property.rating} (${property.reviews} reviews)`);
        updateElement('propertyPrice', `Ksh ${property.price.toLocaleString()}`);
        updateElement('propertyDescription', property.description);
        updateElement('nightlyPrice', property.price.toLocaleString());
        
        // Update host information
        updateElement('hostName', property.host.name);
        updateElement('hostInfo', `${property.host.superhost ? 'Superhost' : 'Host'} · ${property.host.since} years hosting`);
        
        // Render amenities
        renderAmenities(property.amenities);
        
        // Render highlights
        renderHighlights(property);
    }
    
    function updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }
    
    function renderAmenities(amenities) {
        const container = document.getElementById('propertyAmenities');
        if (!container) return;
        
        container.innerHTML = '';
        
        amenities.forEach(amenity => {
            const col = document.createElement('div');
            col.className = 'col-md-6 mb-2';
            col.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="fas fa-check text-success me-2"></i>
                    <span>${amenity}</span>
                </div>
            `;
            container.appendChild(col);
        });
    }
    
    function renderHighlights(property) {
        const container = document.getElementById('propertyHighlights');
        if (!container) return;
        
        const highlights = [
            `${property.guests} guests`,
            `${property.bedrooms} bedrooms`,
            `${property.beds} beds`,
            `${property.bathrooms} bathrooms`
        ];
        
        container.innerHTML = highlights.map(highlight => `
            <div class="d-flex align-items-center mb-2">
                <i class="fas fa-check-circle text-primary me-2"></i>
                <span>${highlight}</span>
            </div>
        `).join('');
    }
    
    function initGallery(images) {
        const gallery = document.getElementById('propertyGallery');
        if (!gallery) return;
        
        if (images.length === 0) {
            gallery.innerHTML = '<div class="alert alert-info">No images available</div>';
            return;
        }
        
        // Main image
        const mainImage = images[0];
        gallery.innerHTML = `
            <div class="gallery-main rounded" style="background-image: url('${mainImage}')"></div>
            ${images.length > 1 ? `
                <div class="gallery-thumbnails mt-3">
                    ${images.slice(1, 5).map((img, index) => `
                        <div class="gallery-thumb" style="background-image: url('${img}')" 
                             data-image="${img}" data-index="${index + 1}"></div>
                    `).join('')}
                    ${images.length > 5 ? `
                        <div class="gallery-thumb more-count">
                            +${images.length - 5} more
                        </div>
                    ` : ''}
                </div>
            ` : ''}
        `;
        
        // Add thumbnail click events
        gallery.querySelectorAll('.gallery-thumb').forEach(thumb => {
            thumb.addEventListener('click', function() {
                const imageUrl = this.dataset.image;
                if (imageUrl) {
                    gallery.querySelector('.gallery-main').style.backgroundImage = `url('${imageUrl}')`;
                }
            });
        });
    }
    
    function initBookingCalculator(property) {
        const checkinInput = document.getElementById('checkinDate');
        const checkoutInput = document.getElementById('checkoutDate');
        const guestSelect = document.getElementById('guestCount');
        const subtotalElement = document.getElementById('subtotal');
        const totalElement = document.getElementById('totalPrice');
        const nightsElement = document.getElementById('nightsCount');
        
        // Set minimum dates
        const today = new Date().toISOString().split('T')[0];
        if (checkinInput) checkinInput.min = today;
        
        // Calculate and update prices
        function updatePrices() {
            const checkin = new Date(checkinInput.value);
            const checkout = new Date(checkoutInput.value);
            
            if (checkin && checkout && checkout > checkin) {
                const nights = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));
                const subtotal = property.price * nights;
                const cleaningFee = 1500;
                const serviceFee = 1000;
                const total = subtotal + cleaningFee + serviceFee;
                
                if (nightsElement) nightsElement.textContent = nights;
                if (subtotalElement) subtotalElement.textContent = `Ksh ${subtotal.toLocaleString()}`;
                if (totalElement) totalElement.textContent = `Ksh ${total.toLocaleString()}`;
            } else {
                if (nightsElement) nightsElement.textContent = '0';
                if (subtotalElement) subtotalElement.textContent = 'Ksh 0';
                if (totalElement) totalElement.textContent = 'Ksh 0';
            }
        }
        
        // Set default dates (tomorrow and day after tomorrow)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfter = new Date();
        dayAfter.setDate(dayAfter.getDate() + 2);
        
        if (checkinInput) {
            checkinInput.valueAsDate = tomorrow;
            checkinInput.addEventListener('change', function() {
                if (checkoutInput) {
                    checkoutInput.min = this.value;
                    if (!checkoutInput.value || new Date(checkoutInput.value) <= new Date(this.value)) {
                        const nextDay = new Date(this.value);
                        nextDay.setDate(nextDay.getDate() + 1);
                        checkoutInput.valueAsDate = nextDay;
                    }
                }
                updatePrices();
            });
        }
        
        if (checkoutInput) {
            checkoutInput.valueAsDate = dayAfter;
            checkoutInput.min = tomorrow.toISOString().split('T')[0];
            checkoutInput.addEventListener('change', updatePrices);
        }
        
        if (guestSelect) {
            guestSelect.addEventListener('change', updatePrices);
        }
        
        // Initialize prices
        updatePrices();
        
        // Book now button
        const bookBtn = document.getElementById('bookNowBtn');
        if (bookBtn) {
            bookBtn.addEventListener('click', function() {
                if (!checkinInput.value || !checkoutInput.value) {
                    BnBPlug.showNotification('Please select check-in and check-out dates', 'error');
                    return;
                }
                
                const checkin = checkinInput.value;
                const checkout = checkoutInput.value;
                const guests = guestSelect.value;
                
                // Redirect to booking page with parameters
                const params = new URLSearchParams({
                    property: property.id,
                    checkin,
                    checkout,
                    guests
                });
                
                window.location.href = `booking.html?${params.toString()}`;
            });
        }
    }
    
    function loadSimilarProperties(currentProperty) {
        BnBPlug.loadProperties({ location: currentProperty.city }).then(properties => {
            // Filter out current property and get first 3 similar properties
            const similar = properties
                .filter(p => p.id !== currentProperty.id)
                .slice(0, 3);
            
            renderSimilarProperties(similar);
        });
    }
    
    function renderSimilarProperties(properties) {
        const container = document.getElementById('similarProperties');
        if (!container) return;
        
        if (properties.length === 0) {
            container.innerHTML = '<div class="col-12 text-center"><p>No similar properties found.</p></div>';
            return;
        }
        
        container.innerHTML = '';
        
        properties.forEach(property => {
            const col = document.createElement('div');
            col.className = 'col-md-4';
            
            col.innerHTML = `
                <div class="property-card h-100">
                    <div class="property-image" style="background-image: url('${property.images[0]}')"></div>
                    <div class="property-content">
                        <h6 class="mb-1">${property.title}</h6>
                        <p class="text-muted mb-2 small">
                            <i class="fas fa-map-marker-alt"></i> ${property.location}
                        </p>
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="property-price">Ksh ${property.price.toLocaleString()}</div>
                            <small class="text-muted">per night</small>
                        </div>
                    </div>
                </div>
            `;
            
            col.querySelector('.property-card').addEventListener('click', () => {
                window.location.href = `property.html?id=${property.id}`;
            });
            
            container.appendChild(col);
        });
    }
});
