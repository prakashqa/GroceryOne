/**
 * Product-related type definitions
 */

export interface Category {
  id: string;
  name: string;
  nameTe?: string; // Telugu name
  slug: string;
  description?: string;
  descriptionTe?: string;
  imageUrl?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  children?: Category[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  nameTe?: string; // Telugu name
  slug: string;
  description?: string;
  descriptionTe?: string;
  sku: string;
  barcode?: string;
  stockQuantity: number;
  lowStockThreshold: number;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  taxPercentage: number;
  unit: ProductUnit;
  unitValue: number;
  brand?: string;
  originCountry?: string;
  thumbnailUrl?: string;
  images?: ProductImage[];
  variants?: ProductVariant[];
  isActive: boolean;
  isFeatured: boolean;
  isOrganic: boolean;
  isVegan: boolean;
  metaTitle?: string;
  metaDescription?: string;
  averageRating: number;
  reviewCount: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductUnit = 'kg' | 'g' | 'l' | 'ml' | 'piece' | 'pack' | 'dozen';

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  skuSuffix?: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  unitValue?: number;
  isActive: boolean;
  sortOrder: number;
}

export interface ProductFilter {
  categoryId?: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  brands?: string[];
  minRating?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  isOrganic?: boolean;
  isVegan?: boolean;
  search?: string;
}

export interface ProductSort {
  field: ProductSortField;
  direction: SortDirection;
}

export type ProductSortField = 'price' | 'name' | 'rating' | 'createdAt' | 'popularity';

export type SortDirection = 'asc' | 'desc';

export interface Review {
  id: string;
  productId: string;
  userId: string;
  orderId?: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  isFeatured: boolean;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export const PRODUCT_UNITS: Record<ProductUnit, { label: string; labelTe: string }> = {
  kg: { label: 'Kilogram', labelTe: 'కిలోగ్రాము' },
  g: { label: 'Gram', labelTe: 'గ్రాము' },
  l: { label: 'Liter', labelTe: 'లీటర్' },
  ml: { label: 'Milliliter', labelTe: 'మిల్లీలీటర్' },
  piece: { label: 'Piece', labelTe: 'ముక్క' },
  pack: { label: 'Pack', labelTe: 'ప్యాక్' },
  dozen: { label: 'Dozen', labelTe: 'డజను' },
};
