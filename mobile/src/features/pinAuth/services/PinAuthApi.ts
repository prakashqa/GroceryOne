/**
 * PinAuthApi
 * API service for PIN authentication with backend
 */

import { API_CONFIG, API_ENDPOINTS } from '../../../core/config/api.config';

export interface PinLoginRequest {
  identifier: string;
  pin: string;
  tenantSlug: string;
}

export interface ResolveTenantResponse {
  tenantSlug: string;
  tenantName: string;
  userFirstName: string;
}

export interface ResolveTenantResult {
  success: boolean;
  data?: ResolveTenantResponse;
  error?: string;
}

export interface PinLoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tenantSlug?: string;
  user: {
    id: string;
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    role: string;
    tenantId?: string;
  };
}

export interface PinAuthResult {
  success: boolean;
  data?: PinLoginResponse;
  error?: string;
}

/**
 * Service for PIN authentication API calls
 */
export interface SignupRequest {
  businessName: string;
  ownerFirstName: string;
  ownerLastName?: string;
  email: string;
  phone: string;
  password: string;
}

export interface SignupResult {
  success: boolean;
  data?: PinLoginResponse;
  error?: string;
}

export const PinAuthApi = {
  /**
   * Verify PIN with backend API
   * @param request - PIN login request with identifier, pin, and tenant
   * @returns Promise resolving to auth result
   */
  async verifyPin(request: PinLoginRequest): Promise<PinAuthResult> {
    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.LOGIN_PIN}`;

    // Debug logging for troubleshooting
    if (__DEV__) {
      console.log('[PinAuthApi] Verifying PIN...');
      console.log('[PinAuthApi] URL:', url);
      console.log('[PinAuthApi] Tenant:', request.tenantSlug);
      console.log('[PinAuthApi] Identifier:', request.identifier);
    }

    // Create abort controller for timeout (5 seconds for PIN verification)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': request.tenantSlug,
          'X-API-Version': API_CONFIG.VERSION,
        },
        body: JSON.stringify({
          identifier: request.identifier,
          pin: request.pin,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (__DEV__) {
        console.log('[PinAuthApi] Response status:', response.status);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (__DEV__) {
          console.log('[PinAuthApi] Error response:', errorData);
        }
        return {
          success: false,
          error: errorData.message || 'Invalid credentials',
        };
      }

      const data = await response.json();

      // Handle backend response format (may be wrapped in {success, data})
      const responseData = data.data || data;

      if (__DEV__) {
        console.log('[PinAuthApi] Success! User:', responseData.user?.email);
      }

      return {
        success: true,
        data: responseData,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      if (__DEV__) {
        console.error('[PinAuthApi] Network error:', errorMessage);
        console.error('[PinAuthApi] Full error:', error);
      }

      // Map raw network errors to actionable messages
      const isNetworkError =
        errorMessage === 'Network request failed' ||
        errorMessage === 'Failed to fetch' ||
        errorMessage.includes('ECONNREFUSED');

      if (isNetworkError) {
        const devHint = __DEV__ ? ` (${url})` : '';
        return {
          success: false,
          error: `Server unreachable. Check that backend is running and device is on the same WiFi.${devHint}`,
        };
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Resolve tenant from user email/phone.
   * Called during initial device setup to discover which tenant a user belongs to.
   * Does NOT require authentication or tenant context.
   * @param identifier - User email or phone number
   * @returns Promise resolving to tenant info or error
   */
  /**
   * Register a new business (signup).
   * Does NOT require tenant context — creates a new tenant.
   * @param request - Signup data
   * @returns Promise resolving to auth result with tokens + tenantSlug
   */
  async signup(request: SignupRequest): Promise<SignupResult> {
    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.SIGNUP}`;

    if (__DEV__) {
      console.log('[PinAuthApi] Signing up...');
      console.log('[PinAuthApi] URL:', url);
      console.log('[PinAuthApi] Email:', request.email);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Version': API_CONFIG.VERSION,
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || 'Signup failed',
        };
      }

      const data = await response.json();
      const responseData = data.data || data;

      if (__DEV__) {
        console.log('[PinAuthApi] Signup success! Tenant:', responseData.tenantSlug);
      }

      return {
        success: true,
        data: responseData,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timed out. Please check your connection and try again.',
        };
      }

      const errorMessage = error instanceof Error ? error.message : 'Network error';
      const isNetworkError =
        errorMessage === 'Network request failed' ||
        errorMessage === 'Failed to fetch' ||
        errorMessage.includes('ECONNREFUSED');

      if (isNetworkError) {
        const devHint = __DEV__ ? ` (${url})` : '';
        return {
          success: false,
          error: `Server unreachable. Check that backend is running and device is on the same WiFi.${devHint}`,
        };
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  async resolveTenant(identifier: string): Promise<ResolveTenantResult> {
    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.RESOLVE_TENANT}`;

    if (__DEV__) {
      console.log('[PinAuthApi] Resolving tenant for:', identifier);
      console.log('[PinAuthApi] URL:', url);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Version': API_CONFIG.VERSION,
        },
        body: JSON.stringify({ identifier }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || 'No account found for this email',
        };
      }

      const data = await response.json();
      const responseData = data.data || data;

      if (__DEV__) {
        console.log('[PinAuthApi] Tenant resolved:', responseData.tenantSlug);
      }

      return {
        success: true,
        data: responseData,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      // Detect AbortController timeout and show user-friendly message
      if (error instanceof Error && error.name === 'AbortError') {
        if (__DEV__) {
          console.error('[PinAuthApi] Resolve tenant timed out');
        }
        return {
          success: false,
          error: 'Request timed out. Please check your connection and try again.',
        };
      }

      const errorMessage = error instanceof Error ? error.message : 'Network error';
      if (__DEV__) {
        console.error('[PinAuthApi] Resolve tenant error:', errorMessage);
      }

      // Map raw network errors to actionable messages
      const isNetworkError =
        errorMessage === 'Network request failed' ||
        errorMessage === 'Failed to fetch' ||
        errorMessage.includes('ECONNREFUSED');

      if (isNetworkError) {
        const devHint = __DEV__ ? ` (${url})` : '';
        return {
          success: false,
          error: `Server unreachable. Check that backend is running and device is on the same WiFi.${devHint}`,
        };
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  },
};
