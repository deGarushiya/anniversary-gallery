window.__adminLoaded = true;

const SESSION_KEY = 'gallery-admin-auth';
const ADMIN_PASSWORD = 'love2025';

const localLoginError = document.getElementById('local-login-error');

function showError(el, message) {
  el.textContent = message;
  el.hidden = false;
}

function goDashboard() {
  window.location.href = `${import.meta.env.BASE_URL}admin-dashboard.html`;
}

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
