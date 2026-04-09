const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000/api'
  : '/api';

const TOKEN_KEY = 'proximity_token';
const USER_KEY = 'proximity_user';

function getToken() { try { return localStorage.getItem(TOKEN_KEY); } catch(e) { return null; } }
function setToken(token) { try { localStorage.setItem(TOKEN_KEY, token); } catch(e) {} }
function clearToken() { try { localStorage.removeItem(TOKEN_KEY); } catch(e) {} }
function getUser() { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch(e) { return null; } }
function setUser(user) { try { localStorage.setItem(USER_KEY, JSON.stringify(user)); } catch(e) {} }
function clearUser() { try { localStorage.removeItem(USER_KEY); } catch(e) {} }

function isAuthenticated() { return !!getToken(); }
function isAdmin() { const u = getUser(); return u && u.role === 'admin'; }

function getRoot() {
  const depth = window.location.pathname.split('/').filter(Boolean).length;
  return depth <= 1 ? '' : Array(depth - 1).fill('..').join('/');
}
function redirectIfNotAuth() {
  if (!isAuthenticated()) window.location.href = getRoot() + '/login.html';
}
function redirectIfNotAdmin() {
  if (!isAdmin()) window.location.href = getRoot() + '/client/dashboard.html';
}

async function handleResponse(res) {
  if (res.status === 401) {
    clearToken();
    clearUser();
    window.location.href = getRoot() + '/login.html';
    return;
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

async function authFetch(url, options = {}) {
  return fetch(API_BASE + url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
      ...(options.headers || {})
    }
  });
}

const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginForm.email.value.trim();
    const password = loginForm.password.value;
    if (!email || !password) { window.showToast('Please fill in all fields', 'error'); return; }
    const btn = loginForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Signing in...';
    try {
      const res = await fetch(API_BASE + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setToken(data.token);
      setUser(data.user);
      window.location.href = data.user.role === 'admin'
        ? getRoot() + '/admin/dashboard.html'
        : getRoot() + '/client/dashboard.html';
    } catch (err) {
      window.showToast(err.message || 'Login failed', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  });
}

const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = registerForm.querySelector('#name').value.trim();
    const email = registerForm.querySelector('#email').value.trim();
    const password = registerForm.querySelector('#password').value;
    const confirmPassword = registerForm.querySelector('#confirm-password').value;

    if (!name) { window.showToast('Name is required', 'error'); return; }
    if (!email || !/\S+@\S+\.\S+/.test(email)) { window.showToast('Please enter a valid email', 'error'); return; }
    if (password.length < 6) { window.showToast('Password must be at least 6 characters', 'error'); return; }
    if (password !== confirmPassword) { window.showToast('Passwords do not match', 'error'); return; }

    const btn = registerForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Creating account...';
    try {
      const res = await fetch(API_BASE + '/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || (data.errors && data.errors[0].msg));
      setToken(data.token);
      setUser(data.user);
      window.showToast('Account created successfully!', 'success');
      setTimeout(() => { window.location.href = getRoot() + '/client/dashboard.html'; }, 1500);
    } catch (err) {
      window.showToast(err.message || 'Registration failed', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  });
}

document.querySelectorAll('.password-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const wrap = btn.closest('.password-field-wrap') || btn.closest('.float-label-group');
    const input = wrap ? wrap.querySelector('input[type="password"], input[type="text"]') : null;
    if (!input) return;
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    const icon = btn.querySelector('[data-lucide]');
    if (icon) {
      icon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  });
});

const passwordField = document.getElementById('password');
if (passwordField && document.querySelector('.strength-fill')) {
  passwordField.addEventListener('keyup', () => {
    const val = passwordField.value;
    const fill = document.querySelector('.strength-fill');
    let score = 0;
    if (val.length >= 6) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    fill.className = 'strength-fill';
    if (val.length === 0) { fill.style.width = '0%'; }
    else if (score <= 1) { fill.classList.add('weak'); fill.style.width = '33%'; }
    else if (score <= 2) { fill.classList.add('medium'); fill.style.width = '66%'; }
    else { fill.classList.add('strong'); fill.style.width = '100%'; }
  });
}

window.logout = function() {
  clearToken();
  clearUser();
  window.location.href = getRoot() + '/login.html';
};

(function updateNavbar() {
  if (isAuthenticated()) {
    const user = getUser();
    const loginLink = document.querySelector('.nav-login');
    const registerBtn = document.querySelector('.nav-register');
    if (loginLink && user) {
      loginLink.textContent = user.name;
      loginLink.href = user.role === 'admin' ? '/admin/dashboard.html' : '/client/dashboard.html';
    }
    if (registerBtn) {
      registerBtn.textContent = 'Dashboard';
      registerBtn.href = user && user.role === 'admin' ? '/admin/dashboard.html' : '/client/dashboard.html';
    }
  }
})();

window.authUtils = {
  isAuthenticated,
  isAdmin,
  getToken,
  getUser,
  setUser,
  redirectIfNotAuth,
  redirectIfNotAdmin,
  handleResponse,
  authFetch,
  API_BASE,
  getRoot
};
