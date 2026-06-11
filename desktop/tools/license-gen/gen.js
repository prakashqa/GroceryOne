#!/usr/bin/env node
/**
 * GroOne offline license generator (VENDOR TOOL — keep private).
 *
 * Mints a signed license token for a customer using the Ed25519 PRIVATE key.
 * The app verifies it offline against the embedded public key.
 *
 * Usage:
 *   node gen.js --customer "Siri General Stores" --years 1
 *   node gen.js --customer "Shop Name" --days 400 --key ./license-private.pem
 *
 * Output: prints the license token and writes <Customer-Name>.lic next to it.
 * Email that token (or the .lic file) to the customer; they paste/import it
 * into the app's license gate.
 *
 * SECURITY: license-private.pem must never ship with the app or land in git.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

const customer = arg('customer');
const years = arg('years');
const days = arg('days');
const machineArg = arg('machine'); // full 64-hex or dashed short form, from the customer's app
const keyPath = path.resolve(arg('key', path.join(__dirname, 'license-private.pem')));

// Normalize a pasted machine id: strip non-hex + lowercase. The app's
// shortMachineId is just the first 12 hex of the full id, so a short form can
// only bind if you were given the FULL id — always ask the customer to copy
// the full Machine ID (the Copy button copies the full value).
const machineId = machineArg
  ? String(machineArg).replace(/[^a-fA-F0-9]/g, '').toLowerCase()
  : undefined;

if (!customer) {
  console.error('Usage: node gen.js --customer "Shop Name" [--years 1 | --days 365] [--key license-private.pem]');
  process.exit(1);
}
if (!fs.existsSync(keyPath)) {
  console.error(`Private key not found: ${keyPath}`);
  console.error('Generate one with: node -e "const c=require(\'crypto\'),f=require(\'fs\');const{privateKey}=c.generateKeyPairSync(\'ed25519\');f.writeFileSync(\'license-private.pem\',privateKey.export({type:\'pkcs8\',format:\'pem\'}))"');
  process.exit(1);
}

const durationDays = days ? parseInt(days, 10) : (years ? parseInt(years, 10) : 1) * 365;
const now = new Date();
const expires = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

const payload = {
  customer,
  plan: 'desktop_yearly',
  issuedAt: now.toISOString(),
  expiresAt: expires.toISOString(),
  ...(machineId ? { machineId } : {}),
  v: 1,
};

const b64url = (b) =>
  Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const privateKey = crypto.createPrivateKey(fs.readFileSync(keyPath));
const payloadB64 = b64url(JSON.stringify(payload));
const sig = crypto.sign(null, Buffer.from(payloadB64), privateKey);
const token = `${payloadB64}.${b64url(sig)}`;

const safeName = customer.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const outFile = path.join(process.cwd(), `${safeName}.lic`);
fs.writeFileSync(outFile, token + '\n');

console.log('=== GroOne License ===');
console.log(`Customer : ${customer}`);
console.log(`Plan     : desktop_yearly`);
console.log(`Issued   : ${now.toISOString().slice(0, 10)}`);
console.log(`Expires  : ${expires.toISOString().slice(0, 10)} (${durationDays} days)`);
console.log(`Machine  : ${machineId ? machineId + ' (PC-locked)' : 'ANY (unbound)'}`);
console.log(`\nLicense key (give this to the customer):\n`);
console.log(token);
console.log(`\nAlso saved to: ${outFile}`);
