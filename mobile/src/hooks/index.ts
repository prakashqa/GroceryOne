/**
 * Hooks Module
 * Central export for all custom hooks
 */

export { useCatalog } from './useCatalog';
export { useDeviceType } from './useDeviceType';
export { useResponsiveStyles } from './useResponsiveStyles';

// Re-export types
export type { DeviceInfo, Breakpoint } from './useDeviceType';
export type { ResponsiveStyles } from './useResponsiveStyles';
