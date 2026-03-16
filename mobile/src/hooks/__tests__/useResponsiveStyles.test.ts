/**
 * useResponsiveStyles Hook Tests
 * TDD tests for responsive styling utilities
 */

import { renderHook } from '@testing-library/react-native';
import { useResponsiveStyles } from '../useResponsiveStyles';
import * as useDeviceTypeModule from '../useDeviceType';

jest.mock('../useDeviceType', () => ({
  useDeviceType: jest.fn(),
}));

const mockUseDeviceType = useDeviceTypeModule.useDeviceType as jest.MockedFunction<
  typeof useDeviceTypeModule.useDeviceType
>;

// === Device Profiles ===
const DEVICES = {
  xs:          { breakpoint: 'xs' as const, isTablet: false, isLandscape: false, screenWidth: 320,  screenHeight: 568 },
  phone:       { breakpoint: 'sm' as const, isTablet: false, isLandscape: false, screenWidth: 375,  screenHeight: 812 },
  smallTablet: { breakpoint: 'md' as const, isTablet: true,  isLandscape: false, screenWidth: 600,  screenHeight: 900 },
  tablet:      { breakpoint: 'lg' as const, isTablet: true,  isLandscape: false, screenWidth: 768,  screenHeight: 1024 },
  largeTablet: { breakpoint: 'xl' as const, isTablet: true,  isLandscape: true,  screenWidth: 1024, screenHeight: 768 },
  xlScreen:    { breakpoint: 'xl' as const, isTablet: true,  isLandscape: true,  screenWidth: 1366, screenHeight: 1024 },
};

const setupMock = (device: keyof typeof DEVICES) => {
  mockUseDeviceType.mockReturnValue(DEVICES[device]);
};

const getStyles = () => renderHook(() => useResponsiveStyles()).result.current;

describe('useResponsiveStyles', () => {
  // Layout properties
  it.each([
    ['phone',       'gridColumns', 2],
    ['smallTablet', 'gridColumns', 3],
    ['tablet',      'gridColumns', 4],
    ['largeTablet', 'gridColumns', 4],
    ['phone',       'contentPadding', 16],
    ['tablet',      'contentPadding', 24],
    ['largeTablet', 'contentPadding', 32],
    ['phone',       'listColumns', 1],
    ['tablet',      'listColumns', 2],
    ['largeTablet', 'listColumns', 2],
    ['phone',       'sectionSpacing', 16],
    ['tablet',      'sectionSpacing', 24],
    ['largeTablet', 'sectionSpacing', 32],
    ['phone',       'gridGap', 12],
    ['tablet',      'gridGap', 16],
    ['largeTablet', 'gridGap', 20],
  ] as [keyof typeof DEVICES, string, number][])(
    'on %s, %s should be %s',
    (device, property, expected) => {
      setupMock(device);
      expect((getStyles() as unknown as Record<string, unknown>)[property]).toBe(expected);
    }
  );

  // Sizing properties
  it.each([
    ['phone',       'iconSize', 24],
    ['smallTablet', 'iconSize', 30],
    ['tablet',      'iconSize', 34],
    ['largeTablet', 'iconSize', 38],
    ['phone',       'cardMinWidth', 140],
    ['tablet',      'cardMinWidth', 180],
    ['largeTablet', 'cardMinWidth', 200],
    ['xs',          'iconContainerSize', 40],
    ['phone',       'iconContainerSize', 44],
    ['smallTablet', 'iconContainerSize', 52],
    ['tablet',      'iconContainerSize', 58],
    ['largeTablet', 'iconContainerSize', 64],
    ['phone',       'tabBarIconSize', 24],
    ['smallTablet', 'tabBarIconSize', 30],
    ['tablet',      'tabBarIconSize', 34],
    ['largeTablet', 'tabBarIconSize', 38],
  ] as [keyof typeof DEVICES, string, number][])(
    'on %s, %s should be %s',
    (device, property, expected) => {
      setupMock(device);
      expect((getStyles() as unknown as Record<string, unknown>)[property]).toBe(expected);
    }
  );

  // Typography
  it.each([
    ['phone',       'fontScale', 1],
    ['smallTablet', 'fontScale', 1.35],
    ['tablet',      'fontScale', 1.45],
    ['largeTablet', 'fontScale', 1.55],
    ['phone',       'tabBarLabelSize', 11],
    ['smallTablet', 'tabBarLabelSize', 14],
    ['tablet',      'tabBarLabelSize', 16],
    ['largeTablet', 'tabBarLabelSize', 18],
  ] as [keyof typeof DEVICES, string, number][])(
    'on %s, %s should be %s',
    (device, property, expected) => {
      setupMock(device);
      expect((getStyles() as unknown as Record<string, unknown>)[property]).toBe(expected);
    }
  );

  // Border radii
  it.each([
    ['phone',       'cardBorderRadius', 12],
    ['smallTablet', 'cardBorderRadius', 14],
    ['tablet',      'cardBorderRadius', 16],
    ['largeTablet', 'cardBorderRadius', 20],
    ['phone',       'buttonBorderRadius', 8],
    ['tablet',      'buttonBorderRadius', 12],
  ] as [keyof typeof DEVICES, string, number][])(
    'on %s, %s should be %s',
    (device, property, expected) => {
      setupMock(device);
      expect((getStyles() as unknown as Record<string, unknown>)[property]).toBe(expected);
    }
  );

  // Component padding
  it.each([
    ['xs',          14],
    ['phone',       16],
    ['smallTablet', 20],
    ['tablet',      24],
    ['largeTablet', 28],
  ] as [keyof typeof DEVICES, number][])(
    'on %s, componentPadding should be %s',
    (device, expected) => {
      setupMock(device);
      expect(getStyles().componentPadding).toBe(expected);
    }
  );

  // Touch targets
  it.each([
    ['phone',       48],
    ['smallTablet', 54],
    ['tablet',      58],
    ['largeTablet', 64],
  ] as [keyof typeof DEVICES, number][])(
    'on %s, touchTargetMinSize should be %s',
    (device, expected) => {
      setupMock(device);
      expect(getStyles().touchTargetMinSize).toBe(expected);
    }
  );

  it('touchTargetMinSize should be at least 48 for all screen sizes (accessibility)', () => {
    for (const device of ['xs', 'phone', 'tablet'] as const) {
      setupMock(device);
      expect(getStyles().touchTargetMinSize).toBeGreaterThanOrEqual(48);
    }
  });

  // Content max width
  describe('contentMaxWidth', () => {
    it('should return undefined for phone (full width)', () => {
      setupMock('phone');
      expect(getStyles().contentMaxWidth).toBeUndefined();
    });

    it('should return undefined for regular tablet', () => {
      setupMock('tablet');
      expect(getStyles().contentMaxWidth).toBeUndefined();
    });

    it('should return max width for very large screens', () => {
      setupMock('xlScreen');
      expect(getStyles().contentMaxWidth).toBe(1200);
    });
  });

  // Modal width (uses calculations)
  describe('modalWidth', () => {
    it('should return screenWidth - 32 for phone', () => {
      setupMock('phone');
      expect(getStyles().modalWidth).toBe(375 - 32);
    });

    it('should return 60% of width (max 500) for tablet portrait', () => {
      setupMock('tablet');
      expect(getStyles().modalWidth).toBe(Math.min(768 * 0.6, 500));
    });

    it('should return 50% of width (max 600) for tablet landscape', () => {
      setupMock('largeTablet');
      expect(getStyles().modalWidth).toBe(Math.min(1024 * 0.5, 600));
    });
  });
});
