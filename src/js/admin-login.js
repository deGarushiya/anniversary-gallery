window.__adminLoaded = true;

const ADMIN_PASSWORD = 'love2025';
const SESSION_KEY = 'gallery-admin-auth';

const loginError = document.getElementById('login-error');

if (sessionStorage.getItem(SESSION_KEY) === 'true') {
  window.location.replace('/admin-dashboard.html');
}

document.getElementById('login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const pw = document.getElementById('login-password').value.trim();

  if (pw === ADMIN_PASSWORD) {
    sessionStorage.setItem(SESSION_KEY, 'true');
    window.location.href = '/admin-dashboard.html';
  } else {
    loginError.textContent = 'Incorrect password. Try: love2025';
    loginError.hidden = false;
  }
});
