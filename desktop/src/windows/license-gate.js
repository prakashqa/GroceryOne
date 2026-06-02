/* Renderer script for license-gate.html. Talks to main via window.groone (preload). */
/* eslint-disable no-undef */

const errorBox = document.getElementById('error');
const form = document.getElementById('activate-form');
const submitBtn = document.getElementById('submit');
const tenantInput = document.getElementById('tenant');
const keyInput = document.getElementById('key');
const supportLink = document.getElementById('support-link');

function showError(msg) {
  errorBox.hidden = false;
  errorBox.textContent = msg;
}
function clearError() {
  errorBox.hidden = true;
  errorBox.textContent = '';
}

function setBusy(busy) {
  submitBtn.disabled = busy;
  submitBtn.textContent = busy ? 'Activating…' : 'Activate';
}

// Auto-uppercase the key as the user types, preserve dashes
keyInput.addEventListener('input', (e) => {
  const v = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
  if (v !== e.target.value) e.target.value = v;
});
tenantInput.addEventListener('input', (e) => {
  const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (v !== e.target.value) e.target.value = v;
});

function friendly(code, message) {
  switch (code) {
    case 'NOT_FOUND':
      return 'License key not recognised. Check for typos.';
    case 'REVOKED':
      return 'This license has been revoked. Contact support.';
    case 'EXPIRED':
      return 'This license has expired. Renew at support@groone.in.';
    case 'MACHINE_LOCKED':
      return 'This key is already activated on another machine. Ask support to transfer it.';
    case 'TENANT_MISMATCH':
      return 'License does not belong to that business slug. Double-check the slug.';
    case 'VALIDATION':
      return message || 'Please check the key + business slug format.';
    case 'NETWORK':
      return 'No internet connection. Check your network and try again.';
    default:
      return message || 'Activation failed. Please try again or contact support.';
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();
  setBusy(true);
  const tenant = tenantInput.value.trim().toLowerCase();
  const key = keyInput.value.trim().toUpperCase();
  if (!/^GROD-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(key)) {
    setBusy(false);
    showError('Key must look like GROD-XXXX-XXXX-XXXX-XXXX (no I/L/O/U, no 0/1).');
    return;
  }
  if (!tenant) {
    setBusy(false);
    showError('Business slug is required.');
    return;
  }
  try {
    const result = await window.groone.license.activate(key, tenant);
    if (result.ok) {
      // Main process is opening the main window — this gate window will close itself.
      submitBtn.textContent = 'Activated ✓';
      return;
    }
    setBusy(false);
    showError(friendly(result.code, result.message));
  } catch (err) {
    setBusy(false);
    showError(friendly('UNKNOWN', err.message));
  }
});

supportLink.addEventListener('click', (e) => {
  e.preventDefault();
  window.groone.openExternal('mailto:support@groone.in?subject=GroOne%20Desktop%20License');
});

window.groone.license.getMachineHash().then((hash) => {
  document.getElementById('machine-hash').textContent = hash;
});
