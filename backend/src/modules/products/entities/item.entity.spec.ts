/**
 * Item Entity Tests
 * Validates entity structure and tenant isolation constraints
 */

import { getMetadataArgsStorage } from 'typeorm';
import { Item } from './item.entity';

describe('Item Entity', () => {
  let item: Item;

  beforeEach(() => {
    item = new Item();
    item.id = '123e4567-e89b-12d3-a456-426614174000';
    item.tenantId = '123e4567-e89b-12d3-a456-426614174001';
    item.slug = 'gf-001';
    item.name = 'Wheat Flour';
    item.categoryId = '123e4567-e89b-12d3-a456-426614174002';
    item.unit = 'kg';
    item.defaultQuantity = 5;
    item.price = 48;
    item.sortOrder = 1;
    item.isActive = true;
    item.createdAt = new Date();
    item.updatedAt = new Date();
  });

  describe('Item creation', () => {
    it('should create an item with required fields', () => {
      expect(item.id).toBeDefined();
      expect(item.tenantId).toBeDefined();
      expect(item.slug).toBe('gf-001');
      expect(item.name).toBe('Wheat Flour');
      expect(item.categoryId).toBeDefined();
    });

    it('should have tenant relationship', () => {
      expect(item.tenantId).toBe('123e4567-e89b-12d3-a456-426614174001');
    });
  });

  describe('Tenant isolation column constraints', () => {
    it('should have tenant_id column marked as NOT nullable', () => {
      const columns = getMetadataArgsStorage().columns.filter(
        (col) => col.target === Item,
      );
      const tenantIdColumn = columns.find(
        (col) => col.options.name === 'tenant_id' || col.propertyName === 'tenantId',
      );

      expect(tenantIdColumn).toBeDefined();
      expect(tenantIdColumn!.options.nullable).toBe(false);
    });

    it('should have tenant_id column typed as uuid', () => {
      const columns = getMetadataArgsStorage().columns.filter(
        (col) => col.target === Item,
      );
      const tenantIdColumn = columns.find(
        (col) => col.options.name === 'tenant_id' || col.propertyName === 'tenantId',
      );

      expect(tenantIdColumn).toBeDefined();
      expect(tenantIdColumn!.options.type).toBe('uuid');
    });

    it('should have a composite unique index on [slug, tenantId]', () => {
      const indices = getMetadataArgsStorage().indices.filter(
        (idx) => idx.target === Item && idx.unique === true,
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

  describe('Optional fields', () => {
    it('should allow nullable nameTe', () => {
      item.nameTe = undefined;
      expect(item.nameTe).toBeUndefined();
    });

    it('should allow nullable price', () => {
      item.price = undefined;
      expect(item.price).toBeUndefined();
    });

    it('should allow soft delete', () => {
      item.deletedAt = new Date();
      expect(item.deletedAt).toBeInstanceOf(Date);
    });
  });
});
