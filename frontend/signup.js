/* ==========================================
   FLYEASY - SIGNUP CONTROLLER
   ========================================== */
import { API_URL as BASE_API_URL } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = `${BASE_API_URL}/api/auth`;

    // --- 1. Country Selection List ---
    const countries = [
        "Afghanistan", "Australia", "Austria", "Bangladesh", "Belgium", "Brazil", "Canada", "China", "Denmark", 
        "Egypt", "France", "Germany", "Greece", "India", "Indonesia", "Italy", "Japan", "Malaysia", "Maldives", 
        "Mexico", "Nepal", "Netherlands", "New Zealand", "Norway", "Philippines", "Qatar", "Russia", "Saudi Arabia", 
        "Singapore", "South Africa", "South Korea", "Spain", "Sri Lanka", "Sweden", "Switzerland", "Thailand", 
        "Turkey", "United Arab Emirates", "United Kingdom", "United States", "Vietnam"
    ];

    const countryTrigger = document.getElementById('country-trigger');
    const countryDropdownMenu = document.getElementById('country-dropdown-menu');
    const countrySearchInput = document.getElementById('country-search-input');
    const countryList = document.getElementById('country-list');
    const selectedCountrySpan = document.getElementById('selected-country');
    const regCountryInput = document.getElementById('reg-country');

    // Populate country list initially
    function renderCountryList(filterText = "") {
        countryList.innerHTML = '';
        const filtered = countries.filter(c => c.toLowerCase().includes(filterText.toLowerCase()));
        
        if (filtered.length === 0) {
            countryList.innerHTML = `<li class="country-option" style="color: var(--text-gray); cursor: default;">No country found</li>`;
            return;
        }

        filtered.forEach(country => {
            const li = document.createElement('li');
            li.className = 'country-option';
            li.textContent = country;
            li.addEventListener('click', (e) => {
                e.stopPropagation();
                selectedCountrySpan.textContent = country;
                selectedCountrySpan.className = 'selected-val';
                regCountryInput.value = country;
                closeCountryDropdown();
            });
            countryList.appendChild(li);
        });
    }

    function openCountryDropdown() {
        countryDropdownMenu.classList.add('active');
        countryTrigger.querySelector('.chevron-icon').style.transform = 'rotate(180deg)';
        countrySearchInput.focus();
    }

    function closeCountryDropdown() {
        countryDropdownMenu.classList.remove('active');
        countryTrigger.querySelector('.chevron-icon').style.transform = 'rotate(0deg)';
    }

    // Event listener to toggle dropdown
    countryTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = countryDropdownMenu.classList.contains('active');
        if (isActive) {
            closeCountryDropdown();
        } else {
            openCountryDropdown();
        }
    });

    // Event listener for search filtering
    countrySearchInput.addEventListener('input', (e) => {
        renderCountryList(e.target.value);
    });

    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
        if (!countryDropdownMenu.contains(e.target) && !countryTrigger.contains(e.target)) {
            closeCountryDropdown();
        }
    });

    // Initialize list
    renderCountryList();


    // --- 2. Password Strength Check ---
    const passwordInput = document.getElementById('reg-password');
    const strengthBar = document.getElementById('strength-bar');
    const strengthText = document.getElementById('strength-text');

    const reqLength = document.getElementById('req-length');
    const reqUpper = document.getElementById('req-upper');
    const reqNumber = document.getElementById('req-number');
    const reqSpecial = document.getElementById('req-special');

    passwordInput.addEventListener('input', () => {
        const val = passwordInput.value;

        // Requirements criteria
        const hasLength = val.length >= 8;
        const hasUpper = /[A-Z]/.test(val);
        const hasNumber = /[0-9]/.test(val);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(val);

        // Update requirements checklists visually
        toggleRequirement(reqLength, hasLength);
        toggleRequirement(reqUpper, hasUpper);
        toggleRequirement(reqNumber, hasNumber);
        toggleRequirement(reqSpecial, hasSpecial);

        // Calculate score
        let score = 0;
        if (hasLength) score++;
        if (hasUpper) score++;
        if (hasNumber) score++;
        if (hasSpecial) score++;

        // Reset strength bar classes
        strengthBar.className = 'strength-bar';
        strengthText.className = 'strength-text';

        if (val.length === 0) {
            strengthText.textContent = 'Password Strength';
        } else if (score <= 2) {
            strengthBar.classList.add('weak');
            strengthText.classList.add('weak');
            strengthText.textContent = 'Weak Password';
        } else if (score === 3) {
            strengthBar.classList.add('medium');
            strengthText.classList.add('medium');
            strengthText.textContent = 'Medium Password';
        } else if (score === 4) {
            strengthBar.classList.add('strong');
            strengthText.classList.add('strong');
            strengthText.textContent = 'Strong Password';
        }
    });

    function toggleRequirement(el, isValid) {
        if (isValid) {
            el.classList.remove('invalid');
            el.classList.add('valid');
        } else {
            el.classList.remove('valid');
            el.classList.add('invalid');
        }
    }


    // --- 3. Form Submission Handling ---
    const signupForm = document.getElementById('signup-form');
    const alertError = document.getElementById('alert-error');
    const alertSuccess = document.getElementById('alert-success');
    const btnSubmit = document.getElementById('btn-submit-signup');

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Clear alerts
        alertError.style.display = 'none';
        alertSuccess.style.display = 'none';

        // Retrieve values
        const fullName = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = passwordInput.value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;
        const mobile = document.getElementById('reg-mobile').value.trim();
        const country = regCountryInput.value;
        const city = document.getElementById('reg-city').value.trim();

        // 1. Check empty values
        if (!fullName || !email || !password || !confirmPassword || !mobile || !country || !city) {
            showError('Please fill out all fields.');
            return;
        }

        // 2. Password mismatch check
        if (password !== confirmPassword) {
            showError('Passwords do not match. Please verify.');
            return;
        }

        // 3. Password requirements check
        const hasLength = password.length >= 8;
        const hasUpper = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (!hasLength || !hasUpper || !hasNumber || !hasSpecial) {
            showError('Password does not satisfy complexity requirements.');
            return;
        }

        // Loading state
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fullName,
                    email,
                    password,
                    confirmPassword,
                    mobile,
                    country,
                    city
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'An error occurred during registration.');
            }

            // Success
            showSuccess(data.message || 'Registration successful! Redirecting to login...');
            
            // Redirect
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);

        } catch (error) {
            showError(error.message);
            setLoading(false);
        }
    });

    function showError(message) {
        alertError.textContent = message;
        alertError.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function showSuccess(message) {
        alertSuccess.textContent = message;
        alertSuccess.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function setLoading(isLoading) {
        if (isLoading) {
            btnSubmit.disabled = true;
            btnSubmit.querySelector('span').textContent = 'Creating Account...';
            btnSubmit.style.opacity = '0.7';
        } else {
            btnSubmit.disabled = false;
            btnSubmit.querySelector('span').textContent = 'Create Account';
            btnSubmit.style.opacity = '1';
        }
    }
});
