/**
 * Shared logout helper used by Sidebar.tsx and Header.tsx.
 *
 * The previous inline implementation aggressively wiped @tenant_data, leaving
 * the next-launch flow with no way to know which store this device belongs to
 * — the user had to retype their email in "Setup New Store" before they could
 * enter their PIN. We now preserve the NON-SENSITIVE store-identity context
 * across logout (slug, name, branding, last identifier) so re-login is a
 * single PIN tap. Switching this device to a different store still works via
 * the "Setup New Store" flow, which overwrites @tenant_data.
 *
 * What's removed (session-sensitive):
 *   - @auth_tokens_*    JWT access + refresh tokens, per-tenant keyed
 *   - @catalog*         per-user catalog snapshot
 *   - @multicart*       in-flight carts
 *   - @settings*        transient UI settings tied to the signed-in user
 *
 * What's preserved (non-sensitive identity context):
 *   - @tenant_data, @tenant_id      which store this device belongs to
 *   - @last_identifier_*            email/phone last used (per-tenant)
 *   - @groone:last_login            global last-login hint (see pin-login)
 *   - i18nextLng                    chosen language
 */

import { logout } from '@groceryone/store';

// Loose dispatch signature so this helper can be shared between Sidebar.tsx
// + Header.tsx without coupling to the precise Redux store typing.
type DispatchLike = (action: { type: string } | unknown) => unknown;

// Anything matching one of these prefixes is removed from localStorage.
// Anything else (including @tenant*, @last_identifier_*, @groone:last_login,
// i18nextLng) is left alone so the next sign-in is one tap.
const PREFIXES_TO_REMOVE = ['@auth_tokens_', '@catalog', '@multicart', '@settings'];

export function shouldRemoveOnLogout(key: string): boolean {
  return PREFIXES_TO_REMOVE.some((p) => key.startsWith(p));
}

interface RouterLike {
  push: (href: string) => void;
}

export function performLogout(dispatch: DispatchLike, router: RouterLike): void {
  // Clear Redux session. We deliberately do NOT dispatch clearTenant() — the
  // store identity stays in Redux + localStorage so the next launch lands on
  // PIN-login with the email pre-filled and the tenant slug available for the
  // /auth/login/pin request.
  dispatch(logout());

  if (typeof window !== 'undefined' && window.localStorage) {
    for (const key of Object.keys(window.localStorage)) {
      if (shouldRemoveOnLogout(key)) {
        window.localStorage.removeItem(key);
      }
    }
  }

  router.push('/pin-login');
}
