/**
 * User-related type definitions
 */

export interface User {
  id: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  role: UserRole;
  status: UserStatus;
  preferredLanguage: string;
  notificationPreferences: NotificationPreferences;
  lastLoginAt?: Date;
  emailVerifiedAt?: Date;
  phoneVerifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'cashier' | 'admin' | 'manager' | 'super_admin';

export type UserStatus = 'active' | 'inactive' | 'blocked';

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface NotificationPreferences {
  push: boolean;
  email: boolean;
  sms: boolean;
  orderUpdates: boolean;
  promotions: boolean;
}

export interface Address {
  id: string;
  userId: string;
  label: AddressLabel;
  fullName?: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  deliveryInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type AddressLabel = 'home' | 'work' | 'other';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email?: string;
  phone?: string;
  password: string;
}

export interface RegisterData {
  email?: string;
  phone?: string;
  password: string;
  firstName: string;
  lastName?: string;
}

export interface SignupData {
  businessName: string;
  ownerFirstName: string;
  ownerLastName?: string;
  email: string;
  phone: string;
  password: string;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  push: true,
  email: true,
  sms: false,
  orderUpdates: true,
  promotions: true,
};
