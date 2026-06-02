/**
 * Embedded Ed25519 PUBLIC key for offline license verification.
 *
 * The matching PRIVATE key lives only with the vendor
 * (desktop/tools/license-gen/license-private.pem, gitignored) and is used by
 * gen.js to mint per-customer license tokens. The app verifies tokens against
 * this public key entirely offline — no server, no network.
 *
 * Rotating the key (e.g. if the private key leaks) means shipping a new app
 * build with the new public key and re-issuing customer licenses.
 */
export const LICENSE_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAU/uuQWa+7VVbNz6O8IpQMVf+eSHnHDN9a00y+vKY7Bs=
-----END PUBLIC KEY-----
`;
