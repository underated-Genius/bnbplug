// Booking Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    // State
    const bookingState = {
        currentStep: 1,
        bookingData: {},
        property: null,
        paymentMethod: null
    };
    
    // Initialize
    initBookingPage();
    
    function initBookingPage() {
        // Load booking data from URL
        loadBookingData();
        
        // Setup step navigation
        setupStepNavigation();
        
        // Setup payment method selection
        setupPaymentMethods();
        
        // Setup form validation
        setupFormValidation();
    }
    
    function loadBookingData() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Load property data
        const propertyId = urlParams.get('property');
        if (propertyId) {
            BnBPlug.loadProperties().then(properties => {
                const property = properties.find(p => p.id === propertyId);
                if (property) {
                    bookingState.property = property;
                    updateBookingSummary(property);
                }
            });
        }
        
        // Load dates and guests
        bookingState.bookingData = {
            checkin: urlParams.get('checkin'),
            checkout: urlParams.get('checkout'),
            guests: urlParams.get('guests') || '2'
        };
        
        // Update form inputs
        updateFormInputs();
        
        // Calculate initial price
        calculatePrice();
    }
    
    function updateBookingSummary(property) {
        // Update property summary
        updateElement('summaryProperty', property.title);
        updateElement('summaryLocation', property.location);
        updateElement('summaryNightly', property.price.toLocaleString());
        
        // Update price summary
        updatePriceSummary();
    }
    
    function updateFormInputs() {
        const { checkin, checkout, guests } = bookingState.bookingData;
        
        // Update date inputs
        if (checkin) {
            const checkinInput = document.getElementById('checkinDate');
            if (checkinInput) checkinInput.value = checkin;
        }
        
        if (checkout) {
            const checkoutInput = document.getElementById('checkoutDate');
            if (checkoutInput) checkoutInput.value = checkout;
        }
        
        // Update guest select
        if (guests) {
            const guestSelect = document.getElementById('guestCount');
            if (guestSelect) guestSelect.value = guests;
        }
    }
    
    function calculatePrice() {
        const { checkin, checkout } = bookingState.bookingData;
        
        if (!checkin || !checkout || !bookingState.property) return;
        
        const checkinDate = new Date(checkin);
        const checkoutDate = new Date(checkout);
        const nights = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
        
        if (nights <= 0) return;
        
        const nightlyPrice = bookingState.property.price;
        const subtotal = nightlyPrice * nights;
        const cleaningFee = 1500;
        const serviceFee = 1000;
        const total = subtotal + cleaningFee + serviceFee;
        
        // Update UI
        updateElement('summaryNights', nights);
        updateElement('summarySubtotal', `Ksh ${subtotal.toLocaleString()}`);
        updateElement('summaryTotal', `Ksh ${total.toLocaleString()}`);
        
        // Update booking data
        bookingState.bookingData.nights = nights;
        bookingState.bookingData.subtotal = subtotal;
        bookingState.bookingData.total = total;
    }
    
    function updatePriceSummary() {
        const { nights = 0, subtotal = 0, total = 0 } = bookingState.bookingData;
        
        updateElement('bookingDates', `${bookingState.bookingData.checkin} to ${bookingState.bookingData.checkout}`);
        updateElement('bookingGuests', bookingState.bookingData.guests);
        updateElement('bookingTotal', `Ksh ${total.toLocaleString()}`);
        updateElement('summaryNights', nights);
        updateElement('summarySubtotal', `Ksh ${subtotal.toLocaleString()}`);
        updateElement('summaryTotal', `Ksh ${total.toLocaleString()}`);
    }
    
    function setupStepNavigation() {
        const steps = document.querySelectorAll('.step');
        const stepElements = document.querySelectorAll('.booking-step');
        
        // Next button
        const nextBtn = document.getElementById('nextToPayment');
        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                if (validateStep1()) {
                    goToStep(2);
                }
            });
        }
        
        // Back button
        const backBtn = document.getElementById('backToDetails');
        if (backBtn) {
            backBtn.addEventListener('click', function() {
                goToStep(1);
            });
        }
        
        // Payment confirmation
        const confirmPaymentBtn = document.getElementById('confirmPayment');
        if (confirmPaymentBtn) {
            confirmPaymentBtn.addEventListener('click', function() {
                if (validateStep2()) {
                    processPayment();
                }
            });
        }
    }
    
    function goToStep(stepNumber) {
        // Hide all steps
        document.querySelectorAll('.booking-step').forEach(step => {
            step.style.display = 'none';
            step.classList.remove('active');
        });
        
        // Show current step
        const currentStep = document.getElementById(`step${stepNumber}`);
        if (currentStep) {
            currentStep.style.display = 'block';
            currentStep.classList.add('active');
        }
        
        // Update step indicators
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active');
            if (parseInt(step.dataset.step) <= stepNumber) {
                step.classList.add('active');
            }
        });
        
        // Update state
        bookingState.currentStep = stepNumber;
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    function validateStep1() {
        const firstName = document.getElementById('firstName');
        const lastName = document.getElementById('lastName');
        const email = document.getElementById('email');
        const phone = document.getElementById('phone');
        
        let isValid = true;
        
        // Simple validation
        if (!firstName.value.trim()) {
            markInvalid(firstName);
            isValid = false;
        } else {
            markValid(firstName);
        }
        
        if (!lastName.value.trim()) {
            markInvalid(lastName);
            isValid = false;
        } else {
            markValid(lastName);
        }
        
        if (!email.value.trim() || !BnBPlug.security.validateEmail(email.value)) {
            markInvalid(email);
            isValid = false;
        } else {
            markValid(email);
        }
        
        if (!phone.value.trim() || !BnBPlug.security.validatePhone(phone.value)) {
            markInvalid(phone);
            isValid = false;
        } else {
            markValid(phone);
        }
        
        if (isValid) {
            // Save personal data
            bookingState.bookingData.personal = {
                firstName: firstName.value,
                lastName: lastName.value,
                email: email.value,
                phone: phone.value,
                specialRequests: document.getElementById('specialRequests')?.value || ''
            };
        }
        
        return isValid;
    }
    
    function validateStep2() {
        if (!bookingState.paymentMethod) {
            BnBPlug.showNotification('Please select a payment method', 'error');
            return false;
        }
        
        if (bookingState.paymentMethod === 'mpesa') {
            const mpesaNumber = document.getElementById('mpesaNumber');
            if (!mpesaNumber?.value.trim()) {
                markInvalid(mpesaNumber);
                return false;
            }
            bookingState.bookingData.mpesaNumber = mpesaNumber.value;
        }
        
        return true;
    }
    
    function markInvalid(element) {
        if (element) {
            element.classList.add('is-invalid');
        }
    }
    
    function markValid(element) {
        if (element) {
            element.classList.remove('is-invalid');
        }
    }
    
    function setupPaymentMethods() {
        document.querySelectorAll('.payment-method').forEach(method => {
            method.addEventListener('click', function() {
                // Remove selection from all methods
                document.querySelectorAll('.payment-method').forEach(m => {
                    m.classList.remove('selected');
                });
                
                // Select current method
                this.classList.add('selected');
                
                // Get payment method
                const paymentMethod = this.dataset.method;
                bookingState.paymentMethod = paymentMethod;
                
                // Show/hide details based on method
                document.getElementById('cardDetails').style.display = 
                    paymentMethod === 'card' ? 'block' : 'none';
                document.getElementById('mpesaDetails').style.display = 
                    paymentMethod === 'mpesa' ? 'block' : 'none';
            });
        });
    }
    
    function setupFormValidation() {
        // Real-time validation for email
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.addEventListener('blur', function() {
                if (this.value && !BnBPlug.security.validateEmail(this.value)) {
                    markInvalid(this);
                } else {
                    markValid(this);
                }
            });
        }
        
        // Real-time validation for phone
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('blur', function() {
                if (this.value && !BnBPlug.security.validatePhone(this.value)) {
                    markInvalid(this);
                } else {
                    markValid(this);
                }
            });
        }
    }
    
    function processPayment() {
        BnBPlug.showLoading('Processing payment...');
        
        // Simulate payment processing
        setTimeout(() => {
            BnBPlug.hideLoading();
            
            // Generate booking ID
            const bookingId = `BP-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;
            bookingState.bookingData.bookingId = bookingId;
            
            // Update confirmation page
            updateElement('bookingId', bookingId);
            if (bookingState.property) {
                updateElement('bookingProperty', bookingState.property.title);
            }
            
            // Go to confirmation step
            goToStep(3);
            
            // Save booking to localStorage (simulating backend)
            saveBookingToStorage();
            
            BnBPlug.showNotification('Booking confirmed successfully!', 'success');
        }, 2000);
    }
    
    function saveBookingToStorage() {
        const bookings = JSON.parse(localStorage.getItem('bnbplug_bookings') || '[]');
        bookings.push({
            id: bookingState.bookingData.bookingId,
            propertyId: bookingState.property?.id,
            ...bookingState.bookingData,
            date: new Date().toISOString(),
            status: 'confirmed'
        });
        
        localStorage.setItem('bnbplug_bookings', JSON.stringify(bookings));
    }
    
    function updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }
    
    // Event listeners for price calculation
    const checkinInput = document.getElementById('checkinDate');
    const checkoutInput = document.getElementById('checkoutDate');
    const guestSelect = document.getElementById('guestCount');
    
    if (checkinInput) {
        checkinInput.addEventListener('change', function() {
            bookingState.bookingData.checkin = this.value;
            calculatePrice();
        });
    }
    
    if (checkoutInput) {
        checkoutInput.addEventListener('change', function() {
            bookingState.bookingData.checkout = this.value;
            calculatePrice();
        });
    }
    
    if (guestSelect) {
        guestSelect.addEventListener('change', function() {
            bookingState.bookingData.guests = this.value;
            calculatePrice();
        });
    }
});
