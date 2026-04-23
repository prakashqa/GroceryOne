/**
 * Tenant and User Seed Data
 * Test data for two tenants with admin and customer users
 */

import {
  TenantStatus,
  SubscriptionPlan,
} from '../../tenant/entities/tenant.entity';
import { UserRole, UserStatus } from '../../modules/users/entities/user.entity';

export interface TenantSeed {
  name: string;
  slug: string;
  domain?: string;
  status: TenantStatus;
  subscriptionPlan: SubscriptionPlan;
  contactEmail: string;
  contactPhone: string;
  businessAddress?: string;
  primaryColor: string;
  secondaryColor: string;
  defaultLanguage: string;
  supportedLanguages: string[];
  currency: string;
  timezone: string;
}

export interface UserSeed {
  tenantSlug: string;
  email: string;
  phone?: string;
  password: string; // Plain text - will be hashed during seeding
  pin: string; // 4-digit PIN - will be hashed during seeding
  firstName: string;
  lastName?: string;
  role: UserRole;
  status: UserStatus;
  preferredLanguage: string;
}

/**
 * Two test tenants for multi-tenant functionality testing
 */
export const SEED_TENANTS: TenantSeed[] = [
  {
    name: 'FreshMart Groceries',
    slug: 'freshmart',
    domain: 'freshmart.groceryone.local',
    status: 'active',
    subscriptionPlan: 'premium',
    contactEmail: 'contact@freshmart.com',
    contactPhone: '+91-9876543210',
    businessAddress: 'MG Road, Hyderabad',
    primaryColor: '#4CAF50',
    secondaryColor: '#8BC34A',
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'te', 'hi'],
    currency: 'INR',
    timezone: 'Asia/Kolkata',
  },
  {
    name: 'QuickBasket Store',
    slug: 'quickbasket',
    domain: 'quickbasket.groceryone.local',
    status: 'active',
    subscriptionPlan: 'standard',
    contactEmail: 'info@quickbasket.com',
    contactPhone: '+91-9123456780',
    businessAddress: 'Jubilee Hills, Hyderabad',
    primaryColor: '#2196F3',
    secondaryColor: '#03A9F4',
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'te'],
    currency: 'INR',
    timezone: 'Asia/Kolkata',
  },
  {
    name: 'AB Trade',
    slug: 'abtrade',
    domain: 'abtrade.groceryone.local',
    status: 'active',
    subscriptionPlan: 'standard',
    contactEmail: 'contact@abtrade.com',
    contactPhone: '+91-9000000001',
    businessAddress: '',
    primaryColor: '#1976D2',
    secondaryColor: '#42A5F5',
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'te'],
    currency: 'INR',
    timezone: 'Asia/Kolkata',
  },
  {
    name: 'Vijay Parcel POS',
    slug: 'vijayparcelpos',
    domain: 'vijayparcelpos.groceryone.local',
    status: 'active',
    subscriptionPlan: 'standard',
    contactEmail: 'contact@vijayparcelpos.com',
    contactPhone: '+91-9345678901',
    businessAddress: '',
    primaryColor: '#FF5722',
    secondaryColor: '#FF9800',
    defaultLanguage: 'te',
    supportedLanguages: ['te', 'en'],
    currency: 'INR',
    timezone: 'Asia/Kolkata',
  },
];

/**
 * Test users for each tenant
 * Passwords follow pattern: Role + @ + TenantInitials + 123
 * PINs are simple 4-digit codes for testing
 */
export const SEED_USERS: UserSeed[] = [
  // FreshMart Users
  {
    tenantSlug: 'freshmart',
    email: 'admin@freshmart.com',
    phone: '+91-9876543211',
    password: 'Admin@FM123',
    pin: '1234',
    firstName: 'Rajesh',
    lastName: 'Kumar',
    role: 'admin',
    status: 'active',
    preferredLanguage: 'en',
  },
  {
    tenantSlug: 'freshmart',
    email: 'customer@freshmart.com',
    phone: '+91-9876543212',
    password: 'Customer@FM123',
    pin: '5678',
    firstName: 'Priya',
    lastName: 'Sharma',
    role: 'cashier',
    status: 'active',
    preferredLanguage: 'te',
  },
  // QuickBasket Users
  {
    tenantSlug: 'quickbasket',
    email: 'admin@quickbasket.com',
    phone: '+91-9123456781',
    password: 'Admin@QB123',
    pin: '4321',
    firstName: 'Suresh',
    lastName: 'Reddy',
    role: 'admin',
    status: 'active',
    preferredLanguage: 'en',
  },
  {
    tenantSlug: 'quickbasket',
    email: 'customer@quickbasket.com',
    phone: '+91-9123456782',
    password: 'Customer@QB123',
    pin: '8765',
    firstName: 'Lakshmi',
    lastName: 'Devi',
    role: 'cashier',
    status: 'active',
    preferredLanguage: 'te',
  },
  // AB Trade Users
  {
    tenantSlug: 'abtrade',
    email: 'suresh@abtrade.com',
    phone: '+91-9000000002',
    password: 'Admin@AB123',
    pin: '1567',
    firstName: 'Suresh',
    lastName: '',
    role: 'admin',
    status: 'active',
    preferredLanguage: 'en',
  },
  // Vijay Parcel POS Users
  {
    tenantSlug: 'vijayparcelpos',
    email: 'admin@vijayparcelpos.com',
    phone: '+91-9345678902',
    password: 'Admin@VP123',
    pin: '2468',
    firstName: 'Vijay',
    lastName: 'Reddy',
    role: 'admin',
    status: 'active',
    preferredLanguage: 'te',
  },
  {
    tenantSlug: 'vijayparcelpos',
    email: 'customer@vijayparcelpos.com',
    phone: '+91-9345678903',
    password: 'Customer@VP123',
    pin: '1357',
    firstName: 'Srikanth',
    lastName: 'Naidu',
    role: 'cashier',
    status: 'active',
    preferredLanguage: 'te',
  },
];

/**
 * Login credentials summary for documentation/testing
 */
export const LOGIN_CREDENTIALS = {
  freshmart: {
    tenantSlug: 'freshmart',
    admin: { email: 'admin@freshmart.com', password: 'Admin@FM123', pin: '1234' },
    cashier: { email: 'customer@freshmart.com', password: 'Customer@FM123', pin: '5678' },
  },
  quickbasket: {
    tenantSlug: 'quickbasket',
    admin: { email: 'admin@quickbasket.com', password: 'Admin@QB123', pin: '4321' },
    cashier: { email: 'customer@quickbasket.com', password: 'Customer@QB123', pin: '8765' },
  },
  vijayparcelpos: {
    tenantSlug: 'vijayparcelpos',
    admin: { email: 'admin@vijayparcelpos.com', password: 'Admin@VP123', pin: '2468' },
    cashier: { email: 'customer@vijayparcelpos.com', password: 'Customer@VP123', pin: '1357' },
  },
  abtrade: {
    tenantSlug: 'abtrade',
    admin: { email: 'suresh@abtrade.com', password: 'Admin@AB123', pin: '1567' },
  },
};
