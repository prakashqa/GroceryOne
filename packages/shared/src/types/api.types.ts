/**
 * API-related type definitions
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: Record<string, unknown>;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface ApiRequestConfig {
  tenantId?: string;
  language?: string;
  accessToken?: string;
}

// Common error codes
export const API_ERROR_CODES = {
  // Auth errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Tenant errors
  TENANT_NOT_FOUND: 'TENANT_NOT_FOUND',
  TENANT_INACTIVE: 'TENANT_INACTIVE',
  TENANT_SUSPENDED: 'TENANT_SUSPENDED',

  // Product errors
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  PRODUCT_OUT_OF_STOCK: 'PRODUCT_OUT_OF_STOCK',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',

  // Cart errors
  CART_EMPTY: 'CART_EMPTY',
  CART_ITEM_NOT_FOUND: 'CART_ITEM_NOT_FOUND',

  // Order errors
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  ORDER_CANNOT_CANCEL: 'ORDER_CANNOT_CANCEL',
  INVALID_ORDER_STATUS: 'INVALID_ORDER_STATUS',

  // Coupon errors
  COUPON_NOT_FOUND: 'COUPON_NOT_FOUND',
  COUPON_EXPIRED: 'COUPON_EXPIRED',
  COUPON_INVALID: 'COUPON_INVALID',
  COUPON_LIMIT_REACHED: 'COUPON_LIMIT_REACHED',
  MIN_ORDER_NOT_MET: 'MIN_ORDER_NOT_MET',

  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];
