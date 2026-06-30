/* ==========================================
   FLYEASY - PASSENGER DETAILS PAGE JS CONTROLLER
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- Auth Gate ---
    const token = localStorage.getItem('flyeasy_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    let bookingData = null;

    // --- 1. Load Selection Data from localStorage ---
    function loadBookingData() {
        const stored = localStorage.getItem('flyeasy_selected_flight');
        if (stored) {
            bookingData = JSON.parse(stored);
        } else {
            // Redirect back to home if no flight is selected
            window.location.href = 'index.html';
        }
    }

    // Inline SVGs for Airline Logos
    function getAirlineLogoSVG(airlineName) {
        if (airlineName.includes("FlyEasy")) {
            return `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="action-icon">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
        } else if (airlineName.includes("Air India")) {
            return `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon" style="color: #E11D48">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" stroke-linecap="round"/>
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke-linecap="round"/>
                </svg>
            `;
        } else if (airlineName.includes("IndiGo")) {
            return `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon" style="color: #3B82F6">
                    <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" stroke-linecap="round"/>
                    <circle cx="12" cy="12" r="3" fill="currentColor"/>
                </svg>
            `;
        } else if (airlineName.includes("Emirates")) {
            return `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon" style="color: #D97706">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke-linecap="round"/>
                    <line x1="4" y1="22" x2="4" y2="15" stroke-linecap="round"/>
                </svg>
            `;
        } else if (airlineName.includes("Vistara")) {
            return `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon" style="color: #8B5CF6">
                    <polygon points="12 2 2 22 22 22" stroke-linejoin="round"/>
                    <line x1="12" y1="2" x2="12" y2="22"/>
                </svg>
            `;
        } else {
            return `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
            `;
        }
    }

    // Format Date string
    function formatDateFull(dateStr) {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const dayOfWeek = days[date.getDay()];
        const day = date.getDate();
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = months[date.getMonth()];
        return `${dayOfWeek}, ${day} ${month} ${date.getFullYear()}`;
    }

    // --- 2. Populate Fare Review Card (Sidebar) ---
    function renderCheckoutSummary() {
        if (!bookingData) return;

        const flight = bookingData.flight;
        const search = bookingData.search;
        const pricing = bookingData.pricing;

        // Set text
        document.getElementById('checkout-airline-logo').innerHTML = getAirlineLogoSVG(flight.airline);
        document.getElementById('checkout-airline-name').textContent = flight.airline;
        document.getElementById('checkout-flight-number').textContent = flight.flightNo;
        document.getElementById('checkout-dep-time').textContent = flight.departure;
        document.getElementById('checkout-dep-code').textContent = flight.fromCode;
        document.getElementById('checkout-arr-time').textContent = flight.arrival;
        document.getElementById('checkout-arr-code').textContent = flight.toCode;
        document.getElementById('checkout-duration').textContent = flight.duration;
        document.getElementById('checkout-cabin-class').textContent = search.cabinClass;
        document.getElementById('checkout-travel-date').textContent = formatDateFull(search.depDate);

        // Prices
        document.getElementById('checkout-base-fare').textContent = `₹${pricing.baseFare.toLocaleString('en-IN')}`;
        document.getElementById('checkout-taxes').textContent = `₹${pricing.taxes.toLocaleString('en-IN')}`;
        document.getElementById('checkout-total-fare').textContent = `₹${pricing.total.toLocaleString('en-IN')}`;
    }

    // --- 3. Form Submission handler ---
    const form = document.getElementById('passenger-info-form');
    const successModal = document.getElementById('success-booking-modal');
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Retrieve values
        const title = document.getElementById('p1-title').value;
        const first = document.getElementById('p1-first').value.trim();
        const last = document.getElementById('p1-last').value.trim();
        const email = document.getElementById('contact-email').value.trim();
        
        const fullName = `${title}. ${first} ${last}`;
        const flight = bookingData.flight;
        
        // Generate mock PNR Reference code (e.g. FE + 4 uppercase hex/digits)
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let randomChars = '';
        for (let i = 0; i < 4; i++) {
            randomChars += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        const pnr = `FE${randomChars}`;

        // Populate Success card details
        document.getElementById('success-flight-no').textContent = flight.flightNo;
        document.getElementById('success-route').innerHTML = `${flight.fromCode} &rarr; ${flight.toCode}`;
        document.getElementById('success-passenger-name').textContent = fullName;
        document.getElementById('success-pnr').textContent = pnr;

        // Show modal overlay
        successModal.classList.add('active');
    });

    // --- 4. Return to Homepage click handler ---
    document.getElementById('btn-return-home').addEventListener('click', () => {
        // Clean bookings and redirect
        localStorage.removeItem('flyeasy_selected_flight');
        window.location.href = 'index.html';
    });

    // --- 5. Fetch and Auto-fill User Profile Data ---
    async function loadUserProfileData() {
        try {
            const response = await fetch('http://localhost:5000/api/auth/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('flyeasy_token');
                    localStorage.removeItem('flyeasy_user');
                    window.location.href = 'login.html';
                    return;
                }
                throw new Error('Failed to fetch profile details.');
            }

            const user = await response.json();
            
            // Auto-fill values
            document.getElementById('contact-email').value = user.email || '';
            document.getElementById('contact-phone').value = user.mobile || '';
            document.getElementById('contact-country').value = user.country || '';
            document.getElementById('contact-city').value = user.city || '';

            // Split full name into first and last name inputs
            if (user.fullName) {
                const parts = user.fullName.trim().split(/\s+/);
                if (parts.length > 0) {
                    document.getElementById('p1-first').value = parts[0];
                    if (parts.length > 1) {
                        document.getElementById('p1-last').value = parts.slice(1).join(' ');
                    }
                }
            }
        } catch (err) {
            console.error('Error fetching user profile for checkout:', err);
        }
    }

    // --- Execution ---
    loadBookingData();
    renderCheckoutSummary();
    loadUserProfileData();
});
