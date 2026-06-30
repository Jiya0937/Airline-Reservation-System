/* ==========================================
   FLYEASY - PROFILE CONTROLLER
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:5000/api/auth';
    const token = localStorage.getItem('flyeasy_token');

    // --- 1. Authentication Gate ---
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // --- 2. Country Selection List ---
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
    const profileCountryInput = document.getElementById('profile-country');

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
                profileCountryInput.value = country;
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

    countryTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = countryDropdownMenu.classList.contains('active');
        if (isActive) {
            closeCountryDropdown();
        } else {
            openCountryDropdown();
        }
    });

    countrySearchInput.addEventListener('input', (e) => {
        renderCountryList(e.target.value);
    });

    document.addEventListener('click', (e) => {
        if (!countryDropdownMenu.contains(e.target) && !countryTrigger.contains(e.target)) {
            closeCountryDropdown();
        }
    });

    renderCountryList();


    // --- 3. DOM Elements ---
    const alertError = document.getElementById('alert-error');
    const alertSuccess = document.getElementById('alert-success');
    
    // Forms
    const editForm = document.getElementById('edit-profile-form');
    const passForm = document.getElementById('change-password-form');
    
    // Inputs
    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    const mobileInput = document.getElementById('profile-mobile');
    const cityInput = document.getElementById('profile-city');

    const oldPassInput = document.getElementById('pass-old');
    const newPassInput = document.getElementById('pass-new');
    const confirmPassInput = document.getElementById('pass-confirm');

    // Sidebar User card displays
    const avatarInitials = document.getElementById('avatar-initials');
    const sidebarName = document.getElementById('sidebar-user-name');
    const sidebarEmail = document.getElementById('sidebar-user-email');
    const sidebarLoc = document.getElementById('sidebar-user-loc');
    const sidebarSince = document.getElementById('sidebar-user-since');


    // --- 4. Fetch Profile ---
    const fetchUserProfile = async () => {
        try {
            const response = await fetch(`${API_URL}/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                // If token is invalid or expired, log out
                if (response.status === 401) {
                    handleLogoutAction();
                    return;
                }
                throw new Error('Could not load user profile details.');
            }

            const user = await response.json();
            populateProfileUI(user);

        } catch (error) {
            showError(error.message);
        }
    };

    const populateProfileUI = (user) => {
        // Form prefill
        nameInput.value = user.fullName;
        emailInput.value = user.email;
        mobileInput.value = user.mobile;
        cityInput.value = user.city;
        selectedCountrySpan.textContent = user.country;
        profileCountryInput.value = user.country;

        // Sidebar elements
        sidebarName.textContent = user.fullName;
        sidebarEmail.textContent = user.email;
        sidebarLoc.textContent = `${user.city}, ${user.country}`;
        
        // Initials generator
        const names = user.fullName.split(' ');
        const initials = names.map(n => n.charAt(0)).slice(0, 2).join('').toUpperCase();
        avatarInitials.textContent = initials || 'FE';

        // Member since date format
        if (user.createdAt) {
            const date = new Date(user.createdAt);
            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            sidebarSince.textContent = `${months[date.getMonth()]} ${date.getFullYear()}`;
        }
    };


    // --- 5. Save Profile Info ---
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAlerts();

        const fullName = nameInput.value.trim();
        const mobile = mobileInput.value.trim();
        const country = profileCountryInput.value;
        const city = cityInput.value.trim();

        if (!fullName || !mobile || !country || !city) {
            showError('All fields must be filled in.');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/update-profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ fullName, mobile, country, city })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update personal details.');
            }

            showSuccess('Profile information updated successfully!');
            // Update local user details cache
            localStorage.setItem('flyeasy_user', JSON.stringify(data.user));
            // Update UI sidebar
            sidebarName.textContent = fullName;
            sidebarLoc.textContent = `${city}, ${country}`;

        } catch (error) {
            showError(error.message);
        }
    });


    // --- 6. Change Password ---
    passForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAlerts();

        const oldPassword = oldPassInput.value;
        const newPassword = newPassInput.value;
        const confirmNewPassword = confirmPassInput.value;

        // 1. Password matches checks
        if (newPassword !== confirmNewPassword) {
            showError('Passwords do not match. Please verify.');
            return;
        }

        // 2. Password complexity requirements checks
        const hasLength = newPassword.length >= 8;
        const hasUpper = /[A-Z]/.test(newPassword);
        const hasNumber = /[0-9]/.test(newPassword);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

        if (!hasLength || !hasUpper || !hasNumber || !hasSpecial) {
            showError('New password does not satisfy complexity requirements (minimum 8 characters, one uppercase letter, one number, and one special character).');
            return;
        }

        const fullName = nameInput.value.trim();
        const mobile = mobileInput.value.trim();
        const country = profileCountryInput.value;
        const city = cityInput.value.trim();

        try {
            const response = await fetch(`${API_URL}/update-profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fullName,
                    mobile,
                    country,
                    city,
                    oldPassword,
                    newPassword,
                    confirmNewPassword
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update credentials.');
            }

            showSuccess('Password updated successfully!');
            passForm.reset();

        } catch (error) {
            showError(error.message);
        }
    });


    // --- 7. Log Out Handler ---
    const handleLogoutAction = () => {
        localStorage.removeItem('flyeasy_token');
        localStorage.removeItem('flyeasy_user');
        localStorage.removeItem('flyeasy_selected_flight');
        window.location.href = 'index.html';
    };

    document.getElementById('btn-logout').addEventListener('click', (e) => {
        e.preventDefault();
        handleLogoutAction();
    });

    document.getElementById('btn-logout-header').addEventListener('click', (e) => {
        e.preventDefault();
        handleLogoutAction();
    });


    // --- 8. Helper Methods ---
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

    function clearAlerts() {
        alertError.style.display = 'none';
        alertSuccess.style.display = 'none';
    }

    // --- Execution ---
    fetchUserProfile();
});
