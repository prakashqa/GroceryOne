/**
 * Unit Conversion Utility
 * Handles conversions between grams/kilograms and milliliters/liters
 * for the cart quantity selection feature.
 */

// Unit type definitions
export type WeightUnit = 'kg' | 'gm';
export type VolumeUnit = 'L' | 'ml';
export type PieceUnit = 'pcs';
export type ConvertibleUnit = WeightUnit | VolumeUnit;
export type ItemUnit = ConvertibleUnit | PieceUnit;

// Unit group arrays for type checking
const WEIGHT_UNITS: WeightUnit[] = ['kg', 'gm'];
const VOLUME_UNITS: VolumeUnit[] = ['L', 'ml'];

// Conversion factors to base unit (kg for weight, L for volume)
const CONVERSION_TO_BASE: Record<ConvertibleUnit, number> = {
  kg: 1,
  gm: 0.001, // 1 gm = 0.001 kg
  L: 1,
  ml: 0.001, // 1 ml = 0.001 L
};

/**
 * Type guard: Check if unit is a weight unit (kg or gm)
 */
export const isWeightUnit = (unit: ItemUnit): unit is WeightUnit =>
  WEIGHT_UNITS.includes(unit as WeightUnit);

/**
 * Type guard: Check if unit is a volume unit (L or ml)
 */
export const isVolumeUnit = (unit: ItemUnit): unit is VolumeUnit =>
  VOLUME_UNITS.includes(unit as VolumeUnit);

/**
 * Type guard: Check if unit is convertible (weight or volume)
 */
export const isConvertibleUnit = (unit: ItemUnit): unit is ConvertibleUnit =>
  isWeightUnit(unit) || isVolumeUnit(unit);

/**
 * Get the unit group for a given unit
 */
export const getUnitGroup = (unit: ItemUnit): 'weight' | 'volume' | 'piece' => {
  if (isWeightUnit(unit)) return 'weight';
  if (isVolumeUnit(unit)) return 'volume';
  return 'piece';
};

/**
 * Get the base unit for a given unit (kg for weight, L for volume)
 */
export const getBaseUnit = (unit: ItemUnit): ItemUnit => {
  if (isWeightUnit(unit)) return 'kg';
  if (isVolumeUnit(unit)) return 'L';
  return unit;
};

/**
 * Get the alternate unit for toggling (kg <-> gm, L <-> ml)
 * Returns null for non-convertible units like pcs
 */
export const getAlternateUnit = (unit: ItemUnit): ItemUnit | null => {
  switch (unit) {
    case 'kg':
      return 'gm';
    case 'gm':
      return 'kg';
    case 'L':
      return 'ml';
    case 'ml':
      return 'L';
    default:
      return null;
  }
};

/**
 * Convert quantity from one unit to another within the same group
 * @throws Error if units are from different groups
 */
export const convertQuantity = (
  quantity: number,
  fromUnit: ConvertibleUnit,
  toUnit: ConvertibleUnit
): number => {
  if (fromUnit === toUnit) return quantity;

  const fromGroup = getUnitGroup(fromUnit);
  const toGroup = getUnitGroup(toUnit);

  if (fromGroup !== toGroup) {
    throw new Error(`Cannot convert between ${fromUnit} and ${toUnit}`);
  }

  // Convert to base unit, then to target unit
  const inBase = quantity * CONVERSION_TO_BASE[fromUnit];
  const result = inBase / CONVERSION_TO_BASE[toUnit];

  return result;
};

/**
 * Normalize quantity to base unit (kg for weight, L for volume)
 * Non-convertible units are returned unchanged
 */
export const normalizeToBaseUnit = (
  quantity: number,
  unit: ItemUnit
): { quantity: number; baseUnit: ItemUnit } => {
  if (!isConvertibleUnit(unit)) {
    return { quantity, baseUnit: unit };
  }

  const baseUnit = getBaseUnit(unit);
  const normalizedQty = convertQuantity(quantity, unit, baseUnit as ConvertibleUnit);

  return { quantity: normalizedQty, baseUnit };
};

/**
 * Format quantity for display with the specified unit
 * Converts from base unit to display unit if needed
 */
export const formatQuantityWithUnit = (
  quantity: number,
  baseUnit: ItemUnit,
  displayUnit?: ItemUnit
): { value: number; unit: ItemUnit; formatted: string } => {
  const targetUnit = displayUnit || baseUnit;

  // Handle non-convertible units
  if (!isConvertibleUnit(baseUnit) || !isConvertibleUnit(targetUnit)) {
    return {
      value: quantity,
      unit: baseUnit,
      formatted: `${quantity} ${baseUnit}`,
    };
  }

  const convertedValue = convertQuantity(
    quantity,
    baseUnit as ConvertibleUnit,
    targetUnit as ConvertibleUnit
  );

  // Round to 2 decimal places for cleaner display
  const displayValue = Number.isInteger(convertedValue)
    ? convertedValue
    : Math.round(convertedValue * 100) / 100;

  return {
    value: displayValue,
    unit: targetUnit,
    formatted: `${displayValue} ${targetUnit}`,
  };
};

/**
 * Get preset quantities for the quantity selector based on unit
 */
export const getPresetQuantitiesForUnit = (unit: ItemUnit): number[] => {
  switch (unit) {
    case 'kg':
      return [0.5, 1, 2, 5];
    case 'gm':
      return [100, 250, 500, 1000];
    case 'L':
      return [0.5, 1, 2, 5];
    case 'ml':
      return [200, 500, 750, 1000];
    case 'pcs':
      return [1, 2, 3, 6];
    default:
      return [1, 2, 5];
  }
};
