import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware - Tenant Resolution & Auth Guard
 *
 * Handles:
 * 1. Subdomain-based tenant resolution (e.g., freshmart.groceryone.app)
 * 2. Auth redirects for protected routes
 * 3. Tenant context cookie management
 */

const AUTH_ROUTES = ['/tenant-setup', '/signup', '/subscription-plan', '/pin-setup', '/pin-login'];
const PUBLIC_ROUTES = [...AUTH_ROUTES, '/subscription/expired'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Extract tenant from subdomain
  const hostname = request.headers.get('host') || '';
  const parts = hostname.split('.');

  // Check for subdomain tenant (e.g., freshmart.groceryone.app has 3+ parts)
  if (parts.length >= 3 && parts[0] !== 'www') {
    const tenantSlug = parts[0];
    // Set tenant cookie for SSR access
    response.cookies.set('tenant_slug', tenantSlug, {
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  // For localhost development, skip tenant resolution (handled by client-side Redux)
  // Auth protection is handled client-side since JWT is in localStorage

  return response;
}

export const config = {
  // Match all routes except static files and API
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
