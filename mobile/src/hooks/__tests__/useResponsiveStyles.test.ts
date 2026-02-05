/**
 * useResponsiveStyles Hook Tests
 * TDD tests for responsive styling utilities
 */

import { renderHook } from '@testing-library/react-native';
import { useResponsiveStyles } from '../useResponsiveStyles';
import * as useDeviceTypeModule from '../useDeviceType';

// Mock the useDeviceType hook instead of react-native directly
jest.mock('../useDeviceType', () => ({
  useDeviceType: jest.fn(),
}));

const mockUseDeviceType = useDeviceTypeModule.useDeviceType as jest.MockedFunction<
  typeof useDeviceTypeModule.useDeviceType
>;

describe('useResponsiveStyles', () => {
  // Helper function to set up mock device info
  const setupMock = (config: {
    breakpoint: useDeviceTypeModule.Breakpoint;
    isTablet: boolean;
    isLandscape: boolean;
    screenWidth: number;
    screenHeight: number;
  }) => {
    mockUseDeviceType.mockReturnValue({
      breakpoint: config.breakpoint,
      isTablet: config.isTablet,
      isLandscape: config.isLandscape,
      screenWidth: config.screenWidth,
      screenHeight: config.screenHeight,
    });
  };

  describe('grid columns', () => {
    it('should return 2 columns for phone width', () => {
      setupMock({
        breakpoint: 'sm',
        isTablet: false,
        isLandscape: false,
        screenWidth: 375,
        screenHeight: 812,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.gridColumns).toBe(2);
    });

    it('should return 3 columns for small tablet', () => {
      setupMock({
        breakpoint: 'md',
        isTablet: true,
        isLandscape: false,
        screenWidth: 600,
        screenHeight: 900,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.gridColumns).toBe(3);
    });

    it('should return 4 columns for tablet portrait', () => {
      setupMock({
        breakpoint: 'lg',
        isTablet: true,
        isLandscape: false,
        screenWidth: 768,
        screenHeight: 1024,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.gridColumns).toBe(4);
    });

    it('should return 4 columns for tablet landscape', () => {
      setupMock({
        breakpoint: 'xl',
        isTablet: true,
        isLandscape: true,
        screenWidth: 1024,
        screenHeight: 768,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.gridColumns).toBe(4);
    });
  });

  describe('content padding', () => {
    it('should return 16 for phone', () => {
      setupMock({
        breakpoint: 'sm',
        isTablet: false,
        isLandscape: false,
        screenWidth: 375,
        screenHeight: 812,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.contentPadding).toBe(16);
    });

    it('should return 24 for tablet', () => {
      setupMock({
        breakpoint: 'lg',
        isTablet: true,
        isLandscape: false,
        screenWidth: 768,
        screenHeight: 1024,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.contentPadding).toBe(24);
    });

    it('should return 32 for large tablet', () => {
      setupMock({
        breakpoint: 'xl',
        isTablet: true,
        isLandscape: true,
        screenWidth: 1024,
        screenHeight: 768,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.contentPadding).toBe(32);
    });
  });

  describe('content max width', () => {
    it('should return undefined for phone (full width)', () => {
      setupMock({
        breakpoint: 'sm',
        isTablet: false,
        isLandscape: false,
        screenWidth: 375,
        screenHeight: 812,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.contentMaxWidth).toBeUndefined();
    });

    it('should return undefined for regular tablet', () => {
      setupMock({
        breakpoint: 'lg',
        isTablet: true,
        isLandscape: false,
        screenWidth: 768,
        screenHeight: 1024,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.contentMaxWidth).toBeUndefined();
    });

    it('should return max width for very large screens', () => {
      setupMock({
        breakpoint: 'xl',
        isTablet: true,
        isLandscape: true,
        screenWidth: 1366,
        screenHeight: 1024,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.contentMaxWidth).toBe(1200);
    });
  });

  describe('icon size', () => {
    it('should return 24 for phone', () => {
      setupMock({
        breakpoint: 'sm',
        isTablet: false,
        isLandscape: false,
        screenWidth: 375,
        screenHeight: 812,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.iconSize).toBe(24);
    });

    it('should return 30 for small tablet', () => {
      setupMock({
        breakpoint: 'md',
        isTablet: true,
        isLandscape: false,
        screenWidth: 600,
        screenHeight: 900,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.iconSize).toBe(30);
    });

    it('should return 34 for tablet', () => {
      setupMock({
        breakpoint: 'lg',
        isTablet: true,
        isLandscape: false,
        screenWidth: 768,
        screenHeight: 1024,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.iconSize).toBe(34);
    });

    it('should return 38 for large tablet', () => {
      setupMock({
        breakpoint: 'xl',
        isTablet: true,
        isLandscape: true,
        screenWidth: 1024,
        screenHeight: 768,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.iconSize).toBe(38);
    });
  });

  describe('font scale', () => {
    it('should return 1 for phone', () => {
      setupMock({
        breakpoint: 'sm',
        isTablet: false,
        isLandscape: false,
        screenWidth: 375,
        screenHeight: 812,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.fontScale).toBe(1);
    });

    it('should return 1.15 for small tablet', () => {
      setupMock({
        breakpoint: 'md',
        isTablet: true,
        isLandscape: false,
        screenWidth: 600,
        screenHeight: 900,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.fontScale).toBe(1.15);
    });

    it('should return 1.25 for tablet', () => {
      setupMock({
        breakpoint: 'lg',
        isTablet: true,
        isLandscape: false,
        screenWidth: 768,
        screenHeight: 1024,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.fontScale).toBe(1.25);
    });

    it('should return 1.35 for large tablet', () => {
      setupMock({
        breakpoint: 'xl',
        isTablet: true,
        isLandscape: true,
        screenWidth: 1024,
        screenHeight: 768,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.fontScale).toBe(1.35);
    });
  });

  describe('card min width', () => {
    it('should return 140 for phone', () => {
      setupMock({
        breakpoint: 'sm',
        isTablet: false,
        isLandscape: false,
        screenWidth: 375,
        screenHeight: 812,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.cardMinWidth).toBe(140);
    });

    it('should return 180 for tablet', () => {
      setupMock({
        breakpoint: 'lg',
        isTablet: true,
        isLandscape: false,
        screenWidth: 768,
        screenHeight: 1024,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.cardMinWidth).toBe(180);
    });

    it('should return 200 for large tablet', () => {
      setupMock({
        breakpoint: 'xl',
        isTablet: true,
        isLandscape: true,
        screenWidth: 1024,
        screenHeight: 768,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.cardMinWidth).toBe(200);
    });
  });

  describe('list columns', () => {
    it('should return 1 for phone', () => {
      setupMock({
        breakpoint: 'sm',
        isTablet: false,
        isLandscape: false,
        screenWidth: 375,
        screenHeight: 812,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.listColumns).toBe(1);
    });

    it('should return 2 for tablet', () => {
      setupMock({
        breakpoint: 'lg',
        isTablet: true,
        isLandscape: false,
        screenWidth: 768,
        screenHeight: 1024,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.listColumns).toBe(2);
    });

    it('should return 2 for large tablet', () => {
      setupMock({
        breakpoint: 'xl',
        isTablet: true,
        isLandscape: true,
        screenWidth: 1024,
        screenHeight: 768,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.listColumns).toBe(2);
    });
  });

  describe('touchTargetMinSize', () => {
    it('should return at least 48 for all screen sizes (accessibility)', () => {
      // Test on small phone
      setupMock({
        breakpoint: 'xs',
        isTablet: false,
        isLandscape: false,
        screenWidth: 320,
        screenHeight: 568,
      });

      const { result: smallPhoneResult } = renderHook(() => useResponsiveStyles());
      expect(smallPhoneResult.current.touchTargetMinSize).toBeGreaterThanOrEqual(48);

      // Test on regular phone
      setupMock({
        breakpoint: 'sm',
        isTablet: false,
        isLandscape: false,
        screenWidth: 375,
        screenHeight: 812,
      });

      const { result: phoneResult } = renderHook(() => useResponsiveStyles());
      expect(phoneResult.current.touchTargetMinSize).toBeGreaterThanOrEqual(48);

      // Test on tablet
      setupMock({
        breakpoint: 'lg',
        isTablet: true,
        isLandscape: false,
        screenWidth: 768,
        screenHeight: 1024,
      });

      const { result: tabletResult } = renderHook(() => useResponsiveStyles());
      expect(tabletResult.current.touchTargetMinSize).toBeGreaterThanOrEqual(48);
    });

    it('should return 48 for phone', () => {
      setupMock({
        breakpoint: 'sm',
        isTablet: false,
        isLandscape: false,
        screenWidth: 375,
        screenHeight: 812,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.touchTargetMinSize).toBe(48);
    });

    it('should return 54 for small tablet', () => {
      setupMock({
        breakpoint: 'md',
        isTablet: true,
        isLandscape: false,
        screenWidth: 600,
        screenHeight: 900,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.touchTargetMinSize).toBe(54);
    });

    it('should return 58 for tablet', () => {
      setupMock({
        breakpoint: 'lg',
        isTablet: true,
        isLandscape: false,
        screenWidth: 768,
        screenHeight: 1024,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.touchTargetMinSize).toBe(58);
    });

    it('should return 64 for large tablet', () => {
      setupMock({
        breakpoint: 'xl',
        isTablet: true,
        isLandscape: true,
        screenWidth: 1024,
        screenHeight: 768,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.touchTargetMinSize).toBe(64);
    });
  });

  describe('componentPadding', () => {
    it('should return 14 for small phone', () => {
      setupMock({
        breakpoint: 'xs',
        isTablet: false,
        isLandscape: false,
        screenWidth: 320,
        screenHeight: 568,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.componentPadding).toBe(14);
    });

    it('should return 16 for phone', () => {
      setupMock({
        breakpoint: 'sm',
        isTablet: false,
        isLandscape: false,
        screenWidth: 375,
        screenHeight: 812,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.componentPadding).toBe(16);
    });

    it('should return 20 for small tablet', () => {
      setupMock({
        breakpoint: 'md',
        isTablet: true,
        isLandscape: false,
        screenWidth: 600,
        screenHeight: 900,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.componentPadding).toBe(20);
    });

    it('should return 24 for tablet portrait', () => {
      setupMock({
        breakpoint: 'lg',
        isTablet: true,
        isLandscape: false,
        screenWidth: 768,
        screenHeight: 1024,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.componentPadding).toBe(24);
    });

    it('should return 28 for large tablet', () => {
      setupMock({
        breakpoint: 'xl',
        isTablet: true,
        isLandscape: true,
        screenWidth: 1024,
        screenHeight: 768,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.componentPadding).toBe(28);
    });
  });

  describe('iconContainerSize', () => {
    it('should return 40 for small phone', () => {
      setupMock({
        breakpoint: 'xs',
        isTablet: false,
        isLandscape: false,
        screenWidth: 320,
        screenHeight: 568,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.iconContainerSize).toBe(40);
    });

    it('should return 44 for phone', () => {
      setupMock({
        breakpoint: 'sm',
        isTablet: false,
        isLandscape: false,
        screenWidth: 375,
        screenHeight: 812,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.iconContainerSize).toBe(44);
    });

    it('should return 52 for small tablet', () => {
      setupMock({
        breakpoint: 'md',
        isTablet: true,
        isLandscape: false,
        screenWidth: 600,
        screenHeight: 900,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.iconContainerSize).toBe(52);
    });

    it('should return 58 for tablet portrait', () => {
      setupMock({
        breakpoint: 'lg',
        isTablet: true,
        isLandscape: false,
        screenWidth: 768,
        screenHeight: 1024,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.iconContainerSize).toBe(58);
    });

    it('should return 64 for large tablet', () => {
      setupMock({
        breakpoint: 'xl',
        isTablet: true,
        isLandscape: true,
        screenWidth: 1024,
        screenHeight: 768,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.iconContainerSize).toBe(64);
    });
  });

  describe('cardBorderRadius', () => {
    it('should return 12 (md) for phone', () => {
      setupMock({
        breakpoint: 'sm',
        isTablet: false,
        isLandscape: false,
        screenWidth: 375,
        screenHeight: 812,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.cardBorderRadius).toBe(12);
    });

    it('should return 14 for small tablet', () => {
      setupMock({
        breakpoint: 'md',
        isTablet: true,
        isLandscape: false,
        screenWidth: 600,
        screenHeight: 900,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.cardBorderRadius).toBe(14);
    });

    it('should return 16 (lg) for tablet', () => {
      setupMock({
        breakpoint: 'lg',
        isTablet: true,
        isLandscape: false,
        screenWidth: 768,
        screenHeight: 1024,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.cardBorderRadius).toBe(16);
    });

    it('should return 20 for large tablet', () => {
      setupMock({
        breakpoint: 'xl',
        isTablet: true,
        isLandscape: true,
        screenWidth: 1024,
        screenHeight: 768,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.cardBorderRadius).toBe(20);
    });
  });

  describe('buttonBorderRadius', () => {
    it('should return 8 for phone', () => {
      setupMock({
        breakpoint: 'sm',
        isTablet: false,
        isLandscape: false,
        screenWidth: 375,
        screenHeight: 812,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.buttonBorderRadius).toBe(8);
    });

    it('should return 12 for tablet', () => {
      setupMock({
        breakpoint: 'lg',
        isTablet: true,
        isLandscape: false,
        screenWidth: 768,
        screenHeight: 1024,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.buttonBorderRadius).toBe(12);
    });
  });

  describe('modalWidth', () => {
    it('should return screenWidth - 32 for phone', () => {
      setupMock({
        breakpoint: 'sm',
        isTablet: false,
        isLandscape: false,
        screenWidth: 375,
        screenHeight: 812,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.modalWidth).toBe(375 - 32);
    });

    it('should return 60% of width (max 500) for tablet portrait', () => {
      setupMock({
        breakpoint: 'lg',
        isTablet: true,
        isLandscape: false,
        screenWidth: 768,
        screenHeight: 1024,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.modalWidth).toBe(Math.min(768 * 0.6, 500));
    });

    it('should return 50% of width (max 600) for tablet landscape', () => {
      setupMock({
        breakpoint: 'xl',
        isTablet: true,
        isLandscape: true,
        screenWidth: 1024,
        screenHeight: 768,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      // Landscape uses 50% width, max 600
      expect(result.current.modalWidth).toBe(Math.min(1024 * 0.5, 600));
    });
  });

  describe('sectionSpacing', () => {
    it('should return 16 for phone', () => {
      setupMock({
        breakpoint: 'sm',
        isTablet: false,
        isLandscape: false,
        screenWidth: 375,
        screenHeight: 812,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.sectionSpacing).toBe(16);
    });

    it('should return 24 for tablet', () => {
      setupMock({
        breakpoint: 'lg',
        isTablet: true,
        isLandscape: false,
        screenWidth: 768,
        screenHeight: 1024,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.sectionSpacing).toBe(24);
    });

    it('should return 32 for large tablet', () => {
      setupMock({
        breakpoint: 'xl',
        isTablet: true,
        isLandscape: true,
        screenWidth: 1024,
        screenHeight: 768,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.sectionSpacing).toBe(32);
    });
  });

  describe('gridGap', () => {
    it('should return 12 for phone', () => {
      setupMock({
        breakpoint: 'sm',
        isTablet: false,
        isLandscape: false,
        screenWidth: 375,
        screenHeight: 812,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.gridGap).toBe(12);
    });

    it('should return 16 for tablet', () => {
      setupMock({
        breakpoint: 'lg',
        isTablet: true,
        isLandscape: false,
        screenWidth: 768,
        screenHeight: 1024,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.gridGap).toBe(16);
    });

    it('should return 20 for large tablet', () => {
      setupMock({
        breakpoint: 'xl',
        isTablet: true,
        isLandscape: true,
        screenWidth: 1024,
        screenHeight: 768,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.gridGap).toBe(20);
    });
  });

  describe('tabBarIconSize (tablet-optimized)', () => {
    it('should return 24 for phone', () => {
      setupMock({
        breakpoint: 'sm',
        isTablet: false,
        isLandscape: false,
        screenWidth: 375,
        screenHeight: 812,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.tabBarIconSize).toBe(24);
    });

    it('should return 30 for small tablet', () => {
      setupMock({
        breakpoint: 'md',
        isTablet: true,
        isLandscape: false,
        screenWidth: 600,
        screenHeight: 900,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.tabBarIconSize).toBe(30);
    });

    it('should return 34 for tablet', () => {
      setupMock({
        breakpoint: 'lg',
        isTablet: true,
        isLandscape: false,
        screenWidth: 768,
        screenHeight: 1024,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.tabBarIconSize).toBe(34);
    });

    it('should return 38 for large tablet', () => {
      setupMock({
        breakpoint: 'xl',
        isTablet: true,
        isLandscape: true,
        screenWidth: 1024,
        screenHeight: 768,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.tabBarIconSize).toBe(38);
    });
  });

  describe('tabBarLabelSize (tablet-optimized)', () => {
    it('should return 11 for phone', () => {
      setupMock({
        breakpoint: 'sm',
        isTablet: false,
        isLandscape: false,
        screenWidth: 375,
        screenHeight: 812,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.tabBarLabelSize).toBe(11);
    });

    it('should return 14 for small tablet', () => {
      setupMock({
        breakpoint: 'md',
        isTablet: true,
        isLandscape: false,
        screenWidth: 600,
        screenHeight: 900,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.tabBarLabelSize).toBe(14);
    });

    it('should return 16 for tablet', () => {
      setupMock({
        breakpoint: 'lg',
        isTablet: true,
        isLandscape: false,
        screenWidth: 768,
        screenHeight: 1024,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.tabBarLabelSize).toBe(16);
    });

    it('should return 18 for large tablet', () => {
      setupMock({
        breakpoint: 'xl',
        isTablet: true,
        isLandscape: true,
        screenWidth: 1024,
        screenHeight: 768,
      });

      const { result } = renderHook(() => useResponsiveStyles());

      expect(result.current.tabBarLabelSize).toBe(18);
    });
  });
});
