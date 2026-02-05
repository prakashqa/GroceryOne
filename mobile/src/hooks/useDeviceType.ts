/**
 * useDeviceType Hook
 * Provides device type detection, orientation, and breakpoint information
 * for responsive layouts in the app.
 */

import { useWindowDimensions } from 'react-native';
import { useMemo } from 'react';

// Types
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface DeviceInfo {
  /** Whether the device is a tablet (width >= 600px) */
  isTablet: boolean;
  /** Whether the device is in landscape orientation */
  isLandscape: boolean;
  /** Current screen width in pixels */
  screenWidth: number;
  /** Current screen height in pixels */
  screenHeight: number;
  /** Current breakpoint based on screen width */
  breakpoint: Breakpoint;
}

// Breakpoint thresholds
const BREAKPOINTS = {
  xs: 0,      // Small phones (< 375px)
  sm: 375,    // Regular phones (375-599px)
  md: 600,    // Small tablets / large phones landscape (600-767px)
  lg: 768,    // Tablets portrait (768-1023px)
  xl: 1024,   // Tablets landscape (>= 1024px)
} as const;

// Tablet threshold (industry standard)
const TABLET_MIN_WIDTH = 600;

/**
 * Determines the current breakpoint based on screen width
 */
function getBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

/**
 * Hook that provides device type, orientation, and breakpoint information.
 * Automatically updates when screen dimensions change (e.g., rotation).
 *
 * @example
 * ```tsx
 * const { isTablet, isLandscape, breakpoint, screenWidth } = useDeviceType();
 *
 * return (
 *   <View style={{ padding: isTablet ? 24 : 16 }}>
 *     {breakpoint === 'xl' && <SidebarNavigation />}
 *     <Content />
 *   </View>
 * );
 * ```
 */
export function useDeviceType(): DeviceInfo {
  const { width, height } = useWindowDimensions();

  return useMemo(() => ({
    isTablet: width >= TABLET_MIN_WIDTH,
    isLandscape: width > height,
    screenWidth: width,
    screenHeight: height,
    breakpoint: getBreakpoint(width),
  }), [width, height]);
}

export default useDeviceType;
