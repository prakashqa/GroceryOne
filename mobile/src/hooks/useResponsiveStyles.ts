/**
 * useResponsiveStyles Hook
 * Provides responsive styling values based on device size and orientation.
 * Use these values to create adaptive layouts for phones and tablets.
 */

import { Platform } from 'react-native';
import { useMemo } from 'react';
import { useDeviceType, Breakpoint } from './useDeviceType';

export interface ResponsiveStyles {
  /** Number of columns for grid layouts (2-4) */
  gridColumns: number;
  /** Horizontal padding for content containers */
  contentPadding: number;
  /** Max width for content (undefined = full width) */
  contentMaxWidth: number | undefined;
  /** Height for bottom tab bar */
  tabBarHeight: number;
  /** Size for icons (navigation, actions) */
  iconSize: number;
  /** Font scale multiplier for tablet readability */
  fontScale: number;
  /** Minimum width for cards */
  cardMinWidth: number;
  /** Number of columns for list layouts (1-2) */
  listColumns: number;
  /** Gap between grid items */
  gridGap: number;
  /** Tab bar icon size */
  tabBarIconSize: number;
  /** Tab bar label font size */
  tabBarLabelSize: number;
  /** Minimum touch target size for accessibility (48-56px) */
  touchTargetMinSize: number;
  /** Standard internal padding for components (cards, list items) */
  componentPadding: number;
  /** Standard icon container size */
  iconContainerSize: number;
  /** Border radius for card-like components */
  cardBorderRadius: number;
  /** Border radius for buttons */
  buttonBorderRadius: number;
  /** Modal width based on screen size and orientation */
  modalWidth: number;
  /** Spacing between sections */
  sectionSpacing: number;
}

// Configuration maps for each breakpoint
const GRID_COLUMNS: Record<Breakpoint, number> = {
  xs: 2,
  sm: 2,
  md: 3,
  lg: 4,
  xl: 4,
};

const CONTENT_PADDING: Record<Breakpoint, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

const ICON_SIZE: Record<Breakpoint, number> = {
  xs: 20,
  sm: 24,
  md: 30,  // Tablet: increased for better visibility at counter distance
  lg: 34,  // Tablet: increased for better visibility at counter distance
  xl: 38,  // Tablet: increased for better visibility at counter distance
};

const FONT_SCALE: Record<Breakpoint, number> = {
  xs: 0.95,
  sm: 1,
  md: 1.35,  // Tablet: significantly increased for better readability at counter distance
  lg: 1.45,  // Tablet: significantly increased for better readability at counter distance
  xl: 1.55,  // Tablet: significantly increased for better readability at counter distance
};

const CARD_MIN_WIDTH: Record<Breakpoint, number> = {
  xs: 120,
  sm: 140,
  md: 160,
  lg: 180,
  xl: 200,
};

const LIST_COLUMNS: Record<Breakpoint, number> = {
  xs: 1,
  sm: 1,
  md: 1,
  lg: 2,
  xl: 2,
};

const GRID_GAP: Record<Breakpoint, number> = {
  xs: 8,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
};

const TAB_BAR_ICON_SIZE: Record<Breakpoint, number> = {
  xs: 22,
  sm: 24,
  md: 30,  // Tablet: increased for better tap accuracy
  lg: 34,  // Tablet: increased for better tap accuracy
  xl: 38,  // Tablet: increased for better tap accuracy
};

const TAB_BAR_LABEL_SIZE: Record<Breakpoint, number> = {
  xs: 10,
  sm: 11,
  md: 14,  // Tablet: increased for better readability
  lg: 16,  // Tablet: increased for better readability
  xl: 18,  // Tablet: increased for better readability
};

// New responsive configurations for enhanced UI
const TOUCH_TARGET_MIN_SIZE: Record<Breakpoint, number> = {
  xs: 48,   // Minimum accessible touch target
  sm: 48,
  md: 54,   // Tablet: increased for comfortable tapping during fast merchant usage
  lg: 58,   // Tablet: increased for comfortable tapping during fast merchant usage
  xl: 64,   // Tablet: increased for comfortable tapping during fast merchant usage
};

const COMPONENT_PADDING: Record<Breakpoint, number> = {
  xs: 14,
  sm: 16,
  md: 20,  // Tablet: increased for better visual spacing
  lg: 24,  // Tablet: increased for better visual spacing
  xl: 28,  // Tablet: increased for better visual spacing
};

const ICON_CONTAINER_SIZE: Record<Breakpoint, number> = {
  xs: 40,
  sm: 44,
  md: 52,  // Tablet: increased to maintain visual balance with larger icons
  lg: 58,  // Tablet: increased to maintain visual balance with larger icons
  xl: 64,  // Tablet: increased to maintain visual balance with larger icons
};

const CARD_BORDER_RADIUS: Record<Breakpoint, number> = {
  xs: 12,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
};

const BUTTON_BORDER_RADIUS: Record<Breakpoint, number> = {
  xs: 8,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 12,
};

const SECTION_SPACING: Record<Breakpoint, number> = {
  xs: 16,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

// Max content width threshold - only apply on very large screens
const MAX_WIDTH_THRESHOLD = 1200;
const MAX_WIDTH_APPLY_ABOVE = 1300;

/**
 * Hook that provides responsive style values based on current screen size.
 * Automatically updates when screen dimensions change (e.g., rotation).
 *
 * @example
 * ```tsx
 * const { gridColumns, contentPadding, iconSize } = useResponsiveStyles();
 *
 * return (
 *   <View style={{ padding: contentPadding }}>
 *     <FlatList
 *       data={items}
 *       numColumns={gridColumns}
 *       renderItem={...}
 *     />
 *   </View>
 * );
 * ```
 */
export function useResponsiveStyles(): ResponsiveStyles {
  const { breakpoint, isTablet, isLandscape, screenWidth, screenHeight } = useDeviceType();

  return useMemo(() => {
    // Base tab bar height varies by platform
    const baseTabBarHeight = Platform.OS === 'ios' ? 84 : 60;

    // Scale tab bar for tablets
    const tabBarScale = isTablet ? 1.2 : 1;
    const tabBarHeight = Math.round(baseTabBarHeight * tabBarScale);

    // Content max width - only constrain on very large screens
    const contentMaxWidth = screenWidth > MAX_WIDTH_APPLY_ABOVE
      ? MAX_WIDTH_THRESHOLD
      : undefined;

    // Modal width calculation based on device type and orientation
    let modalWidth: number;
    if (!isTablet) {
      // Phone: full width minus padding
      modalWidth = screenWidth - 32;
    } else if (isLandscape) {
      // Tablet landscape: 50% width, max 600px
      modalWidth = Math.min(screenWidth * 0.5, 600);
    } else {
      // Tablet portrait: 60% width, max 500px
      modalWidth = Math.min(screenWidth * 0.6, 500);
    }

    return {
      gridColumns: GRID_COLUMNS[breakpoint],
      contentPadding: CONTENT_PADDING[breakpoint],
      contentMaxWidth,
      tabBarHeight,
      iconSize: ICON_SIZE[breakpoint],
      fontScale: FONT_SCALE[breakpoint],
      cardMinWidth: CARD_MIN_WIDTH[breakpoint],
      listColumns: LIST_COLUMNS[breakpoint],
      gridGap: GRID_GAP[breakpoint],
      tabBarIconSize: TAB_BAR_ICON_SIZE[breakpoint],
      tabBarLabelSize: TAB_BAR_LABEL_SIZE[breakpoint],
      // New responsive values for enhanced UI
      touchTargetMinSize: TOUCH_TARGET_MIN_SIZE[breakpoint],
      componentPadding: COMPONENT_PADDING[breakpoint],
      iconContainerSize: ICON_CONTAINER_SIZE[breakpoint],
      cardBorderRadius: CARD_BORDER_RADIUS[breakpoint],
      buttonBorderRadius: BUTTON_BORDER_RADIUS[breakpoint],
      modalWidth,
      sectionSpacing: SECTION_SPACING[breakpoint],
    };
  }, [breakpoint, isTablet, isLandscape, screenWidth, screenHeight]);
}

export default useResponsiveStyles;
