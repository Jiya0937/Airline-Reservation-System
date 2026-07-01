/* ==========================================
   FLYEASY - PASSENGER DASHBOARD JS CONTROLLER
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- Auth Gate ---
    const token = localStorage.getItem('flyeasy_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // --- 1. Tab Switching Functionality ---
    const tabButtons = document.querySelectorAll('.dash-tab');
    const sections = document.querySelectorAll('.dashboard-section');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    function switchTab(tabName) {
        // Update tab buttons
        tabButtons.forEach(b => {
            if (b.getAttribute('data-tab') === tabName) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });

        // Update sections
        sections.forEach(s => {
            if (s.id === `sec-${tabName}`) {
                s.classList.add('active');
            } else {
                s.classList.remove('active');
            }
        });
    }

    // --- 2. Handle URL parameters or hashes for routing ---
    function handleUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        const hash = window.location.hash.substring(1);

        if (tab && ['checkin', 'trips', 'rewards'].includes(tab)) {
            switchTab(tab);
        } else if (hash && ['checkin', 'trips', 'rewards'].includes(hash)) {
            switchTab(hash);
        }
    }

    // Wire up header links
    document.getElementById('nav-trips-link').addEventListener('click', (e) => {
        e.preventDefault();
        switchTab('trips');
    });
    document.getElementById('nav-checkin-link').addEventListener('click', (e) => {
        e.preventDefault();
        switchTab('checkin');
    });
    document.getElementById('nav-rewards-link').addEventListener('click', (e) => {
        e.preventDefault();
        switchTab('rewards');
    });

    // --- 3. Format Date string helper ---
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

    function formatDateShort(dateStr) {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const day = date.getDate();
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = months[date.getMonth()];
        return `${day} ${month} ${date.getFullYear()}`;
    }

    // --- 4. Fetch and Render Upcoming Journey ---
    async function loadUpcomingJourney() {
        const container = document.getElementById('upcoming-container');
        try {
            const response = await fetch('http://localhost:5000/api/bookings/user', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load check-in details.');
            }

            const bookings = await response.json();
            const confirmedBookings = bookings.filter(b => b.booking_status === 'Confirmed');

            if (confirmedBookings.length === 0) {
                // Show no booking message
                container.innerHTML = `
                    <div class="no-bookings-card glassmorphism" style="grid-column: 1 / -1;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon">
                            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                        </svg>
                        <h3>No Upcoming Confirmed Journeys</h3>
                        <p>Ready to fly? Book your next destination with FlyEasy.</p>
                        <a href="index.html" class="btn btn-primary">Search Flights Now</a>
                    </div>
                `;
                return;
            }

            container.innerHTML = '';
            confirmedBookings.forEach(booking => {
                const bookingId = booking.booking_id;
                const pnr = booking.pnr;
                const passengerName = booking.passenger_name;
                const airlineName = booking.airline || 'FlyEasy Airways';
                const flightNumber = booking.flight_number || 'FE201';
                const aircraft = booking.aircraft || 'Airbus A350-900';
                const fromAirport = booking.departure;
                const toAirport = booking.destination;
                const departureDate = formatDateFull(booking.travel_date);
                const departureTime = booking.departure_time;
                const arrivalTime = booking.arrival_time;
                const seatNumber = booking.seat_number || '12A';
                
                // Determine terminal and gate
                const digits = flightNumber.replace(/\D/g, '') || '201';
                const gateNum = (parseInt(digits) % 15) + 1;
                const fallbackTerminal = ((parseInt(digits) % 2) + 1).toString();
                const terminal = booking.terminal || fallbackTerminal;
                const gate = booking.gate || `B${gateNum}`;
                
                const cabinClass = booking.cabin_class || 'Economy';
                const bookingStatus = booking.booking_status || 'Confirmed';
                const paymentStatus = booking.payment_status || 'Paid';
                const meal = booking.meal ? booking.meal.replace(' Meal', '').replace(' Preference', '') : 'Vegetarian';
                
                const isCheckedIn = localStorage.getItem(`flyeasy_checked_in_${pnr}`) === 'true';
                const statusTxt = isCheckedIn ? 'Checked-in' : bookingStatus;
                
                // Only show download button if Confirmed and Paid
                const canDownload = bookingStatus === 'Confirmed' && paymentStatus === 'Paid';
                const downloadBtnHtml = canDownload 
                    ? `<button class="btn btn-outline btn-download-ticket" onclick="downloadTicketFile('${pnr}', '${booking.ticket_pdf_path}')">
                           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px; height:16px;">
                               <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                               <polyline points="7 10 12 15 17 10"></polyline>
                               <line x1="12" y1="15" x2="12" y2="3"></line>
                           </svg>
                           <span>Download Ticket</span>
                       </button>` 
                    : '';

                container.innerHTML += `
                    <div class="upcoming-journey-card glassmorphism">
                        <div class="journey-top-row">
                            <div class="journey-airline-info">
                                <span class="airline-badge">${airlineName}</span>
                                <span class="flight-num-txt">${flightNumber} &bull; ${aircraft}</span>
                            </div>
                            <div>
                                <span class="pnr-txt">PNR: ${pnr}</span>
                            </div>
                        </div>

                        <div class="journey-route-block">
                            <div class="route-node">
                                <span class="route-lbl">From</span>
                                <span class="route-city-name">${fromAirport}</span>
                                <span class="route-time-val">${departureTime}</span>
                            </div>
                            
                            <div class="journey-arrow-connector">
                                <div class="connector-line-solid"></div>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="connector-plane-icon">
                                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                                </svg>
                            </div>

                            <div class="route-node text-right">
                                <span class="route-lbl">To</span>
                                <span class="route-city-name">${toAirport}</span>
                                <span class="route-time-val">${arrivalTime}</span>
                            </div>
                        </div>

                        <div class="journey-details-grid">
                            <div class="journey-detail-item">
                                <span class="item-lbl">Passenger</span>
                                <span class="item-val">${passengerName}</span>
                            </div>
                            <div class="journey-detail-item">
                                <span class="item-lbl">Booking ID</span>
                                <span class="item-val">#${bookingId}</span>
                            </div>
                            <div class="journey-detail-item">
                                <span class="item-lbl">Departure Date</span>
                                <span class="item-val" style="font-size:12px;">${departureDate}</span>
                            </div>
                            <div class="journey-detail-item">
                                <span class="item-lbl">Seat</span>
                                <span class="item-val">${seatNumber}</span>
                            </div>
                            <div class="journey-detail-item">
                                <span class="item-lbl">Terminal / Gate</span>
                                <span class="item-val">${terminal} / ${gate}</span>
                            </div>
                            <div class="journey-detail-item">
                                <span class="item-lbl">Cabin Class</span>
                                <span class="item-val">${cabinClass}</span>
                            </div>
                            <div class="journey-detail-item">
                                <span class="item-lbl">Meal</span>
                                <span class="item-val">${meal}</span>
                            </div>
                            <div class="journey-detail-item">
                                <span class="item-lbl">Booking Status</span>
                                <span class="item-val">
                                    <span class="confirmed-badge">${statusTxt}</span>
                                </span>
                            </div>
                            <div class="journey-detail-item">
                                <span class="item-lbl">Payment Status</span>
                                <span class="item-val">
                                    <span class="confirmed-badge">${paymentStatus}</span>
                                </span>
                            </div>
                        </div>

                        <div class="journey-actions-row">
                            <button class="btn btn-primary btn-checkin" id="btn-checkin-${pnr}" onclick="checkInBooking('${pnr}')" ${isCheckedIn ? 'disabled' : ''}>
                                <span>${isCheckedIn ? 'Checked-in Successfully' : 'Check-in'}</span>
                            </button>
                            <button class="btn btn-outline btn-view-ticket" onclick="openBoardingPassModal('${pnr}')">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px; height:16px;">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                                <span>View Ticket</span>
                            </button>
                            ${downloadBtnHtml}
                        </div>
                    </div>
                `;
            });
        } catch (err) {
            console.error('Error loading checkin grid:', err);
        }
    }

    // --- 5. Simulate Check-in Action ---
    function simulateCheckIn(pnr) {
        const btn = document.getElementById('btn-checkin-action');
        btn.disabled = true;
        btn.querySelector('span').textContent = 'Checking in...';

        setTimeout(() => {
            localStorage.setItem(`flyeasy_checked_in_${pnr}`, 'true');
            btn.querySelector('span').textContent = 'Checked-in Successfully';
            
            // Update status badge
            document.getElementById('upcoming-status-val').innerHTML = `
                <span class="history-status-badge completed">Checked-in</span>
            `;

            alert(`Check-in successful for PNR: ${pnr}! Your boarding pass is now generated.`);
            // Reload all bookings table to reflect status change
            loadAllBookingsTable();
        }, 1500);
    }

    // --- 6. Fetch and Render History Grid (Recent Trips) ---
    async function loadTravelHistory() {
        const grid = document.getElementById('history-grid');
        try {
            const response = await fetch('http://localhost:5000/api/history', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch travel history.');
            }

            const history = await response.json();

            // Default mock travel history if DB yields nothing, matching exactly the user prompt examples
            const defaultHistory = [
                {
                    departure: 'Delhi (DEL)',
                    destination: 'Mumbai (BOM)',
                    travel_date: '2026-07-05',
                    flight_number: 'FE201',
                    fare: 7686,
                    booking_status: 'Completed'
                },
                {
                    departure: 'Mumbai (BOM)',
                    destination: 'Goa (GOI)',
                    travel_date: '2026-06-12',
                    flight_number: 'FE178',
                    fare: 5920,
                    booking_status: 'Completed'
                },
                {
                    departure: 'Indore (IDR)',
                    destination: 'Bangalore (BLR)',
                    travel_date: '2026-05-20',
                    flight_number: 'FE102',
                    fare: 4500,
                    booking_status: 'Cancelled'
                }
            ];

            const activeHistoryList = history.length > 0 ? history : defaultHistory;

            grid.innerHTML = '';
            activeHistoryList.forEach(trip => {
                const depCity = trip.departure.split(' ')[0];
                const arrCity = trip.destination.split(' ')[0];
                const travelDate = formatDateShort(trip.travel_date);
                const fareStr = trip.fare ? `₹${trip.fare.toLocaleString('en-IN')}` : 'N/A';
                
                let statusClass = 'history-status-badge completed';
                let statusText = 'Completed';
                
                if (trip.booking_status === 'Cancelled') {
                    statusClass = 'history-status-badge cancelled';
                    statusText = 'Cancelled';
                }

                grid.innerHTML += `
                    <div class="history-card">
                        <div class="history-top">
                            <span class="history-route">${depCity} &rarr; ${arrCity}</span>
                            <span class="${statusClass}">${statusText}</span>
                        </div>
                        <div class="history-mid">
                            <span>Date: ${travelDate}</span>
                            <span>Flight: ${trip.flight_number || 'FE201'}</span>
                        </div>
                        <div class="history-bottom">
                            <span class="history-fare">${statusText === 'Cancelled' ? 'Refunded' : fareStr}</span>
                        </div>
                    </div>
                `;
            });

        } catch (err) {
            console.error('Error loading history grid:', err);
        }
    }

    // --- 7. Fetch and Render Bookings Table ---
    async function loadAllBookingsTable() {
        const tbody = document.getElementById('bookings-table-body');
        try {
            const response = await fetch('http://localhost:5000/api/bookings/user', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load bookings.');
            }

            const bookings = await response.json();

            if (bookings.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center text-muted" style="padding: 40px 0;">No booking records found in database.</td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = '';
            bookings.forEach(bk => {
                const bookingId = bk.booking_id;
                const pnr = bk.pnr;
                const flight = bk.flight_number || 'FE-201';
                const route = `${bk.departure.split(' ')[0]} &rarr; ${bk.destination.split(' ')[0]}`;
                const travelDate = formatDateShort(bk.travel_date);
                const amount = `₹${bk.fare.toLocaleString('en-IN')}`;
                
                // Read checked in state
                const isCheckedIn = localStorage.getItem(`flyeasy_checked_in_${pnr}`) === 'true';
                
                let statusHtml = '';
                if (bk.booking_status === 'Cancelled') {
                    statusHtml = `<span class="table-status cancelled">Cancelled</span>`;
                } else if (isCheckedIn) {
                    statusHtml = `<span class="table-status confirmed" style="background: rgba(16,185,129,0.1); color: #10B981;">Checked-in</span>`;
                } else {
                    statusHtml = `<span class="table-status confirmed">Confirmed</span>`;
                }

                let actionsHtml = '';
                if (bk.booking_status === 'Cancelled') {
                    actionsHtml = `
                        <button class="action-link" onclick="viewTicketAlert('${pnr}')">View Detail</button>
                    `;
                } else {
                    actionsHtml = `
                        <button class="action-link" onclick="openBoardingPassModal('${pnr}')">Boarding Pass</button>
                        <button class="action-link" onclick="downloadTicketFile('${pnr}', '${bk.ticket_pdf_path}')">Download</button>
                        <button class="action-link cancel-link" onclick="cancelBookingClick('${pnr}')">Cancel</button>
                    `;
                }

                tbody.innerHTML += `
                    <tr>
                        <td><strong>#${bookingId}</strong></td>
                        <td style="color: var(--accent-sky); font-weight: 700;">${pnr}</td>
                        <td>${flight}</td>
                        <td class="table-route">${route}</td>
                        <td>${travelDate}</td>
                        <td><strong>${amount}</strong></td>
                        <td>${statusHtml}</td>
                        <td>
                            <div class="action-links">
                                ${actionsHtml}
                            </div>
                        </td>
                    </tr>
                `;
            });

        } catch (err) {
            console.error('Error loading bookings table:', err);
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted" style="color: #EF4444 !important; padding: 40px 0;">Error loading bookings.</td>
                </tr>
            `;
        }
    }

    // --- 8. Boarding Pass Modal Flow ---
    const bpModal = document.getElementById('boarding-pass-modal');
    const closeModalBtn = document.getElementById('btn-close-modal');
    const printBpBtn = document.getElementById('btn-print-boarding-pass');

    async function openBoardingPassModal(pnr) {
        try {
            const response = await fetch(`http://localhost:5000/api/boarding-pass/${pnr}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to retrieve boarding pass.');
            }

            const bp = await response.json();

            // Populate fields
            document.getElementById('bp-passenger').textContent = bp.passengerName;
            document.getElementById('bp-flight').textContent = bp.flightNumber;
            document.getElementById('bp-pnr').textContent = bp.pnr;
            document.getElementById('bp-seat').textContent = bp.seat;
            document.getElementById('bp-origin-city').textContent = bp.departure.split(' ')[0];
            document.getElementById('bp-dest-city').textContent = bp.destination.split(' ')[0];
            
            // Format time display
            const formatTime = (timeStr) => {
                if (!timeStr) return '';
                const parts = timeStr.split(':');
                const hour = parseInt(parts[0]);
                const min = parts[1];
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const displayHour = hour % 12 || 12;
                return `${displayHour}:${min} ${ampm}`;
            };

            document.getElementById('bp-dep-time').textContent = formatTime(bp.departureTime);
            document.getElementById('bp-arr-time').textContent = formatTime(bp.arrivalTime);
            
            document.getElementById('bp-terminal').textContent = bp.terminal;
            document.getElementById('bp-gate').textContent = bp.gate;
            document.getElementById('bp-boarding-time').textContent = bp.boardingTime;
            document.getElementById('bp-date').textContent = formatDateShort(bp.travelDate);
            
            // Set barcode text
            document.getElementById('bp-barcode-text').textContent = `${bp.pnr}${bp.seat}`.toUpperCase();

            // Open Modal
            bpModal.classList.add('active');

        } catch (err) {
            console.error('Error fetching boarding pass modal:', err);
            alert('Error loading boarding pass details. Please check connection.');
        }
    }

    // Expose functions globally to table buttons
    window.openBoardingPassModal = openBoardingPassModal;
    
    window.viewTicketAlert = function(pnr) {
        alert(`Booking reference #${pnr} is CANCELLED. A refund has been issued.`);
    };

    window.checkInBooking = function(pnr) {
        const btn = document.getElementById(`btn-checkin-${pnr}`);
        if (btn) {
            btn.disabled = true;
            btn.querySelector('span').textContent = 'Checking in...';
        }

        setTimeout(() => {
            localStorage.setItem(`flyeasy_checked_in_${pnr}`, 'true');
            if (btn) {
                btn.querySelector('span').textContent = 'Checked-in Successfully';
            }
            alert(`Check-in successful for PNR: ${pnr}! Your boarding pass is now ready.`);
            loadUpcomingJourney();
            loadAllBookingsTable();
        }, 1500);
    };
 
    window.downloadTicketFile = function(pnr, ticketPath) {
        if (!ticketPath) {
            alert("No generated ticket PDF path found on server.");
            return;
        }
        
        try {
            const url = `http://localhost:5000${ticketPath}`;
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.download = `FlyEasy_BoardingPass_${pnr}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Error downloading ticket PDF:', err);
            alert("Error downloading boarding pass.");
        }
    };

    window.cancelBookingClick = async function(pnr) {
        if (confirm(`Are you sure you want to CANCEL booking reference ${pnr}?\nThis will release your seat and issue a full refund.`)) {
            try {
                const response = await fetch('http://localhost:5000/api/bookings/cancel', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ pnr })
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.message || 'Failed to cancel booking.');
                }

                alert(`Booking PNR: ${pnr} has been successfully CANCELLED.`);
                
                // Clear checked-in status if it existed
                localStorage.removeItem(`flyeasy_checked_in_${pnr}`);

                // Reload layout
                loadUpcomingJourney();
                loadTravelHistory();
                loadAllBookingsTable();

            } catch (err) {
                console.error('Error cancelling booking:', err);
                alert(err.message || 'Error occurred while cancelling the flight.');
            }
        }
    };

    // Close Modal click
    closeModalBtn.addEventListener('click', () => {
        bpModal.classList.remove('active');
    });

    // Close Modal on click outside
    document.addEventListener('click', (e) => {
        if (e.target === bpModal) {
            bpModal.classList.remove('active');
        }
    });

    // Print boarding pass trigger
    printBpBtn.addEventListener('click', () => {
        window.print();
    });

    // --- 9. Logout Handling ---
    document.getElementById('btn-logout').addEventListener('click', () => {
        localStorage.removeItem('flyeasy_token');
        localStorage.removeItem('flyeasy_user');
        window.location.href = 'login.html';
    });

    // --- Execution ---
    handleUrlParams();
    loadUpcomingJourney();
    loadTravelHistory();
    loadAllBookingsTable();

    // Check if redirect has a custom PNR to open boarding pass immediately
    const latestPnr = localStorage.getItem('flyeasy_latest_pnr');
    if (latestPnr) {
        localStorage.removeItem('flyeasy_latest_pnr');
        // Let's open the boarding pass modal immediately to show successful booking e-ticket!
        setTimeout(() => {
            openBoardingPassModal(latestPnr);
        }, 800);
    }
});
