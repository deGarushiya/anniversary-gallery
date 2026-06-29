const PASSCODE = '0705';
const SESSION_KEY = 'gallery-unlocked';
const MAIL_KEY = 'gallery-mail-opened';
const LETTER_KEY = 'gallery-letter-read';
const FLOWERS_KEY = 'gallery-flowers-seen';

const gate = document.getElementById('gate');
const welcome = document.getElementById('welcome');
const mail = document.getElementById('mail');
const letter = document.getElementById('letter');
const flowers = document.getElementById('flowers');
const mainPage = document.getElementById('main-page');
const deniedModal = document.getElementById('denied-modal');
const gateForm = document.getElementById('gate-form');
const mailOpen = document.getElementById('mail-open');
const letterContinue = document.getElementById('letter-continue');
const flowersContinue = document.getElementById('flowers-continue');
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

function showMail() {
  mail.hidden = false;
}

function showLetter() {
  mail.classList.add('is-hidden');
  mail.hidden = true;
  letter.hidden = false;
}

function showFlowers() {
  letter.classList.add('is-hidden');
  setTimeout(() => {
    letter.hidden = true;
    flowers.hidden = false;
  }, 550);
}

function showMain() {
  flowers.classList.add('is-hidden');
  setTimeout(() => {
    flowers.hidden = true;
    mainPage.hidden = false;
  }, 550);
}

function showWelcomeThenMail() {
  welcome.hidden = false;
  setTimeout(() => {
    welcome.classList.add('is-leaving');
    setTimeout(() => {
      welcome.hidden = true;
      showMail();
    }, 600);
  }, 2200);
}

function unlockSite() {
  sessionStorage.setItem(SESSION_KEY, 'true');
  gate.classList.add('is-hidden');
  setTimeout(() => { gate.hidden = true; }, 500);
  showWelcomeThenMail();
}

function resumeAfterUnlock() {
  gate.hidden = true;
  if (sessionStorage.getItem(FLOWERS_KEY) === 'true') {
    mainPage.hidden = false;
  } else if (sessionStorage.getItem(LETTER_KEY) === 'true') {
    flowers.hidden = false;
  } else if (sessionStorage.getItem(MAIL_KEY) === 'true') {
    showLetter();
  } else {
    showMail();
  }
}

if (sessionStorage.getItem(SESSION_KEY) === 'true') {
  resumeAfterUnlock();
} else {
  digits[0].focus();
}

mailOpen.addEventListener('click', () => {
  if (mailOpen.classList.contains('is-opening')) return;
  mailOpen.classList.add('is-opening');
  sessionStorage.setItem(MAIL_KEY, 'true');
  setTimeout(showLetter, 900);
});

letterContinue.addEventListener('click', () => {
  sessionStorage.setItem(LETTER_KEY, 'true');
  showFlowers();
});

flowersContinue.addEventListener('click', () => {
  sessionStorage.setItem(FLOWERS_KEY, 'true');
  showMain();
});

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
