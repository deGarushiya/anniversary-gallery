window.__adminLoaded = true;

import {
  isSupabaseConfigured,
  onAuthChange,
  signInWithGoogle,
  signInWithEmail,
  getSupabase,
} from './supabase-app.js';

const SESSION_KEY = 'gallery-admin-auth';
const ADMIN_PASSWORD = 'love2025';

const cloudLogin = document.getElementById('cloud-login');
const localLogin = document.getElementById('local-login');
const loginError = document.getElementById('login-error');
const localLoginError = document.getElementById('local-login-error');

function showError(el, message) {
  el.textContent = message;
  el.hidden = false;
}

function goDashboard() {
  window.location.href = `${import.meta.env.BASE_URL}admin-dashboard.html`;
}

if (isSupabaseConfigured()) {
  cloudLogin.hidden = false;
  localLogin.hidden = true;

  getSupabase().auth.getSession().then(({ data: { session } }) => {
    if (session) goDashboard();
  });

  onAuthChange((user) => {
    if (user) goDashboard();
  });

  document.getElementById('google-signin').addEventListener('click', async () => {
    try {
      loginError.hidden = true;
      await signInWithGoogle();
    } catch (err) {
      showError(loginError, err.message || 'Google sign-in failed');
    }
  });

  document.getElementById('email-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.hidden = true;
    try {
      await signInWithEmail(
        document.getElementById('login-email').value.trim(),
        document.getElementById('login-email-password').value,
      );
      goDashboard();
    } catch {
      showError(loginError, 'Invalid email or password');
    }
  });
} else {
  if (sessionStorage.getItem(SESSION_KEY) === 'true') goDashboard();

  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const pw = document.getElementById('login-password').value.trim();
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      goDashboard();
    } else {
      showError(localLoginError, 'Incorrect password. Try: love2025');
    }
  });
}
