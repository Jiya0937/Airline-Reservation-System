/* ==========================================
   FLYEASY - CUSTOM INTERACTIVE JAVASCRIPT
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Sticky Navbar Scroll Effect ---
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // --- 2. Scroll Reveal Observer ---
    const revealElements = document.querySelectorAll('.scroll-reveal');
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Reveal only once
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // --- 3. Category Tab Switcher (Flights / Hotels / Cabs) ---
    const tabs = document.querySelectorAll('.search-tab');
    const fromGroup = document.getElementById('from-group');
    const toGroup = document.getElementById('to-group');
    const swapContainer = document.querySelector('.swap-btn-container');
    const depGroup = document.getElementById('dep-group');
    const retGroup = document.getElementById('ret-group');
    const classGroup = document.getElementById('class-group');
    const fromInput = document.getElementById('input-from');
    const toInput = document.getElementById('input-to');
    const fromLabel = fromGroup.querySelector('.input-label');
    const toLabel = toGroup.querySelector('.input-label');
    const tripTypesContainer = document.getElementById('trip-types-container');
    const btnSubmitSearch = document.getElementById('btn-submit-search');

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add to clicked
            tab.classList.add('active');

            const category = tab.getAttribute('data-tab');

            // Reset dynamic states
            fromGroup.style.display = 'flex';
            toGroup.style.display = 'flex';
            swapContainer.style.display = 'flex';
            retGroup.style.display = 'flex';
            classGroup.style.display = 'flex';
            tripTypesContainer.style.visibility = 'visible';
            tripTypesContainer.style.height = 'auto';

            if (category === 'flights') {
                fromLabel.textContent = 'From';
                toLabel.textContent = 'To';
                fromInput.placeholder = 'Origin Airport (e.g. DEL)';
                toInput.placeholder = 'Destination Airport (e.g. BOM)';
                btnSubmitSearch.querySelector('span').textContent = 'Search Flights';
            } else if (category === 'hotels') {
                fromLabel.textContent = 'Where To?';
                fromInput.placeholder = 'City, hotel name or area';
                
                // Hide unnecessary destination fields for hotels
                toGroup.style.display = 'none';
                swapContainer.style.display = 'none';
                retGroup.style.display = 'none'; // Hotel searches usually done with checkout but for our minimal UI we simplify
                tripTypesContainer.style.visibility = 'hidden';
                tripTypesContainer.style.height = '0px';
                btnSubmitSearch.querySelector('span').textContent = 'Search Hotels';
            } else if (category === 'cabs') {
                fromLabel.textContent = 'Pickup Location';
                toLabel.textContent = 'Dropoff Location';
                fromInput.placeholder = 'Enter pickup address';
                toInput.placeholder = 'Enter dropoff address';
                retGroup.style.display = 'none';
                tripTypesContainer.style.visibility = 'hidden';
                tripTypesContainer.style.height = '0px';
                btnSubmitSearch.querySelector('span').textContent = 'Search Cabs';
            }
        });
    });

    // --- 4. Trip Type Toggle (One Way vs Round Trip) ---
    const tripTypeRadios = document.querySelectorAll('input[name="trip-type"]');
    const returnInputWrapper = document.getElementById('ret-input-wrapper');
    const returnInput = document.getElementById('input-ret');

    tripTypeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'oneway') {
                returnInputWrapper.classList.add('disabled');
                returnInput.disabled = true;
            } else {
                returnInputWrapper.classList.remove('disabled');
                returnInput.disabled = false;
            }
        });
    });

    // --- 5. Airport Swap Logic & Animation ---
    const swapBtn = document.getElementById('swap-airports');
    swapBtn.addEventListener('click', () => {
        const fromVal = fromInput.value;
        const toVal = toInput.value;

        // Perform temporary swap rotation effect
        swapBtn.classList.add('rotating');
        setTimeout(() => {
            swapBtn.classList.remove('rotating');
        }, 500);

        // Swap actual input texts
        fromInput.value = toVal;
        toInput.value = fromVal;
    });

    // --- 6. Travellers & Class Custom Dropdown ---
    const travellersTrigger = document.getElementById('travellers-class-trigger');
    const travellersDropdown = document.getElementById('travellers-dropdown');
    const dropdownDone = document.getElementById('dropdown-done');
    const countAdults = document.getElementById('count-adults');
    const countChildren = document.getElementById('count-children');
    const cabinClassRadios = document.getElementsByName('cabin-class');
    const valueDisplay = document.getElementById('travellers-class-value');

    // Open/Close Dropdown
    travellersTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        travellersDropdown.classList.toggle('active');
        travellersTrigger.querySelector('.chevron-icon').style.transform = 
            travellersDropdown.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
    });

    // Close on click Done
    dropdownDone.addEventListener('click', (e) => {
        e.stopPropagation();
        closeDropdown();
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!travellersDropdown.contains(e.target) && !travellersTrigger.contains(e.target)) {
            closeDropdown();
        }
    });

    function closeDropdown() {
        travellersDropdown.classList.remove('active');
        travellersTrigger.querySelector('.chevron-icon').style.transform = 'rotate(0deg)';
        updateDisplayValue();
    }

    // Counter Adjusters
    const counterBtns = document.querySelectorAll('.counter-btn');
    counterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const type = btn.getAttribute('data-type');
            const isPlus = btn.classList.contains('plus');
            
            if (type === 'adults') {
                let val = parseInt(countAdults.textContent);
                if (isPlus) val = Math.min(val + 1, 9);
                else val = Math.max(val - 1, 1); // Minimum 1 Adult
                countAdults.textContent = val;
            } else if (type === 'children') {
                let val = parseInt(countChildren.textContent);
                if (isPlus) val = Math.min(val + 1, 9);
                else val = Math.max(val - 1, 0); // Minimum 0 Children
                countChildren.textContent = val;
            }
        });
    });

    // Update displays
    function updateDisplayValue() {
        const adults = parseInt(countAdults.textContent);
        const children = parseInt(countChildren.textContent);
        const total = adults + children;
        
        let selectedClass = 'Economy';
        cabinClassRadios.forEach(radio => {
            if (radio.checked) {
                selectedClass = radio.nextElementSibling.textContent;
            }
        });

        const travellerText = total === 1 ? '1 Traveller' : `${total} Travellers`;
        valueDisplay.textContent = `${travellerText}, ${selectedClass}`;
    }

    // Update value displays on change cabin classes too
    cabinClassRadios.forEach(radio => {
        radio.addEventListener('change', updateDisplayValue);
    });

    // --- 7. Horizontal Carousel Scrolling Navigations ---
    setupCarousel('dest-carousel-wrapper', 'dest-track', 'dest-prev', 'dest-next', 400);
    setupCarousel('deals-carousel-wrapper', 'deals-track', 'deals-prev', 'deals-next', 440);

    function setupCarousel(wrapperId, trackId, prevBtnId, nextBtnId, scrollAmount) {
        const wrapper = document.getElementById(wrapperId);
        const prevBtn = document.getElementById(prevBtnId);
        const nextBtn = document.getElementById(nextBtnId);

        if (!wrapper || !prevBtn || !nextBtn) return;

        prevBtn.addEventListener('click', () => {
            wrapper.scrollBy({
                left: -scrollAmount,
                behavior: 'smooth'
            });
        });

        nextBtn.addEventListener('click', () => {
            wrapper.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        });
    }

    // --- 8. Interactive Stat Counter Animations ---
    const statsSection = document.querySelector('.hero-stats');
    const statNums = document.querySelectorAll('.stat-num');
    let animated = false;

    const countUp = () => {
        statNums.forEach(num => {
            const dataVal = num.getAttribute('data-val');
            if (!dataVal) return; // ignore 24/7 or custom text
            
            const target = parseInt(dataVal);
            let count = 0;
            const suffix = num.textContent.includes('M+') ? 'M+' : (num.textContent.includes('+') ? '+' : '');
            
            const speed = target / 50; // increment rate
            const updateCount = () => {
                count += speed;
                if (count < target) {
                    num.textContent = Math.floor(count) + suffix;
                    setTimeout(updateCount, 30);
                } else {
                    num.textContent = target + suffix;
                }
            };
            updateCount();
        });
    };

    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !animated) {
                countUp();
                animated = true;
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    if (statsSection) {
        statsObserver.observe(statsSection);
    }
});
