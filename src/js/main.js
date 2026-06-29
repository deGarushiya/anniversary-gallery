const PASSCODE = '0705';
const SESSION_KEY = 'gallery-unlocked';

const gate = document.getElementById('gate');
const welcome = document.getElementById('welcome');
const mainPage = document.getElementById('main-page');
const deniedModal = document.getElementById('denied-modal');
const gateForm = document.getElementById('gate-form');
const digits = [...document.querySelectorAll('.gate__digit')];

function getPinValue() {
  return digits.map((d) => d.value).join('');
}

function clearPin() {
  digits.forEach((d) => { d.value = ''; });
  digits[0].focus();
}

function showDenied() {
  deniedModal.hidden = false;
  clearPin();
}

function hideDenied() {
  deniedModal.hidden = true;
}

function unlockSite() {
  sessionStorage.setItem(SESSION_KEY, 'true');
  gate.classList.add('is-hidden');
  setTimeout(() => { gate.hidden = true; }, 500);

  welcome.hidden = false;
  setTimeout(() => {
    welcome.classList.add('is-leaving');
    setTimeout(() => {
      welcome.hidden = true;
      mainPage.hidden = false;
    }, 600);
  }, 2200);
}

function skipToMain() {
  gate.classList.add('is-hidden');
  gate.hidden = true;
  mainPage.hidden = false;
}

if (sessionStorage.getItem(SESSION_KEY) === 'true') {
  skipToMain();
} else {
  digits[0].focus();
}

digits.forEach((input, i) => {
  input.addEventListener('input', () => {
    input.value = input.value.replace(/\D/g, '').slice(-1);
    if (input.value && i < digits.length - 1) {
      digits[i + 1].focus();
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !input.value && i > 0) {
      digits[i - 1].focus();
    }
  });

  input.addEventListener('paste', (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 4);
    pasted.split('').forEach((ch, j) => {
      if (digits[j]) digits[j].value = ch;
    });
    if (pasted.length === 4) digits[3].focus();
    else if (pasted.length) digits[Math.min(pasted.length, 3)].focus();
  });
});

gateForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const code = getPinValue();

  if (code.length < 4) {
    digits[code.length]?.focus();
    return;
  }

  if (code === PASSCODE) {
    unlockSite();
  } else {
    showDenied();
  }
});

deniedModal.querySelectorAll('[data-close-modal]').forEach((el) => {
  el.addEventListener('click', hideDenied);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !deniedModal.hidden) hideDenied();
});
