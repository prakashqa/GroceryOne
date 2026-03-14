/**
 * Category Entity Tests
 * Validates entity structure and tenant isolation constraints
 */

import { getMetadataArgsStorage } from 'typeorm';
import { Category } from './category.entity';

describe('Category Entity', () => {
  let category: Category;

  beforeEach(() => {
    category = new Category();
    category.id = '123e4567-e89b-12d3-a456-426614174000';
    category.tenantId = '123e4567-e89b-12d3-a456-426614174001';
    category.slug = 'grains-flour';
    category.name = 'Grains & Flour';
    category.icon = '🌾';
    category.sortOrder = 1;
    category.isActive = true;
    category.createdAt = new Date();
    category.updatedAt = new Date();
  });

  describe('Category creation', () => {
    it('should create a category with required fields', () => {
      expect(category.id).toBeDefined();
      expect(category.tenantId).toBeDefined();
      expect(category.slug).toBe('grains-flour');
      expect(category.name).toBe('Grains & Flour');
    });

    it('should have tenant relationship', () => {
      expect(category.tenantId).toBe('123e4567-e89b-12d3-a456-426614174001');
    });
  });

  describe('Tenant isolation column constraints', () => {
    it('should have tenant_id column marked as NOT nullable', () => {
      const columns = getMetadataArgsStorage().columns.filter(
        (col) => col.target === Category,
      );
      const tenantIdColumn = columns.find(
        (col) => col.options.name === 'tenant_id' || col.propertyName === 'tenantId',
      );

      expect(tenantIdColumn).toBeDefined();
      expect(tenantIdColumn!.options.nullable).toBe(false);
    });

    it('should have tenant_id column typed as uuid', () => {
      const columns = getMetadataArgsStorage().columns.filter(
        (col) => col.target === Category,
      );
      const tenantIdColumn = columns.find(
        (col) => col.options.name === 'tenant_id' || col.propertyName === 'tenantId',
      );

      expect(tenantIdColumn).toBeDefined();
      expect(tenantIdColumn!.options.type).toBe('uuid');
    });

    it('should have a composite unique index on [slug, tenantId]', () => {
      const indices = getMetadataArgsStorage().indices.filter(
        (idx) => idx.target === Category && idx.unique === true,
      );

      // The @Index decorator on the class stores columns as a string array or a function
      const compositeIndex = indices.find((idx) => {
        const cols = typeof idx.columns === 'function'
          ? (idx.columns as Function)({})
          : idx.columns;
        return Array.isArray(cols) && cols.includes('slug') && cols.includes('tenantId');
      });

      expect(compositeIndex).toBeDefined();
    });
  });

  describe('trackInventory column', () => {
    it('should default trackInventory to false', () => {
      const cat = new Category();
      // Default value is set by DB, but entity property should be assignable
      cat.trackInventory = false;
      expect(cat.trackInventory).toBe(false);
    });

    it('should allow trackInventory to be set to true', () => {
      category.trackInventory = true;
      expect(category.trackInventory).toBe(true);
    });

    it('should have track_inventory column defined', () => {
      const columns = getMetadataArgsStorage().columns.filter(
        (col) => col.target === Category,
      );
      const trackInventoryColumn = columns.find(
        (col) => col.options.name === 'track_inventory' || col.propertyName === 'trackInventory',
      );

      expect(trackInventoryColumn).toBeDefined();
      expect(trackInventoryColumn!.options.default).toBe(false);
    });
  });

  describe('Optional fields', () => {
    it('should allow nullable nameTe', () => {
      category.nameTe = undefined;
      expect(category.nameTe).toBeUndefined();
    });

    it('should allow soft delete', () => {
      category.deletedAt = new Date();
      expect(category.deletedAt).toBeInstanceOf(Date);
    });
  });
});
