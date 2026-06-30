/* ==========================================
   FLYEASY - SEARCH RESULTS CONTROLLER
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- Auth Gate ---
    const token = localStorage.getItem('flyeasy_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // --- 1. Client-side Flight Database (At least 8 flights) ---
    const rawDummyFlights = [
        {
            airline: "FlyEasy Airways",
            flightNo: "FE 201",
            departure: "09:55",
            arrival: "12:05",
            duration: "2h 10m",
            stops: "Non-stop",
            price: 7236,
            originalPrice: 9045,
            seatsLeft: 8,
            refundable: true,
            badges: ["Recommended"]
        },
        {
            airline: "Air India",
            flightNo: "AI 302",
            departure: "11:20",
            arrival: "13:40",
            duration: "2h 20m",
            stops: "Non-stop",
            price: 6899,
            originalPrice: 8624,
            seatsLeft: 12,
            refundable: true,
            badges: ["Cheapest"]
        },
        {
            airline: "IndiGo",
            flightNo: "6E 701",
            departure: "14:15",
            arrival: "16:20",
            duration: "2h 05m",
            stops: "Non-stop",
            price: 5999,
            originalPrice: 7499,
            seatsLeft: 15,
            refundable: false,
            badges: ["Cheapest", "Fastest"]
        },
        {
            airline: "Emirates",
            flightNo: "EK 110",
            departure: "18:45",
            arrival: "21:00",
            duration: "2h 15m",
            stops: "Non-stop",
            price: 8999,
            originalPrice: 11249,
            seatsLeft: 4,
            refundable: true,
            badges: ["Recommended"]
        },
        {
            airline: "Vistara",
            flightNo: "UK 425",
            departure: "08:00",
            arrival: "10:15",
            duration: "2h 15m",
            stops: "Non-stop",
            price: 7650,
            originalPrice: 9563,
            seatsLeft: 9,
            refundable: true,
            badges: ["Recommended"]
        },
        {
            airline: "FlyEasy Airways",
            flightNo: "FE 205",
            departure: "16:30",
            arrival: "20:45",
            duration: "4h 15m",
            stops: "1 Stop (BLR)",
            price: 5499,
            originalPrice: 6874,
            seatsLeft: 5,
            refundable: true,
            badges: ["Cheapest"]
        },
        {
            airline: "Air India",
            flightNo: "AI 820",
            departure: "20:00",
            arrival: "22:15",
            duration: "2h 15m",
            stops: "Non-stop",
            price: 7100,
            originalPrice: 8875,
            seatsLeft: 14,
            refundable: true,
            badges: []
        },
        {
            airline: "Vistara",
            flightNo: "UK 902",
            departure: "22:30",
            arrival: "00:45",
            duration: "2h 15m",
            stops: "Non-stop",
            price: 7800,
            originalPrice: 9750,
            seatsLeft: 11,
            refundable: true,
            badges: []
        }
    ];

    // Airport Code mapping dictionary for realistic look
    const airportNames = {
        "DEL": "Indira Gandhi International Airport",
        "BOM": "Chhatrapati Shivaji Airport",
        "GOI": "Goa International Airport",
        "IDR": "Devi Ahilya Bai Holkar Airport",
        "BLR": "Kempegowda International Airport",
        "CCU": "Netaji Subhash Chandra Bose Airport",
        "MAA": "Chennai International Airport",
        "DXB": "Dubai International Airport",
        "SIN": "Singapore Changi Airport",
        "DPS": "Ngurah Rai Airport (Bali)",
        "MLE": "Velana Airport (Maldives)"
    };

    // Current State
    let searchParams = {};
    let activeFilters = new Set();
    let currentSort = 'recommended';
    let selectedFlight = null;
    let flightList = []; // Active list matching current filters & date
    let selectedCarouselDateStr = "";

    // Load initial parameters from localStorage
    function loadSearchParams() {
        const stored = localStorage.getItem('flyeasy_search');
        if (stored) {
            searchParams = JSON.parse(stored);
        } else {
            // Default params if none exists
            searchParams = {
                from: "Delhi (DEL)",
                to: "Mumbai (BOM)",
                depDate: "2026-07-01",
                retDate: "",
                passengers: 1,
                cabinClass: "Economy"
            };
            localStorage.setItem('flyeasy_search', JSON.stringify(searchParams));
        }
        selectedCarouselDateStr = searchParams.depDate;
    }

    // Helper: Parse Location input to extract City name and 3-letter IATA code
    function parseAirportString(str) {
        if (!str) return { name: "Unknown", code: "XXX" };
        const match = str.match(/(.*?)\s*(?:\((.*?)\))?$/);
        let name = str;
        let code = '';
        if (match) {
            name = match[1].trim();
            code = match[2] ? match[2].trim().toUpperCase() : name.substring(0, 3).toUpperCase();
        }
        return { name, code };
    }

    // Helper: Format Date String to short format (e.g. "1 Jul")
    function formatDateShort(dateStr) {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const day = date.getDate();
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = months[date.getMonth()];
        return `${day} ${month}`;
    }

    // Helper: Format Date to Day string (e.g. "Mon 1 Jul")
    function formatDateFull(dateStr) {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const dayOfWeek = days[date.getDay()];
        const day = date.getDate();
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = months[date.getMonth()];
        return `${dayOfWeek} ${day} ${month}`;
    }

    // Update the Nav bar and Header text with Dynamic Search Values
    function updateUIHeaders() {
        const fromInfo = parseAirportString(searchParams.from);
        const toInfo = parseAirportString(searchParams.to);
        
        // Update Nav Container
        document.getElementById('nav-route').innerHTML = `${fromInfo.name} &rarr; ${toInfo.name}`;
        document.getElementById('nav-date').textContent = formatDateShort(searchParams.depDate);
        document.getElementById('nav-passengers').textContent = `${searchParams.passengers} Passenger${searchParams.passengers > 1 ? 's' : ''}`;
        document.getElementById('nav-class').textContent = searchParams.cabinClass;

        // Update Main Heading
        document.getElementById('heading-from').textContent = fromInfo.name;
        document.getElementById('heading-to').textContent = toInfo.name;
    }

    // Generate 7-day carousel selectors starting from the departure date (centered or starting at depDate)
    function generateDateCarousel() {
        const track = document.getElementById('date-carousel-track');
        track.innerHTML = '';
        
        const baseDate = new Date(selectedCarouselDateStr || searchParams.depDate);
        // Start 3 days before to center the selected date, but ensure we don't go to the past if it's too early
        let startDate = new Date(baseDate);
        startDate.setDate(baseDate.getDate() - 3);
        
        // Ensure we don't display past dates compared to today's actual date
        const today = new Date();
        today.setHours(0,0,0,0);
        if (startDate < today) {
            startDate = new Date(today);
        }

        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"]; // Index matched
        
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const dateISO = currentDate.toISOString().split('T')[0];
            const isSelected = dateISO === searchParams.depDate;
            
            // Format labels
            const dayLabel = days[currentDate.getDay()];
            const dateLabel = `${currentDate.getDate()} ${currentDate.toLocaleString('default', { month: 'short' })}`;
            
            // Dynamic mock fare based on day of week and search criteria
            let mockFare = 5000 + (currentDate.getDay() * 350) + (currentDate.getDate() % 5 * 200);
            if (searchParams.cabinClass.includes('Business')) mockFare *= 2.5;
            if (searchParams.cabinClass.includes('First')) mockFare *= 4;

            const card = document.createElement('div');
            card.className = `date-card ${isSelected ? 'active' : ''}`;
            card.setAttribute('data-date', dateISO);
            card.innerHTML = `
                <div class="date-day">${dayLabel}</div>
                <div class="date-val">${dateLabel}</div>
                <div class="date-price">₹${Math.round(mockFare).toLocaleString('en-IN')}</div>
            `;
            
            card.addEventListener('click', () => {
                // Update selected date
                searchParams.depDate = dateISO;
                localStorage.setItem('flyeasy_search', JSON.stringify(searchParams));
                
                // Toggle active card styling
                document.querySelectorAll('.date-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                
                // Re-render
                updateUIHeaders();
                processAndRenderFlights();
            });
            
            track.appendChild(card);
        }
    }

    // Carousel Scrolling
    const carouselWrapper = document.getElementById('carousel-track-wrapper');
    document.getElementById('btn-carousel-prev').addEventListener('click', () => {
        carouselWrapper.scrollBy({ left: -200, behavior: 'smooth' });
    });
    document.getElementById('btn-carousel-next').addEventListener('click', () => {
        carouselWrapper.scrollBy({ left: 200, behavior: 'smooth' });
    });

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

    // Helper: parse duration ("2h 10m") into total minutes for sorting
    function durationToMinutes(durationStr) {
        const match = durationStr.match(/(?:(\d+)h)?\s*(?:(\d+)m)?/);
        if (!match) return 0;
        const hours = parseInt(match[1]) || 0;
        const mins = parseInt(match[2]) || 0;
        return (hours * 60) + mins;
    }

    // Helper: parse departure time ("09:55") into minutes from midnight for sorting
    function timeToMinutes(timeStr) {
        const parts = timeStr.split(':');
        return (parseInt(parts[0]) * 60) + parseInt(parts[1]);
    }

    // Process filters, sorting, and render the flight card markup
    function processAndRenderFlights() {
        const fromInfo = parseAirportString(searchParams.from);
        const toInfo = parseAirportString(searchParams.to);
        const cabin = searchParams.cabinClass;

        // Map and adjust flights dummy pricing/stops to match cabin choice
        let processedFlights = rawDummyFlights.map((f, index) => {
            let priceAdjusted = f.price;
            let origPriceAdjusted = f.originalPrice;

            if (cabin.includes("Premium Economy")) {
                priceAdjusted = Math.round(priceAdjusted * 1.3);
                origPriceAdjusted = Math.round(origPriceAdjusted * 1.3);
            } else if (cabin.includes("Business")) {
                priceAdjusted = Math.round(priceAdjusted * 2.5);
                origPriceAdjusted = Math.round(origPriceAdjusted * 2.5);
            } else if (cabin.includes("First")) {
                priceAdjusted = Math.round(priceAdjusted * 4.2);
                origPriceAdjusted = Math.round(origPriceAdjusted * 4.2);
            }

            // Adjust prices slightly based on departure day to simulate realistic live fare changes
            const depDateObj = new Date(searchParams.depDate);
            const dateOffset = (depDateObj.getDate() % 5) * 150 - 300;
            priceAdjusted += dateOffset;
            origPriceAdjusted += dateOffset;

            // Generate discount percentage
            const discPercent = Math.round(((origPriceAdjusted - priceAdjusted) / origPriceAdjusted) * 100);

            return {
                ...f,
                id: `flight-card-${index}`,
                price: priceAdjusted,
                originalPrice: origPriceAdjusted,
                discountPercent: discPercent > 0 ? discPercent : 20,
                fromCode: fromInfo.code,
                fromAirport: airportNames[fromInfo.code] || `${fromInfo.name} Airport`,
                toCode: toInfo.code,
                toAirport: airportNames[toInfo.code] || `${toInfo.name} Airport`
            };
        });

        // 1. FILTERING
        if (activeFilters.size > 0) {
            processedFlights = processedFlights.filter(f => {
                let keep = true;
                
                if (activeFilters.has('non-stop')) {
                    if (f.stops !== 'Non-stop' && f.stops !== 0) keep = false;
                }
                if (activeFilters.has('cheapest')) {
                    if (f.price > 6500 && !f.badges.includes('Cheapest')) keep = false;
                }
                if (activeFilters.has('morning')) {
                    const minutes = timeToMinutes(f.departure);
                    // Morning is 5:00 AM (300) to 12:00 PM (720)
                    if (minutes < 300 || minutes > 720) keep = false;
                }
                if (activeFilters.has('evening')) {
                    const minutes = timeToMinutes(f.departure);
                    // Evening is 5:00 PM (1020) to 11:59 PM (1439)
                    if (minutes < 1020 || minutes > 1440) keep = false;
                }
                if (activeFilters.has('business')) {
                    // Simulates filtering for premium aircrafts or tickets
                    if (f.airline !== 'Emirates' && f.airline !== 'Vistara') keep = false;
                }
                if (activeFilters.has('refundable')) {
                    if (!f.refundable) keep = false;
                }
                // Nearby chip serves as a mock toggler showing specific airports
                return keep;
            });
        }

        // 2. SORTING
        if (currentSort === 'price-low') {
            processedFlights.sort((a, b) => a.price - b.price);
        } else if (currentSort === 'fastest') {
            processedFlights.sort((a, b) => durationToMinutes(a.duration) - durationToMinutes(b.duration));
        } else if (currentSort === 'earliest') {
            processedFlights.sort((a, b) => timeToMinutes(a.departure) - timeToMinutes(b.departure));
        } else {
            // Recommended: Sort by badge or custom index weight
            processedFlights.sort((a, b) => {
                const aVal = a.badges.includes('Recommended') ? 2 : (a.badges.includes('Cheapest') ? 1 : 0);
                const bVal = b.badges.includes('Recommended') ? 2 : (b.badges.includes('Cheapest') ? 1 : 0);
                return bVal - aVal;
            });
        }

        flightList = processedFlights;
        renderFlightCards();
    }

    // Render cards list in DOM
    function renderFlightCards() {
        const container = document.getElementById('flight-cards-list');
        container.innerHTML = '';

        if (flightList.length === 0) {
            container.innerHTML = `
                <div class="empty-flights-card" style="text-align: center; padding: 40px; background: var(--card-bg-dark); border: 1px dashed rgba(255,255,255,0.1); border-radius: 16px;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; color: var(--text-gray-muted); margin-bottom: 16px;">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M8 12h8"/>
                    </svg>
                    <h3 style="font-size: 1.2rem; color: var(--text-white); margin-bottom: 8px;">No flights found</h3>
                    <p style="color: var(--text-gray-muted); font-size: 0.9rem;">Try selecting a different date or clearing some filter chips.</p>
                </div>
            `;
            return;
        }

        flightList.forEach((flight, index) => {
            const isSelected = selectedFlight && selectedFlight.id === flight.id;
            const card = document.createElement('div');
            card.className = `flight-card ${isSelected ? 'selected' : ''}`;
            card.id = flight.id;
            card.style.animationDelay = `${index * 0.08}s`;

            // Badge generator
            let badgesHtml = '';
            flight.badges.forEach(b => {
                const slug = b.toLowerCase();
                badgesHtml += `<span class="card-badge badge-${slug}">${b}</span>`;
            });

            card.innerHTML = `
                <div class="card-badges-container">
                    ${badgesHtml}
                </div>
                
                <!-- Left: Airline Logo & Flight code -->
                <div class="card-left-section">
                    <div class="airline-logo-box">
                        ${getAirlineLogoSVG(flight.airline)}
                    </div>
                    <div class="airline-info">
                        <span class="airline-name">${flight.airline}</span>
                        <span class="flight-number">${flight.flightNo}</span>
                    </div>
                </div>

                <!-- Center: Flight Path Timeline -->
                <div class="card-center-section">
                    <div class="route-info-node text-left">
                        <span class="route-time">${flight.departure}</span>
                        <span class="route-code">${flight.fromCode}</span>
                        <span class="route-airport" title="${flight.fromAirport}">${flight.fromAirport}</span>
                    </div>
                    
                    <div class="route-path-container">
                        <span class="path-duration">${flight.duration}</span>
                        <div class="path-line-wrapper">
                            <div class="path-line"></div>
                            <div class="path-plane-icon">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5L21 16z"/>
                                </svg>
                            </div>
                        </div>
                        <span class="path-stops ${flight.stops !== 'Non-stop' ? 'has-stops' : ''}">${flight.stops}</span>
                    </div>

                    <div class="route-info-node text-right" style="align-items: flex-end;">
                        <span class="route-time">${flight.arrival}</span>
                        <span class="route-code">${flight.toCode}</span>
                        <span class="route-airport" title="${flight.toAirport}">${flight.toAirport}</span>
                    </div>
                </div>

                <!-- Right: Price & CTA Select -->
                <div class="card-right-section">
                    <div class="fare-box">
                        <span class="fare-class">${searchParams.cabinClass}</span>
                        <div class="fare-amount-row">
                            <span class="fare-discount">₹${flight.originalPrice.toLocaleString('en-IN')}</span>
                            <span class="fare-actual">₹${flight.price.toLocaleString('en-IN')}</span>
                        </div>
                        <div class="fare-badges">
                            <span class="fare-badge-discount">${flight.discountPercent}% OFF</span>
                        </div>
                        <div class="seats-left-badge">Only ${flight.seatsLeft} seats left!</div>
                    </div>
                    <button class="btn-select-flight" id="select-btn-${flight.id}">
                        ${isSelected ? 'Selected' : 'Select Flight'}
                    </button>
                </div>
            `;

            // Card Selection click handlers
            card.addEventListener('click', (e) => {
                // Ignore if clicked profile or other actions directly
                updateSelectedFlight(flight);
            });

            container.appendChild(card);
        });
    }

    // Update selected flight object and sidebar panel UI details
    function updateSelectedFlight(flight) {
        selectedFlight = flight;
        
        // Update active class on card elements
        document.querySelectorAll('.flight-card').forEach(c => {
            c.classList.remove('selected');
            const btn = c.querySelector('.btn-select-flight');
            if (btn) btn.textContent = 'Select Flight';
        });
        
        const selectedCard = document.getElementById(flight.id);
        if (selectedCard) {
            selectedCard.classList.add('selected');
            const btn = selectedCard.querySelector('.btn-select-flight');
            if (btn) btn.textContent = 'Selected';
        }

        // Update Booking Summary Panel details
        document.getElementById('summary-airline-logo').innerHTML = getAirlineLogoSVG(flight.airline);
        document.getElementById('summary-airline-name').textContent = flight.airline;
        document.getElementById('summary-flight-number').textContent = flight.flightNo;
        document.getElementById('summary-dep-time').textContent = flight.departure;
        document.getElementById('summary-dep-code').textContent = flight.fromCode;
        document.getElementById('summary-arr-time').textContent = flight.arrival;
        document.getElementById('summary-arr-code').textContent = flight.toCode;
        document.getElementById('summary-duration').textContent = flight.duration;
        
        // Passenger & Cabin Text
        const paxText = `${searchParams.passengers} Adult${searchParams.passengers > 1 ? 's' : ''}`;
        document.getElementById('summary-passenger-count').textContent = paxText;
        document.getElementById('summary-cabin-class').textContent = searchParams.cabinClass;

        // Fares
        const baseFare = flight.price * searchParams.passengers;
        const taxes = 1250 * searchParams.passengers;
        const total = baseFare + taxes;

        document.getElementById('summary-base-fare').textContent = `₹${baseFare.toLocaleString('en-IN')}`;
        document.getElementById('summary-taxes').textContent = `₹${taxes.toLocaleString('en-IN')}`;
        document.getElementById('summary-total-fare').textContent = `₹${total.toLocaleString('en-IN')}`;

        // Enable Booking Flow Button
        const continueBtn = document.getElementById('btn-continue-booking');
        continueBtn.classList.remove('disabled');
        continueBtn.disabled = false;
    }

    // --- Filter Chips Interactions ---
    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const filterType = chip.getAttribute('data-filter');
            
            if (activeFilters.has(filterType)) {
                activeFilters.delete(filterType);
                chip.classList.remove('active');
            } else {
                activeFilters.add(filterType);
                chip.classList.add('active');
            }

            // Simulate nearby airports text trigger
            if (filterType === 'nearby') {
                if (chip.classList.contains('active')) {
                    showCustomToast("Including flights from nearby alternate airports.");
                }
            }

            processAndRenderFlights();
        });
    });

    // Custom Toast Alert builder for premium feeling
    function showCustomToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background: rgba(17, 24, 39, 0.95);
            border: 1px solid var(--accent-sky);
            color: var(--text-white);
            padding: 12px 24px;
            border-radius: 30px;
            z-index: 9999;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            font-size: 0.9rem;
            font-weight: 500;
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Animate up
        setTimeout(() => {
            toast.style.transform = "translateX(-50%) translateY(0)";
            toast.style.opacity = "1";
        }, 100);

        // Animate down and remove
        setTimeout(() => {
            toast.style.transform = "translateX(-50%) translateY(100px)";
            toast.style.opacity = "0";
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    // --- Sort By Selector ---
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            processAndRenderFlights();
        });
    }

    // --- Continue Booking Click Handler ---
    document.getElementById('btn-continue-booking').addEventListener('click', () => {
        if (!selectedFlight) return;
        
        // Save selected flight details and pricing aggregates to localStorage
        const baseFare = selectedFlight.price * searchParams.passengers;
        const taxes = 1250 * searchParams.passengers;
        const total = baseFare + taxes;
        
        const bookingSelection = {
            flight: selectedFlight,
            search: searchParams,
            pricing: {
                baseFare,
                taxes,
                total
            }
        };

        localStorage.setItem('flyeasy_selected_flight', JSON.stringify(bookingSelection));
        
        // Navigate
        window.location.href = 'passenger-details.html';
    });

    // --- 3. Edit Search Modal Logic ---
    const editModal = document.getElementById('edit-search-modal');
    const btnEditSearch = document.getElementById('btn-edit-search');
    const btnCloseModal = document.getElementById('close-modal-btn');
    const searchDetailsTrigger = document.getElementById('search-details-trigger');
    const modalForm = document.getElementById('modal-search-form');

    const openEditModal = () => {
        // Pre-populate modal fields
        document.getElementById('modal-input-from').value = searchParams.from;
        document.getElementById('modal-input-to').value = searchParams.to;
        document.getElementById('modal-input-dep').value = searchParams.depDate;
        document.getElementById('modal-input-passengers').value = searchParams.passengers.toString();
        document.getElementById('modal-input-class').value = searchParams.cabinClass;
        
        editModal.classList.add('active');
    };

    const closeEditModal = () => {
        editModal.classList.remove('active');
    };

    btnEditSearch.addEventListener('click', openEditModal);
    searchDetailsTrigger.addEventListener('click', openEditModal);
    btnCloseModal.addEventListener('click', closeEditModal);
    
    // Close on click outside modal card
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
            closeEditModal();
        }
    });

    // Handle modal search form submit
    modalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const updatedParams = {
            from: document.getElementById('modal-input-from').value,
            to: document.getElementById('modal-input-to').value,
            depDate: document.getElementById('modal-input-dep').value,
            retDate: searchParams.retDate, // preserve roundtrip details
            passengers: parseInt(document.getElementById('modal-input-passengers').value),
            cabinClass: document.getElementById('modal-input-class').value
        };

        searchParams = updatedParams;
        localStorage.setItem('flyeasy_search', JSON.stringify(searchParams));
        selectedCarouselDateStr = searchParams.depDate;

        closeEditModal();
        
        // Refresh entire page details
        updateUIHeaders();
        generateDateCarousel();
        processAndRenderFlights();

        // If a flight was selected, reset selection as results have changed
        selectedFlight = null;
        // reset sidebar
        document.getElementById('summary-airline-name').textContent = "Select a flight";
        document.getElementById('summary-flight-number').textContent = "--";
        document.getElementById('summary-dep-time').textContent = "--:--";
        document.getElementById('summary-dep-code').textContent = "---";
        document.getElementById('summary-arr-time').textContent = "--:--";
        document.getElementById('summary-arr-code').textContent = "---";
        document.getElementById('summary-duration').textContent = "--h --m";
        document.getElementById('summary-base-fare').textContent = "₹0";
        document.getElementById('summary-taxes').textContent = "₹1,250";
        document.getElementById('summary-total-fare').textContent = "₹0";
        document.getElementById('summary-airline-logo').innerHTML = '';
        
        const continueBtn = document.getElementById('btn-continue-booking');
        continueBtn.classList.add('disabled');
        continueBtn.disabled = true;

        showCustomToast("Search criteria updated successfully!");
    });


    // --- INITIALIZATION FLOW ---
    loadSearchParams();
    updateUIHeaders();
    generateDateCarousel();
    processAndRenderFlights();
    
    // Auto-select the first flight by default to populate summary card on start
    if (flightList.length > 0) {
        setTimeout(() => {
            updateSelectedFlight(flightList[0]);
        }, 300);
    }
});
