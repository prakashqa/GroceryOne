/**
 * Unit Conversion Utility Tests
 * TDD tests for gram/kilogram and ml/L conversions
 */

import {
  isWeightUnit,
  isVolumeUnit,
  isConvertibleUnit,
  getAlternateUnit,
  getBaseUnit,
  convertQuantity,
  normalizeToBaseUnit,
  formatQuantityWithUnit,
  getPresetQuantitiesForUnit,
  type ItemUnit,
} from '../unitConversion';

describe('unitConversion', () => {
  describe('type guards', () => {
    describe('isWeightUnit', () => {
      it('should return true for kg', () => {
        expect(isWeightUnit('kg')).toBe(true);
      });

      it('should return true for gm', () => {
        expect(isWeightUnit('gm')).toBe(true);
      });

      it('should return false for L', () => {
        expect(isWeightUnit('L')).toBe(false);
      });

      it('should return false for pcs', () => {
        expect(isWeightUnit('pcs')).toBe(false);
      });
    });

    describe('isVolumeUnit', () => {
      it('should return true for L', () => {
        expect(isVolumeUnit('L')).toBe(true);
      });

      it('should return true for ml', () => {
        expect(isVolumeUnit('ml')).toBe(true);
      });

      it('should return false for kg', () => {
        expect(isVolumeUnit('kg')).toBe(false);
      });

      it('should return false for pcs', () => {
        expect(isVolumeUnit('pcs')).toBe(false);
      });
    });

    describe('isConvertibleUnit', () => {
      it('should return true for weight units', () => {
        expect(isConvertibleUnit('kg')).toBe(true);
        expect(isConvertibleUnit('gm')).toBe(true);
      });

      it('should return true for volume units', () => {
        expect(isConvertibleUnit('L')).toBe(true);
        expect(isConvertibleUnit('ml')).toBe(true);
      });

      it('should return false for pcs', () => {
        expect(isConvertibleUnit('pcs')).toBe(false);
      });
    });
  });

  describe('getAlternateUnit', () => {
    it('should return gm for kg', () => {
      expect(getAlternateUnit('kg')).toBe('gm');
    });

    it('should return kg for gm', () => {
      expect(getAlternateUnit('gm')).toBe('kg');
    });

    it('should return ml for L', () => {
      expect(getAlternateUnit('L')).toBe('ml');
    });

    it('should return L for ml', () => {
      expect(getAlternateUnit('ml')).toBe('L');
    });

    it('should return null for pcs', () => {
      expect(getAlternateUnit('pcs')).toBeNull();
    });
  });

  describe('getBaseUnit', () => {
    it('should return kg for weight units', () => {
      expect(getBaseUnit('kg')).toBe('kg');
      expect(getBaseUnit('gm')).toBe('kg');
    });

    it('should return L for volume units', () => {
      expect(getBaseUnit('L')).toBe('L');
      expect(getBaseUnit('ml')).toBe('L');
    });

    it('should return same unit for pcs', () => {
      expect(getBaseUnit('pcs')).toBe('pcs');
    });
  });

  describe('convertQuantity', () => {
    describe('weight conversions', () => {
      it('should convert gm to kg', () => {
        expect(convertQuantity(500, 'gm', 'kg')).toBe(0.5);
        expect(convertQuantity(1000, 'gm', 'kg')).toBe(1);
        expect(convertQuantity(250, 'gm', 'kg')).toBe(0.25);
      });

      it('should convert kg to gm', () => {
        expect(convertQuantity(0.5, 'kg', 'gm')).toBe(500);
        expect(convertQuantity(2.5, 'kg', 'gm')).toBe(2500);
        expect(convertQuantity(1, 'kg', 'gm')).toBe(1000);
      });

      it('should return same value for same unit', () => {
        expect(convertQuantity(5, 'kg', 'kg')).toBe(5);
        expect(convertQuantity(500, 'gm', 'gm')).toBe(500);
      });
    });

    describe('volume conversions', () => {
      it('should convert ml to L', () => {
        expect(convertQuantity(500, 'ml', 'L')).toBe(0.5);
        expect(convertQuantity(1000, 'ml', 'L')).toBe(1);
        expect(convertQuantity(750, 'ml', 'L')).toBe(0.75);
      });

      it('should convert L to ml', () => {
        expect(convertQuantity(0.5, 'L', 'ml')).toBe(500);
        expect(convertQuantity(2, 'L', 'ml')).toBe(2000);
        expect(convertQuantity(1.5, 'L', 'ml')).toBe(1500);
      });

      it('should return same value for same unit', () => {
        expect(convertQuantity(5, 'L', 'L')).toBe(5);
        expect(convertQuantity(500, 'ml', 'ml')).toBe(500);
      });
    });

    describe('error handling', () => {
      it('should throw error when converting between incompatible units', () => {
        expect(() => convertQuantity(5, 'kg', 'L')).toThrow();
        expect(() => convertQuantity(500, 'gm', 'ml')).toThrow();
      });
    });
  });

  describe('normalizeToBaseUnit', () => {
    it('should normalize gm to kg', () => {
      const result = normalizeToBaseUnit(500, 'gm');
      expect(result).toEqual({ quantity: 0.5, baseUnit: 'kg' });
    });

    it('should keep kg as is', () => {
      const result = normalizeToBaseUnit(2, 'kg');
      expect(result).toEqual({ quantity: 2, baseUnit: 'kg' });
    });

    it('should normalize ml to L', () => {
      const result = normalizeToBaseUnit(750, 'ml');
      expect(result).toEqual({ quantity: 0.75, baseUnit: 'L' });
    });

    it('should keep L as is', () => {
      const result = normalizeToBaseUnit(1.5, 'L');
      expect(result).toEqual({ quantity: 1.5, baseUnit: 'L' });
    });

    it('should keep pcs unchanged', () => {
      const result = normalizeToBaseUnit(3, 'pcs');
      expect(result).toEqual({ quantity: 3, baseUnit: 'pcs' });
    });
  });

  describe('formatQuantityWithUnit', () => {
    it('should format kg quantity as gm when displayUnit is gm', () => {
      const result = formatQuantityWithUnit(0.5, 'kg', 'gm');
      expect(result.value).toBe(500);
      expect(result.unit).toBe('gm');
      expect(result.formatted).toBe('500 gm');
    });

    it('should format 0.25 kg as 250 gm for cart stepper display', () => {
      const result = formatQuantityWithUnit(0.25, 'kg', 'gm');
      expect(result.value).toBe(250);
      expect(result.unit).toBe('gm');
      expect(result.formatted).toBe('250 gm');
    });

    it('should format kg quantity as kg when displayUnit is kg', () => {
      const result = formatQuantityWithUnit(2.5, 'kg', 'kg');
      expect(result.value).toBe(2.5);
      expect(result.unit).toBe('kg');
      expect(result.formatted).toBe('2.5 kg');
    });

    it('should format L quantity as ml when displayUnit is ml', () => {
      const result = formatQuantityWithUnit(0.75, 'L', 'ml');
      expect(result.value).toBe(750);
      expect(result.unit).toBe('ml');
      expect(result.formatted).toBe('750 ml');
    });

    it('should auto-convert to gm when displayUnit is not provided and qty < 1 kg', () => {
      const result = formatQuantityWithUnit(0.5, 'kg');
      expect(result.value).toBe(500);
      expect(result.unit).toBe('gm');
      expect(result.formatted).toBe('500 gm');
    });

    it('should handle pcs correctly', () => {
      const result = formatQuantityWithUnit(3, 'pcs');
      expect(result.value).toBe(3);
      expect(result.unit).toBe('pcs');
      expect(result.formatted).toBe('3 pcs');
    });

    it('should auto-convert and round sub-kg values to gm', () => {
      const result = formatQuantityWithUnit(0.333, 'kg', 'kg');
      expect(result.value).toBe(333);
      expect(result.unit).toBe('gm');
      expect(result.formatted).toBe('333 gm');
    });
  });

  describe('formatQuantityWithUnit - auto-conversion for sub-unit quantities', () => {
    it('should auto-convert 0.002 kg to 2 gm when displayUnit is kg', () => {
      const result = formatQuantityWithUnit(0.002, 'kg', 'kg');
      expect(result.value).toBe(2);
      expect(result.unit).toBe('gm');
    });

    it('should auto-convert 0.5 kg to 500 gm when displayUnit is kg', () => {
      const result = formatQuantityWithUnit(0.5, 'kg', 'kg');
      expect(result.value).toBe(500);
      expect(result.unit).toBe('gm');
    });

    it('should auto-convert 0.25 kg to 250 gm when displayUnit is kg', () => {
      const result = formatQuantityWithUnit(0.25, 'kg', 'kg');
      expect(result.value).toBe(250);
      expect(result.unit).toBe('gm');
    });

    it('should NOT auto-convert when qty >= 1 kg', () => {
      const result = formatQuantityWithUnit(2, 'kg', 'kg');
      expect(result.value).toBe(2);
      expect(result.unit).toBe('kg');
    });

    it('should auto-convert 0.1 L to 100 ml when displayUnit is L', () => {
      const result = formatQuantityWithUnit(0.1, 'L', 'L');
      expect(result.value).toBe(100);
      expect(result.unit).toBe('ml');
    });

    it('should NOT auto-convert when qty >= 1 L', () => {
      const result = formatQuantityWithUnit(1.5, 'L', 'L');
      expect(result.value).toBe(1.5);
      expect(result.unit).toBe('L');
    });

    it('should auto-convert 0.002 kg to 2 gm when no displayUnit (defaults to baseUnit)', () => {
      const result = formatQuantityWithUnit(0.002, 'kg');
      expect(result.value).toBe(2);
      expect(result.unit).toBe('gm');
    });

    it('should NOT auto-convert 0 kg (zero qty stays as-is)', () => {
      const result = formatQuantityWithUnit(0, 'kg', 'kg');
      expect(result.value).toBe(0);
      expect(result.unit).toBe('kg');
    });

    it('should NOT auto-convert pcs units', () => {
      const result = formatQuantityWithUnit(0.5, 'pcs');
      expect(result.value).toBe(0.5);
      expect(result.unit).toBe('pcs');
    });
  });

  describe('formatQuantityWithUnit - cart display with getBaseUnit', () => {
    // Cart stores quantity in base unit (kg/L). Item.unit may be 'gm'/'ml'.
    // Correct call: formatQuantityWithUnit(qty, getBaseUnit(item.unit), item.unit)

    it('should format 0.25 stored-in-kg as "250 gm" when item unit is gm', () => {
      const result = formatQuantityWithUnit(0.25, getBaseUnit('gm' as ItemUnit), 'gm');
      expect(result.value).toBe(250);
      expect(result.unit).toBe('gm');
      expect(result.formatted).toBe('250 gm');
    });

    it('should format 1 stored-in-kg as "1000 gm" when item unit is gm', () => {
      const result = formatQuantityWithUnit(1, getBaseUnit('gm' as ItemUnit), 'gm');
      expect(result.value).toBe(1000);
      expect(result.unit).toBe('gm');
      expect(result.formatted).toBe('1000 gm');
    });

    it('should format 0.1 stored-in-L as "100 ml" when item unit is ml', () => {
      const result = formatQuantityWithUnit(0.1, getBaseUnit('ml' as ItemUnit), 'ml');
      expect(result.value).toBe(100);
      expect(result.unit).toBe('ml');
      expect(result.formatted).toBe('100 ml');
    });

    it('should format pcs quantity as-is (no base unit conversion)', () => {
      const result = formatQuantityWithUnit(3, getBaseUnit('pcs' as ItemUnit), 'pcs');
      expect(result.value).toBe(3);
      expect(result.unit).toBe('pcs');
      expect(result.formatted).toBe('3 pcs');
    });
  });

  describe('getPresetQuantitiesForUnit', () => {
    it('should return kg presets', () => {
      const presets = getPresetQuantitiesForUnit('kg');
      expect(presets).toEqual([0.5, 1, 2, 5]);
    });

    it('should return gm presets', () => {
      const presets = getPresetQuantitiesForUnit('gm');
      expect(presets).toEqual([100, 250, 500, 1000]);
    });

    it('should return L presets', () => {
      const presets = getPresetQuantitiesForUnit('L');
      expect(presets).toEqual([0.5, 1, 2, 5]);
    });

    it('should return ml presets', () => {
      const presets = getPresetQuantitiesForUnit('ml');
      expect(presets).toEqual([200, 500, 750, 1000]);
    });

    it('should return pcs presets', () => {
      const presets = getPresetQuantitiesForUnit('pcs');
      expect(presets).toEqual([1, 2, 3, 6]);
    });
  });
});
