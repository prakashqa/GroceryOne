/**
 * Unit Conversion Utility (shared)
 */

export type WeightUnit = 'kg' | 'gm';
export type VolumeUnit = 'L' | 'ml';
export type PieceUnit = 'pcs';
export type ConvertibleUnit = WeightUnit | VolumeUnit;
export type ItemUnit = ConvertibleUnit | PieceUnit;

const WEIGHT_UNITS: WeightUnit[] = ['kg', 'gm'];
const VOLUME_UNITS: VolumeUnit[] = ['L', 'ml'];

const CONVERSION_TO_BASE: Record<ConvertibleUnit, number> = {
  kg: 1, gm: 0.001, L: 1, ml: 0.001,
};

export const isWeightUnit = (unit: ItemUnit): unit is WeightUnit => WEIGHT_UNITS.includes(unit as WeightUnit);
export const isVolumeUnit = (unit: ItemUnit): unit is VolumeUnit => VOLUME_UNITS.includes(unit as VolumeUnit);
export const isConvertibleUnit = (unit: ItemUnit): unit is ConvertibleUnit => isWeightUnit(unit) || isVolumeUnit(unit);

export const getUnitGroup = (unit: ItemUnit): 'weight' | 'volume' | 'piece' => {
  if (isWeightUnit(unit)) return 'weight';
  if (isVolumeUnit(unit)) return 'volume';
  return 'piece';
};

export const getBaseUnit = (unit: ItemUnit): ItemUnit => {
  if (isWeightUnit(unit)) return 'kg';
  if (isVolumeUnit(unit)) return 'L';
  return unit;
};

export const getAlternateUnit = (unit: ItemUnit): ItemUnit | null => {
  switch (unit) {
    case 'kg': return 'gm';
    case 'gm': return 'kg';
    case 'L': return 'ml';
    case 'ml': return 'L';
    default: return null;
  }
};

export const convertQuantity = (quantity: number, fromUnit: ConvertibleUnit, toUnit: ConvertibleUnit): number => {
  if (fromUnit === toUnit) return quantity;
  const fromGroup = getUnitGroup(fromUnit);
  const toGroup = getUnitGroup(toUnit);
  if (fromGroup !== toGroup) throw new Error(`Cannot convert between ${fromUnit} and ${toUnit}`);
  const inBase = quantity * CONVERSION_TO_BASE[fromUnit];
  return inBase / CONVERSION_TO_BASE[toUnit];
};

export const normalizeToBaseUnit = (quantity: number, unit: ItemUnit): { quantity: number; baseUnit: ItemUnit } => {
  if (!isConvertibleUnit(unit)) return { quantity, baseUnit: unit };
  const baseUnit = getBaseUnit(unit);
  const normalizedQty = convertQuantity(quantity, unit, baseUnit as ConvertibleUnit);
  return { quantity: normalizedQty, baseUnit };
};

export const formatQuantityWithUnit = (quantity: number, baseUnit: ItemUnit, displayUnit?: ItemUnit): { value: number; unit: ItemUnit; formatted: string } => {
  const targetUnit = displayUnit || baseUnit;
  if (!isConvertibleUnit(baseUnit) || !isConvertibleUnit(targetUnit)) {
    return { value: quantity, unit: baseUnit, formatted: `${quantity} ${baseUnit}` };
  }
  let convertedValue = convertQuantity(quantity, baseUnit as ConvertibleUnit, targetUnit as ConvertibleUnit);
  let finalUnit: ItemUnit = targetUnit;
  if (convertedValue > 0 && convertedValue < 1) {
    if (finalUnit === 'kg') { convertedValue *= 1000; finalUnit = 'gm'; }
    else if (finalUnit === 'L') { convertedValue *= 1000; finalUnit = 'ml'; }
  }
  const displayValue = Number.isInteger(convertedValue) ? convertedValue : Math.round(convertedValue * 100) / 100;
  return { value: displayValue, unit: finalUnit, formatted: `${displayValue} ${finalUnit}` };
};

export const getPresetQuantitiesForUnit = (unit: ItemUnit): number[] => {
  switch (unit) {
    case 'kg': return [0.5, 1, 2, 5];
    case 'gm': return [100, 250, 500, 1000];
    case 'L': return [0.5, 1, 2, 5];
    case 'ml': return [200, 500, 750, 1000];
    case 'pcs': return [1, 2, 3, 6];
    default: return [1, 2, 5];
  }
};
