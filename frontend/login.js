/* ==========================================
   FLYEASY - LOGIN CONTROLLER
   ========================================== */
import { API_URL as BASE_API_URL } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = `${BASE_API_URL}/api/auth`;

    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const rememberCheckbox = document.getElementById('login-remember');
    const btnSubmit = document.getElementById('btn-submit-login');
    const alertError = document.getElementById('alert-error');
    const alertSuccess = document.getElementById('alert-success');
    const btnForgot = document.getElementById('btn-forgot-password');

    const googleBtn = document.getElementById('btn-social-google');
    const githubBtn = document.getElementById('btn-social-github');

    // --- 1. Remember Me Prefill ---
    const savedEmail = localStorage.getItem('flyeasy_remember_email');
    if (savedEmail) {
        emailInput.value = savedEmail;
        rememberCheckbox.checked = true;
    }

    // --- 2. Forgot Password Mock ---
    btnForgot.addEventListener('click', (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        if (!email) {
            showError('Please enter your email address to request a reset link.');
            return;
        }
        showSuccess(`A password reset link has been dispatched to: ${email}`);
    });

    // --- 3. Social Sign-in Mock ---
    const handleSocialLoginMock = (providerName) => {
        showSuccess(`Connecting with ${providerName}...`);
        setTimeout(() => {
            const mockUser = {
                id: 999,
                fullName: `${providerName} Traveller`,
                email: `${providerName.toLowerCase()}@flyeasy.com`,
                mobile: "+91 99999 88888",
                country: "India",
                city: "Mumbai"
            };
            const mockToken = "mock_jwt_token_for_social_login_provider";
            
            localStorage.setItem('flyeasy_token', mockToken);
            localStorage.setItem('flyeasy_user', JSON.stringify(mockUser));
            
            showSuccess(`Authenticated via ${providerName}! Redirecting to homepage...`);
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }, 1200);
    };

    googleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleSocialLoginMock('Google');
    });

    githubBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleSocialLoginMock('GitHub');
    });


    // --- 4. Core Form Submission ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Reset notifications
        alertError.style.display = 'none';
        alertSuccess.style.display = 'none';

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // 1. Email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showError('Please input a valid email address format.');
            return;
        }

        // Set loading state
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Authentication failed. Please verify credentials.');
            }

            // Save Remember Me
            if (rememberCheckbox.checked) {
                localStorage.setItem('flyeasy_remember_email', email);
            } else {
                localStorage.removeItem('flyeasy_remember_email');
            }

            // Save Token & User profile details
            localStorage.setItem('flyeasy_token', data.token);
            localStorage.setItem('flyeasy_user', JSON.stringify(data.user));

            showSuccess('Successfully authenticated! Redirecting to FlyEasy homepage...');
            
            // Redirect
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);

        } catch (error) {
            showError(error.message);
            setLoading(false);
        }
    });

    function showError(message) {
        alertError.textContent = message;
        alertError.style.display = 'block';
        alertSuccess.style.display = 'none';
    }

    function showSuccess(message) {
        alertSuccess.textContent = message;
        alertSuccess.style.display = 'block';
        alertError.style.display = 'none';
    }

    function setLoading(isLoading) {
        if (isLoading) {
            btnSubmit.disabled = true;
            btnSubmit.querySelector('span').textContent = 'Verifying...';
            btnSubmit.style.opacity = '0.7';
        } else {
            btnSubmit.disabled = false;
            btnSubmit.querySelector('span').textContent = 'Login';
            btnSubmit.style.opacity = '1';
        }
    }
});
