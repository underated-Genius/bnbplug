// BnBPlug Main Application JavaScript
// Production-ready with security features

document.addEventListener('DOMContentLoaded', function() {
    // ===== GLOBAL VARIABLES =====
    const APP_CONFIG = {
        name: 'BnBPlug Kenya',
        version: '1.0.0',
        apiBase: 'https://api.bnbplug.co.ke',
        isProduction: true,
        debug: false
    };

    // ===== SECURITY CONFIGURATION =====
    const SECURITY_CONFIG = {
        csrfToken: generateCSRFToken(),
        rateLimit: 100, // requests per minute
        sessionTimeout: 30, // minutes
        passwordMinLength: 8
    };

    // ===== WINDOW CONTROLS FUNCTIONALITY =====
    function initWindowControls() {
        const backBtn = document.getElementById('windowBack');
        const minimizeBtn = document.getElementById('windowMinimize');
        const closeBtn = document.getElementById('windowClose');
        
        if (backBtn) {
            backBtn.addEventListener('click', function() {
                if (window.history.length > 1) {
                    window.history.back();
                } else {
                    window.location.href = 'index.html';
                }
            });
        }
        
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', function() {
                // Simulate minimize (in production would use window management API)
                document.body.style.transform = 'scale(0.95)';
                document.body.style.opacity = '0.5';
                setTimeout(() => {
                    document.body.style.transform = '';
                    document.body.style.opacity = '';
                }, 300);
                
                showNotification('Window minimized (simulated)', 'info');
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                if (confirm('Are you sure you want to close this window?')) {
                    // In production: window.close() for popups
                    window.location.href = 'about:blank';
                }
            });
        }
    }

    // ===== NAVIGATION ENHANCEMENTS =====
    function initNavigation() {
        // Highlight active page
        const currentPage = window.location.pathname.split('/').pop();
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage || (currentPage === '' && href === 'index.html')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
        
        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href.startsWith('#')) {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
            });
        });
        
        // Navbar scroll effect
        let lastScroll = 0;
        const navbar = document.getElementById('mainNav');
        
        if (navbar) {
            window.addEventListener('scroll', function() {
                const currentScroll = window.pageYOffset;
                
                if (currentScroll <= 0) {
                    navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
                    navbar.style.background = 'rgba(26, 41, 128, 0.95)';
                } else if (currentScroll > lastScroll) {
                    // Scrolling down
                    navbar.style.transform = 'translateY(-100%)';
                } else {
                    // Scrolling up
                    navbar.style.transform = 'translateY(0)';
                    navbar.style.boxShadow = '0 4px 30px rgba(0,0,0,0.2)';
                    navbar.style.background = 'rgba(26, 41, 128, 0.98)';
                }
                
                lastScroll = currentScroll;
            });
        }
    }

    // ===== LOAD PROPERTIES FROM XML =====
    async function loadProperties(filter = {}) {
        try {
            showLoading();
            
            // In production, this would be a fetch to an API
            // For now, we'll simulate with local XML
            const response = await fetch('xml/properties.xml');
            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            
            const properties = Array.from(xmlDoc.getElementsByTagName('property')).map(property => {
                return parsePropertyXML(property);
            });
            
            // Apply filters
            let filteredProperties = properties;
            
            if (filter.location) {
                filteredProperties = filteredProperties.filter(p => 
                    p.city === filter.location
                );
            }
            
            if (filter.price) {
                const [min, max] = filter.price.split('-').map(Number);
                if (max) {
                    filteredProperties = filteredProperties.filter(p => 
                        p.price >= min && p.price <= max
                    );
                } else {
                    filteredProperties = filteredProperties.filter(p => 
                        p.price >= min
                    );
                }
            }
            
            if (filter.type) {
                filteredProperties = filteredProperties.filter(p => 
                    p.type === filter.type
                );
            }
            
            // Update property count
            const countElement = document.getElementById('propertyCount');
            if (countElement) {
                countElement.textContent = filteredProperties.length;
            }
            
            return filteredProperties;
            
        } catch (error) {
            console.error('Error loading properties:', error);
            showNotification('Failed to load properties. Please try again.', 'error');
            return [];
        } finally {
            hideLoading();
        }
    }

    function parsePropertyXML(property) {
        return {
            id: property.getAttribute('id'),
            title: getXMLValue(property, 'title'),
            description: getXMLValue(property, 'description'),
            location: getXMLValue(property, 'location'),
            city: getXMLValue(property, 'city'),
            price: parseInt(getXMLValue(property, 'price')),
            type: getXMLValue(property, 'type'),
            rating: parseFloat(getXMLValue(property, 'rating')),
            reviews: parseInt(getXMLValue(property, 'reviews')),
            guests: parseInt(getXMLValue(property, 'guests')),
            bedrooms: parseInt(getXMLValue(property, 'bedrooms')),
            beds: parseInt(getXMLValue(property, 'beds')),
            bathrooms: parseInt(getXMLValue(property, 'bathrooms')),
            featured: getXMLValue(property, 'featured') === 'true',
            status: getXMLValue(property, 'status'),
            images: Array.from(property.getElementsByTagName('image')).map(img => img.textContent),
            amenities: Array.from(property.getElementsByTagName('amenity')).map(a => a.textContent),
            host: {
                name: getXMLValue(property.querySelector('host'), 'name'),
                avatar: getXMLValue(property.querySelector('host'), 'avatar'),
                since: getXMLValue(property.querySelector('host'), 'since'),
                superhost: getXMLValue(property.querySelector('host'), 'superhost') === 'true'
            }
        };
    }

    function getXMLValue(parent, tagName) {
        const element = parent.getElementsByTagName(tagName)[0];
        return element ? element.textContent : '';
    }

    // ===== RENDER PROPERTY CARDS =====
    function renderPropertyCards(properties, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        
        properties.forEach(property => {
            const card = createPropertyCard(property);
            container.appendChild(card);
        });
    }

    function createPropertyCard(property) {
        const col = document.createElement('div');
        col.className = 'col-lg-4 col-md-6 mb-4';
        
        const card = document.createElement('div');
        card.className = 'property-card fade-in';
        card.dataset.id = property.id;
        
        card.innerHTML = `
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
                <div class="d-flex justify-content-between align-items-center">
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
        
        // Add click event
        card.addEventListener('click', function() {
            window.location.href = `property.html?id=${property.id}`;
        });
        
        col.appendChild(card);
        return col;
    }

    // ===== NOTIFICATION SYSTEM =====
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelector('.custom-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = `custom-notification alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
        notification.style.cssText = `
            position: fixed;
            top: 90px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            border: none;
            border-radius: 10px;
        `;
        
        notification.innerHTML = `
            <strong>${type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'Info'}</strong>
            <span class="ms-2">${message}</span>
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

    // ===== LOADING INDICATOR =====
    function showLoading(message = 'Loading...') {
        let overlay = document.getElementById('loadingOverlay');
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255,255,255,0.9);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 9998;
            `;
            
            overlay.innerHTML = `
                <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3">${message}</p>
            `;
            
            document.body.appendChild(overlay);
        }
    }

    function hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.remove();
        }
    }

    // ===== SECURITY FUNCTIONS =====
    function generateCSRFToken() {
        // In production, this would be generated server-side
        return 'csrf_' + Math.random().toString(36).substr(2, 9);
    }

    function sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function validatePhone(phone) {
        const re = /^\+?[\d\s-]{10,}$/;
        return re.test(phone);
    }

    // ===== FORM HANDLING =====
    function initForms() {
        // Add CSRF token to all forms
        document.querySelectorAll('form').forEach(form => {
            if (!form.querySelector('input[name="csrf_token"]')) {
                const csrfInput = document.createElement('input');
                csrfInput.type = 'hidden';
                csrfInput.name = 'csrf_token';
                csrfInput.value = SECURITY_CONFIG.csrfToken;
                form.appendChild(csrfInput);
            }
        });
        
        // Form submission prevention with validation
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', function(e) {
                if (!validateForm(this)) {
                    e.preventDefault();
                    showNotification('Please fill in all required fields correctly.', 'error');
                }
            });
        });
    }

    function validateForm(form) {
        let isValid = true;
        
        form.querySelectorAll('[required]').forEach(input => {
            if (!input.value.trim()) {
                input.classList.add('is-invalid');
                isValid = false;
            } else {
                input.classList.remove('is-invalid');
                
                // Special validations
                if (input.type === 'email' && !validateEmail(input.value)) {
                    input.classList.add('is-invalid');
                    isValid = false;
                }
                
                if (input.type === 'tel' && !validatePhone(input.value)) {
                    input.classList.add('is-invalid');
                    isValid = false;
                }
            }
        });
        
        return isValid;
    }

    // ===== PERFORMANCE OPTIMIZATIONS =====
    function initPerformance() {
        // Lazy load images
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.add('loaded');
                        imageObserver.unobserve(img);
                    }
                });
            });
            
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
        
        // Debounce scroll events
        let scrollTimeout;
        window.addEventListener('scroll', function() {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                // Perform scroll-based operations
            }, 100);
        });
    }

    // ===== DESTINATION CARDS INTERACTION =====
    function initDestinationCards() {
        document.querySelectorAll('.destination-card').forEach(card => {
            card.addEventListener('click', function() {
                const city = this.dataset.city;
                window.location.href = `properties.html?location=${city}`;
            });
        });
    }

    // ===== INITIALIZE APPLICATION =====
    function initApp() {
        console.log(`${APP_CONFIG.name} v${APP_CONFIG.version} initialized`);
        
        // Initialize all modules
        initWindowControls();
        initNavigation();
        initForms();
        initPerformance();
        initDestinationCards();
        
        // Load featured properties on homepage
        if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
            loadProperties({ featured: true }).then(properties => {
                renderPropertyCards(properties, 'featuredProperties');
            });
        }
        
        // Performance monitoring
        if (APP_CONFIG.debug) {
            console.log('Performance monitor active');
            monitorPerformance();
        }
    }

    // ===== PERFORMANCE MONITORING =====
    function monitorPerformance() {
        window.addEventListener('load', function() {
            const timing = performance.timing;
            const loadTime = timing.loadEventEnd - timing.navigationStart;
            console.log(`Page loaded in ${loadTime}ms`);
            
            if (loadTime > 3000) {
                console.warn('Page load time exceeds 3 seconds - consider optimization');
            }
        });
    }

    // ===== PUBLIC API =====
    window.BnBPlug = {
        config: APP_CONFIG,
        security: SECURITY_CONFIG,
        showNotification,
        showLoading,
        hideLoading,
        loadProperties,
        renderPropertyCards
    };

    // ===== START APPLICATION =====
    initApp();
});
