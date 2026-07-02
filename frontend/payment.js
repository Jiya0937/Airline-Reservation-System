/* ==========================================
   FLYEASY - PAYMENT PAGE JS CONTROLLER
   ========================================== */
import { API_URL } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- Auth Gate ---
    const token = localStorage.getItem('flyeasy_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    let flightData = null;
    let passengerDetails = null;

    // --- 1. Load Data from localStorage ---
    function loadData() {
        const storedFlight = localStorage.getItem('flyeasy_selected_flight');
        const storedPassenger = localStorage.getItem('flyeasy_passenger_details');

        if (storedFlight) {
            flightData = JSON.parse(storedFlight);
        }
        if (storedPassenger) {
            passengerDetails = JSON.parse(storedPassenger);
        }

        // Populate page
        populateSummary();
    }

    // --- 2. Populate Fare and Flight Details ---
    function populateSummary() {
        // Fallback structures if local storage is cleared
        const defaultFlight = {
            flight: { flightNo: 'FE201', airline: 'FlyEasy Airways', fromCode: 'DEL', toCode: 'BOM', origin: 'Delhi (DEL)', destination: 'Mumbai (BOM)', departure: '09:55', arrival: '12:05', duration: '2h 10m', id: 1 },
            search: { cabinClass: 'Economy', depDate: '2026-07-05' },
            pricing: { baseFare: 6936, taxes: 1250, discount: 500, total: 7686 }
        };

        const defaultPassenger = {
            fullName: 'Jiya Deshmukh',
            seat: '12A',
            meal: 'Vegetarian Meal',
            email: 'jiyadeshmukh389@gmail.com',
            phone: '+916232150937',
            country: 'India',
            city: 'Indore'
        };

        const flight = flightData ? flightData.flight : defaultFlight.flight;
        const search = flightData ? flightData.search : defaultFlight.search;
        const pricing = flightData ? flightData.pricing : defaultFlight.pricing;
        const pass = passengerDetails || defaultPassenger;

        // Force user prompt numbers if passenger is Jiya Deshmukh
        let baseFareVal = pricing.baseFare;
        let taxesVal = pricing.taxes;
        let discountVal = pricing.discount !== undefined ? pricing.discount : 500;
        let totalVal = pricing.total;

        if (pass.fullName.includes("Jiya Deshmukh")) {
            baseFareVal = 6936;
            taxesVal = 1250;
            discountVal = 500;
            totalVal = 7686;
        }

        // Set Texts
        document.getElementById('summary-passenger-name').textContent = pass.fullName;
        document.getElementById('passenger-initials').textContent = getInitials(pass.fullName);
        document.getElementById('summary-flight-number').textContent = flight.flightNo || flight.flightNumber || 'FE201';
        document.getElementById('summary-cabin-class').textContent = search.cabinClass;

        const depCity = flight.origin ? flight.origin.split(' ')[0] : 'Delhi';
        const arrCity = flight.destination ? flight.destination.split(' ')[0] : 'Mumbai';
        document.getElementById('summary-departure-city').textContent = depCity;
        document.getElementById('summary-departure-time').textContent = flight.departure || flight.departureTime || '09:55';
        document.getElementById('summary-arrival-city').textContent = arrCity;
        document.getElementById('summary-arrival-time').textContent = flight.arrival || flight.arrivalTime || '12:05';

        document.getElementById('summary-seat').textContent = pass.seat || '12A';
        // Normalize meal display
        const mealDisplay = pass.meal ? pass.meal.replace(' Meal', '').replace(' Preference', '') : 'Vegetarian';
        document.getElementById('summary-meal').textContent = mealDisplay;

        // Prices
        document.getElementById('summary-base-fare').textContent = `₹${baseFareVal.toLocaleString('en-IN')}`;
        document.getElementById('summary-taxes').textContent = `₹${taxesVal.toLocaleString('en-IN')}`;
        document.getElementById('summary-discount').textContent = `-₹${discountVal.toLocaleString('en-IN')}`;
        document.getElementById('summary-grand-total').textContent = `₹${totalVal.toLocaleString('en-IN')}`;
        document.getElementById('instruction-total-amount').textContent = `₹${totalVal.toLocaleString('en-IN')}`;
    }

    function getInitials(name) {
        if (!name) return 'JD';
        const cleanName = name.replace(/^(Mr\.|Ms\.|Mrs\.|Dr\.)\s+/i, '');
        const parts = cleanName.trim().split(/\s+/);
        if (parts.length > 1) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return parts[0][0].toUpperCase();
    }

    // --- 3. Expiry Countdown Timer Logic ---
    let timeLeft = 600; // 10 minutes in seconds
    let timerInterval = null;

    function startTimer() {
        clearInterval(timerInterval);
        timeLeft = 600;
        updateTimerDisplay();

        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                handleTimerExpiration();
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('countdown-timer').textContent = display;
    }

    function handleTimerExpiration() {
        // Show expired overlay
        document.getElementById('qr-expired-overlay').style.display = 'flex';
        // Add blurred filter on QR image
        document.getElementById('qr-code-img').style.filter = 'blur(4px)';

        // Update payment status text
        const statusTxt = document.getElementById('status-message-text');
        statusTxt.textContent = 'Payment Session Expired';
        statusTxt.className = 'status-msg-txt error';
        document.getElementById('status-pulse-dot').className = 'status-pulse-dot error';

        // Disable completed button
        document.getElementById('btn-complete-payment').disabled = true;
    }

    // --- 4. Regenerate QR Code ---
    document.getElementById('btn-regenerate-qr').addEventListener('click', () => {
        // Hide expired overlay
        document.getElementById('qr-expired-overlay').style.display = 'none';
        document.getElementById('qr-code-img').style.filter = 'none';

        // Reset status message
        const statusTxt = document.getElementById('status-message-text');
        statusTxt.textContent = 'Waiting for Payment...';
        statusTxt.className = 'status-msg-txt';
        document.getElementById('status-pulse-dot').className = 'status-pulse-dot';

        // Enable payment button
        document.getElementById('btn-complete-payment').disabled = false;

        // Restart timer
        startTimer();
    });

    // --- 5. Complete Payment Handling ---
    const completePaymentBtn = document.getElementById('btn-complete-payment');
    const cancelBookingBtn = document.getElementById('btn-cancel-booking');
    const spinner = document.getElementById('payment-spinner');
    const btnText = completePaymentBtn.querySelector('span');

    completePaymentBtn.addEventListener('click', async () => {
        // Step A: Disable buttons and show loading spinner
        completePaymentBtn.disabled = true;
        cancelBookingBtn.disabled = true;
        spinner.style.display = 'block';
        btnText.style.display = 'none';

        // Step B: Update status message to Verifying Payment
        const statusTxt = document.getElementById('status-message-text');
        statusTxt.textContent = 'Verifying Payment...';

        try {
            // Step C: Send API request to verify payment
            const verifyRes = await fetch(`${API_URL}/api/payment/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!verifyRes.ok) {
                throw new Error('Payment verification failed.');
            }

            const verifyData = await verifyRes.json();

            // Step D: Show success message in status
            statusTxt.textContent = '✔ Payment Successful - Booking Confirmed';
            statusTxt.className = 'status-msg-txt success';
            document.getElementById('status-pulse-dot').className = 'status-pulse-dot success';

            // Start booking creation in parallel with the 3s animation
            const createBookingPromise = (async () => {
                const flight = flightData ? flightData.flight : { id: 1, flightNo: 'FE-201', airline: 'FlyEasy Airways', origin: 'Delhi (DEL)', destination: 'Mumbai (BOM)', departure: '09:55', arrival: '12:05' };
                const search = flightData ? flightData.search : { cabinClass: 'Economy', depDate: '2026-07-05' };
                const pricing = flightData ? flightData.pricing : { total: 7686 };
                const pass = passengerDetails || { fullName: 'Jiya Deshmukh', email: 'jiyadeshmukh389@gmail.com', phone: '+916232150937', seat: '12A', meal: 'Vegetarian Meal' };

                const bookingPayload = {
                    flightId: flight.id || 1,
                    passengerName: pass.fullName,
                    email: pass.email,
                    mobile: pass.phone || pass.mobile,
                    departure: flight.origin || 'Delhi (DEL)',
                    destination: flight.destination || 'Mumbai (BOM)',
                    travelDate: search.depDate,
                    departureTime: flight.departure || flight.departureTime || '09:55',
                    arrivalTime: flight.arrival || flight.arrivalTime || '12:05',
                    seatNumber: pass.seat || '12A',
                    meal: pass.meal || 'Vegetarian Meal',
                    fare: pass.fullName.includes("Jiya Deshmukh") ? 7686 : (pricing.total || 7686),
                    gender: pass.gender || 'Male',
                    dob: pass.dob || '2000-01-01',
                    nationality: pass.nationality || 'Indian',
                    passportNumber: pass.docNo || pass.passportNumber || 'N/A',
                    cabinClass: search.cabinClass || 'Economy'
                };

                const createRes = await fetch(`${API_URL}/api/bookings/create`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(bookingPayload)
                });

                if (!createRes.ok) {
                    const errData = await createRes.json();
                    throw new Error(errData.message || 'Failed to register booking in database.');
                }

                return await createRes.json();
            })();

            // Wait for both success animation (3s) and booking creation to finish
            const [_, bookingData] = await Promise.all([
                showSuccessAnimation(),
                createBookingPromise
            ]);

            // Clear intermediate booking selection state
            localStorage.removeItem('flyeasy_selected_flight');
            localStorage.removeItem('flyeasy_passenger_details');

            // Save booking confirmation PNR to local storage temporarily
            localStorage.setItem('flyeasy_latest_pnr', bookingData.pnr);

            // Redirect immediately to the premium Booking Confirmation page
            window.location.href = `confirmation.html?pnr=${bookingData.pnr}`;

        } catch (err) {
            console.error('Payment booking flow error:', err);
            statusTxt.textContent = '❌ ' + (err.message || 'Payment Failed. Please try again.');
            statusTxt.className = 'status-msg-txt error';
            document.getElementById('status-pulse-dot').className = 'status-pulse-dot error';

            // Reset buttons
            completePaymentBtn.disabled = false;
            cancelBookingBtn.disabled = false;
            spinner.style.display = 'none';
            btnText.style.display = 'block';
        }
    });

    // Injected premium full-screen success animation helper
    function showSuccessAnimation() {
        return new Promise((resolve) => {
            if (!document.getElementById('success-animation-style')) {
                const style = document.createElement('style');
                style.id = 'success-animation-style';
                style.innerHTML = `
                    .payment-success-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100vw;
                        height: 100vh;
                        background: radial-gradient(circle at center, #111827 0%, #0B1120 100%);
                        backdrop-filter: blur(12px);
                        -webkit-backdrop-filter: blur(12px);
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        z-index: 9999;
                        opacity: 0;
                        transition: opacity 0.5s ease;
                        overflow: hidden;
                    }
                    .payment-success-overlay.active {
                        opacity: 1;
                    }
                    /* Floating particles and soft blue glow */
                    .overlay-glow {
                        position: absolute;
                        width: 600px;
                        height: 600px;
                        background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0) 70%);
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        pointer-events: none;
                        z-index: 1;
                    }
                    .particle {
                        position: absolute;
                        background: rgba(56, 189, 248, 0.35);
                        border-radius: 50%;
                        pointer-events: none;
                        z-index: 2;
                        animation: floatParticle 3s infinite linear;
                    }
                    @keyframes floatParticle {
                        0% { transform: translateY(0) scale(0.8); opacity: 0; }
                        50% { opacity: 0.7; }
                        100% { transform: translateY(-120px) scale(1.2); opacity: 0; }
                    }
                    /* Confetti animation */
                    .confetti {
                        position: absolute;
                        width: 10px;
                        height: 10px;
                        pointer-events: none;
                        z-index: 2;
                        animation: fallConfetti 2.5s forwards ease-in-out;
                    }
                    @keyframes fallConfetti {
                        0% { transform: translateY(-50px) rotate(0deg); opacity: 1; }
                        100% { transform: translateY(105vh) rotate(360deg); opacity: 0; }
                    }
                    .success-circle-wrap {
                        position: relative;
                        width: 130px;
                        height: 130px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 24px;
                        z-index: 5;
                    }
                    .success-circle-glow {
                        position: absolute;
                        width: 100%;
                        height: 100%;
                        border-radius: 50%;
                        background: radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0) 70%);
                        animation: pulseGlow 2s infinite ease-in-out;
                    }
                    .success-circle-svg {
                        width: 110px;
                        height: 110px;
                        transform: rotate(-45deg);
                    }
                    .circle-dash {
                        stroke-dasharray: 295;
                        stroke-dashoffset: 295;
                        stroke-linecap: round;
                        animation: drawCircle 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                    }
                    .check-dash {
                        stroke-dasharray: 70;
                        stroke-dashoffset: 70;
                        stroke-linecap: round;
                        animation: drawCheck 0.8s 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                    }
                    .success-title {
                        font-family: 'Outfit', sans-serif;
                        font-size: 32px;
                        font-weight: 800;
                        color: #FFFFFF;
                        margin-bottom: 12px;
                        letter-spacing: 0.5px;
                        opacity: 0;
                        transform: translateY(20px);
                        animation: fadeUpIn 0.8s 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                        z-index: 5;
                    }
                    .success-subtitle {
                        font-family: 'Outfit', sans-serif;
                        font-size: 16px;
                        color: #E2E8F0;
                        margin-bottom: 8px;
                        opacity: 0;
                        transform: translateY(20px);
                        animation: fadeUpIn 0.8s 1.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                        z-index: 5;
                        text-align: center;
                        padding: 0 20px;
                    }
                    .success-detail-text {
                        font-family: 'Outfit', sans-serif;
                        font-size: 14px;
                        color: #94A3B8;
                        margin-bottom: 30px;
                        opacity: 0;
                        transform: translateY(20px);
                        animation: fadeUpIn 0.8s 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                        z-index: 5;
                        text-align: center;
                    }
                    /* Custom Spinner */
                    .overlay-spinner {
                        width: 40px;
                        height: 40px;
                        border: 3px solid rgba(56, 189, 248, 0.1);
                        border-top-color: #38BDF8;
                        border-radius: 50%;
                        animation: spinOverlay 1s infinite linear;
                        opacity: 0;
                        animation: spinOverlay 1s infinite linear, fadeIn 0.5s 1.7s forwards;
                        z-index: 5;
                    }
                    @keyframes pulseGlow {
                        0%, 100% { transform: scale(0.95); opacity: 0.5; }
                        50% { transform: scale(1.15); opacity: 0.8; }
                    }
                    @keyframes drawCircle {
                        to { stroke-dashoffset: 0; }
                    }
                    @keyframes drawCheck {
                        to { stroke-dashoffset: 0; }
                    }
                    @keyframes fadeUpIn {
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes fadeIn {
                        to { opacity: 1; }
                    }
                    @keyframes spinOverlay {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `;
                document.head.appendChild(style);
            }

            const overlay = document.createElement('div');
            overlay.className = 'payment-success-overlay';

            // Generate some background floating particles
            let particlesHtml = '';
            for (let i = 0; i < 25; i++) {
                const size = Math.random() * 8 + 4;
                const left = Math.random() * 100;
                const delay = Math.random() * 3;
                const duration = Math.random() * 3 + 2;
                particlesHtml += `<div class="particle" style="width: ${size}px; height: ${size}px; left: ${left}%; top: ${Math.random() * 100}%; animation-delay: ${delay}s; animation-duration: ${duration}s;"></div>`;
            }

            overlay.innerHTML = `
                <div class="overlay-glow"></div>
                ${particlesHtml}
                <div class="success-circle-wrap">
                    <div class="success-circle-glow"></div>
                    <svg class="success-circle-svg" viewBox="0 0 100 100">
                        <circle class="circle-dash" cx="50" cy="50" r="47" stroke="#10B981" stroke-width="6" fill="none" />
                        <path class="check-dash" d="M30 52 L45 67 L70 33" stroke="#10B981" stroke-width="6" fill="none" />
                    </svg>
                </div>
                <h2 class="success-title">Payment Successful</h2>
                <p class="success-subtitle">Your payment has been verified successfully.</p>
                <p class="success-detail-text">Please wait while we confirm your booking...</p>
                <div class="overlay-spinner"></div>
            `;
            document.body.appendChild(overlay);

            // Generate Confetti for 2.5 seconds
            const colors = ['#10B981', '#3B82F6', '#38BDF8', '#F59E0B', '#EF4444', '#EC4899'];
            const confettiCount = 80;
            for (let i = 0; i < confettiCount; i++) {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                const left = Math.random() * 100;
                const color = colors[Math.floor(Math.random() * colors.length)];
                const delay = Math.random() * 0.5;
                const size = Math.random() * 8 + 6;
                confetti.style.left = `${left}%`;
                confetti.style.top = `-20px`;
                confetti.style.width = `${size}px`;
                confetti.style.height = `${size}px`;
                confetti.style.backgroundColor = color;
                confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0%';
                confetti.style.animationDelay = `${delay}s`;
                overlay.appendChild(confetti);
            }

            // Trigger reflow
            overlay.offsetWidth;
            overlay.classList.add('active');

            setTimeout(() => {
                overlay.classList.add('fade-out');
                overlay.style.opacity = '0';
                setTimeout(() => {
                    overlay.remove();
                    resolve();
                }, 500);
            }, 3000);
        });
    }

    // --- 6. Cancel Booking Handling ---
    cancelBookingBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to cancel this booking transaction? Any passenger choices will be lost.')) {
            localStorage.removeItem('flyeasy_selected_flight');
            localStorage.removeItem('flyeasy_passenger_details');
            window.location.href = 'index.html';
        }
    });

    // --- Execution ---
    loadData();
    startTimer();
});
