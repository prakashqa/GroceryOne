/* Renderer for the offline license gate. Talks to main via window.groone (preload). */
/* eslint-disable no-undef */

const errorBox = document.getElementById('error');
const successBox = document.getElementById('success');
const form = document.getElementById('activate-form');
const submitBtn = document.getElementById('submit');
const importBtn = document.getElementById('import');
const tokenInput = document.getElementById('token');
const supportLink = document.getElementById('support-link');

function showError(msg) {
  successBox.hidden = true;
  errorBox.hidden = false;
  errorBox.textContent = msg;
}
function showSuccess(msg) {
  errorBox.hidden = true;
  successBox.hidden = false;
  successBox.textContent = msg;
}
function clearMsgs() {
  errorBox.hidden = true;
  successBox.hidden = true;
}
function setBusy(busy) {
  submitBtn.disabled = busy;
  importBtn.disabled = busy;
  submitBtn.textContent = busy ? 'Starting…' : 'Activate';
}

function friendly(code, message) {
  switch (code) {
    case 'MALFORMED':
      return 'That doesn\'t look like a valid license key. Check you copied all of it.';
    case 'BAD_SIGNATURE':
      return 'This license key is not valid (signature check failed).';
    case 'EXPIRED':
      return 'This license has expired. Contact support@groone.in to renew.';
    case 'STARTUP':
      return message || 'The app could not start. Please restart, or contact support.';
    default:
      return message || 'Activation failed. Please try again or contact support.';
  }
}

async function submitToken(token) {
  clearMsgs();
  setBusy(true);
  try {
    const result = await window.groone.license.submit(token);
    if (result.ok) {
      showSuccess(`Licensed to ${result.customer}. Starting GroOne…`);
      // Main process is booting the app + will swap windows.
      return;
    }
    setBusy(false);
    showError(friendly(result.code, result.message));
  } catch (err) {
    setBusy(false);
    showError(friendly('UNKNOWN', err && err.message));
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const token = tokenInput.value.trim();
  if (!token) {
    showError('Paste your license key first.');
    return;
  }
  submitToken(token);
});

importBtn.addEventListener('click', async () => {
  clearMsgs();
  const token = await window.groone.license.importFile();
  if (token) {
    tokenInput.value = token.trim();
    submitToken(token.trim());
  }
});

supportLink.addEventListener('click', (e) => {
  e.preventDefault();
  window.groone.openExternal('mailto:support@groone.in?subject=GroOne%20Desktop%20License');
});
