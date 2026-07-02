/* ==========================================
   FLYEASY - PASSENGER DETAILS PAGE JS CONTROLLER
   ========================================== */
import { API_URL } from './config.js';

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
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Retrieve values
        const title = document.getElementById('p1-title').value;
        const first = document.getElementById('p1-first').value.trim();
        const last = document.getElementById('p1-last').value.trim();
        const gender = document.getElementById('p1-gender').value;
        const dob = document.getElementById('p1-dob').value;
        const nationality = document.getElementById('p1-nationality').value.trim();
        const docNo = document.getElementById('p1-doc-no').value.trim();
        const seat = document.getElementById('p1-seat').value;
        const meal = document.getElementById('p1-meal').value;
        const wheelchair = document.getElementById('pref-wheelchair').checked;

        const email = document.getElementById('contact-email').value.trim();
        const phone = document.getElementById('contact-phone').value.trim();
        const country = document.getElementById('contact-country').value.trim();
        const city = document.getElementById('contact-city').value.trim();

        const passengerDetails = {
            title,
            first,
            last,
            fullName: `${title}. ${first} ${last}`,
            gender,
            dob,
            nationality,
            docNo,
            seat,
            meal,
            wheelchair,
            email,
            phone,
            country,
            city
        };

        // Save to localStorage
        localStorage.setItem('flyeasy_passenger_details', JSON.stringify(passengerDetails));

        // Redirect to payment page
        window.location.href = 'payment.html';
    });

    // --- 5. Fetch and Auto-fill User Profile Data ---
    async function loadUserProfileData() {
        try {
            const response = await fetch(`${API_URL}/api/auth/profile`, {
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
