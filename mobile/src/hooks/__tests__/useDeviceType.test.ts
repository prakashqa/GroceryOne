/**
 * useDeviceType Hook Tests
 * TDD tests for device type and orientation detection
 */

import { renderHook, act } from '@testing-library/react-native';
import { useDeviceType } from '../useDeviceType';

// Mock useWindowDimensions without spreading the entire react-native module
// (spreading triggers native module loading errors like 'SettingsManager' in Jest)
const mockUseWindowDimensions = jest.fn();
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  Object.defineProperty(RN, 'useWindowDimensions', {
    value: (...args: any[]) => mockUseWindowDimensions(...args),
    writable: true,
  });
  return RN;
});

describe('useDeviceType', () => {
  describe('device detection', () => {
    it('should return isTablet: false for width < 600', () => {
      mockUseWindowDimensions.mockReturnValue({
        width: 375,
        height: 812,
        scale: 3,
        fontScale: 1,
      });

      const { result } = renderHook(() => useDeviceType());

      expect(result.current.isTablet).toBe(false);
    });

    it('should return isTablet: true for width >= 600', () => {
      mockUseWindowDimensions.mockReturnValue({
        width: 768,
        height: 1024,
        scale: 2,
        fontScale: 1,
      });

      const { result } = renderHook(() => useDeviceType());

      expect(result.current.isTablet).toBe(true);
    });

    it('should return isTablet: true for width exactly 600', () => {
      mockUseWindowDimensions.mockReturnValue({
        width: 600,
        height: 900,
        scale: 2,
        fontScale: 1,
      });

      const { result } = renderHook(() => useDeviceType());

      expect(result.current.isTablet).toBe(true);
    });
  });

  describe('orientation detection', () => {
    it('should return isLandscape: false when height > width', () => {
      mockUseWindowDimensions.mockReturnValue({
        width: 375,
        height: 812,
        scale: 3,
        fontScale: 1,
      });

      const { result } = renderHook(() => useDeviceType());

      expect(result.current.isLandscape).toBe(false);
    });

    it('should return isLandscape: true when width > height', () => {
      mockUseWindowDimensions.mockReturnValue({
        width: 812,
        height: 375,
        scale: 3,
        fontScale: 1,
      });

      const { result } = renderHook(() => useDeviceType());

      expect(result.current.isLandscape).toBe(true);
    });

    it('should return isLandscape: false when width equals height', () => {
      mockUseWindowDimensions.mockReturnValue({
        width: 500,
        height: 500,
        scale: 2,
        fontScale: 1,
      });

      const { result } = renderHook(() => useDeviceType());

      expect(result.current.isLandscape).toBe(false);
    });
  });

  describe('screen dimensions', () => {
    it('should return correct screen width and height', () => {
      mockUseWindowDimensions.mockReturnValue({
        width: 768,
        height: 1024,
        scale: 2,
        fontScale: 1,
      });

      const { result } = renderHook(() => useDeviceType());

      expect(result.current.screenWidth).toBe(768);
      expect(result.current.screenHeight).toBe(1024);
    });
  });

  describe('breakpoints', () => {
    it('should return "xs" breakpoint for width < 375', () => {
      mockUseWindowDimensions.mockReturnValue({
        width: 320,
        height: 568,
        scale: 2,
        fontScale: 1,
      });

      const { result } = renderHook(() => useDeviceType());

      expect(result.current.breakpoint).toBe('xs');
    });

    it('should return "sm" breakpoint for width 375-599', () => {
      mockUseWindowDimensions.mockReturnValue({
        width: 414,
        height: 896,
        scale: 3,
        fontScale: 1,
      });

      const { result } = renderHook(() => useDeviceType());

      expect(result.current.breakpoint).toBe('sm');
    });

    it('should return "md" breakpoint for width 600-767', () => {
      mockUseWindowDimensions.mockReturnValue({
        width: 600,
        height: 900,
        scale: 2,
        fontScale: 1,
      });

      const { result } = renderHook(() => useDeviceType());

      expect(result.current.breakpoint).toBe('md');
    });

    it('should return "lg" breakpoint for width 768-1023', () => {
      mockUseWindowDimensions.mockReturnValue({
        width: 768,
        height: 1024,
        scale: 2,
        fontScale: 1,
      });

      const { result } = renderHook(() => useDeviceType());

      expect(result.current.breakpoint).toBe('lg');
    });

    it('should return "xl" breakpoint for width >= 1024', () => {
      mockUseWindowDimensions.mockReturnValue({
        width: 1024,
        height: 768,
        scale: 2,
        fontScale: 1,
      });

      const { result } = renderHook(() => useDeviceType());

      expect(result.current.breakpoint).toBe('xl');
    });

    it('should return "xl" breakpoint for large tablet landscape', () => {
      mockUseWindowDimensions.mockReturnValue({
        width: 1366,
        height: 1024,
        scale: 2,
        fontScale: 1,
      });

      const { result } = renderHook(() => useDeviceType());

      expect(result.current.breakpoint).toBe('xl');
    });
  });

  describe('combined scenarios', () => {
    it('should correctly identify phone in portrait', () => {
      mockUseWindowDimensions.mockReturnValue({
        width: 375,
        height: 812,
        scale: 3,
        fontScale: 1,
      });

      const { result } = renderHook(() => useDeviceType());

      expect(result.current.isTablet).toBe(false);
      expect(result.current.isLandscape).toBe(false);
      expect(result.current.breakpoint).toBe('sm');
    });

    it('should correctly identify phone in landscape', () => {
      mockUseWindowDimensions.mockReturnValue({
        width: 812,
        height: 375,
        scale: 3,
        fontScale: 1,
      });

      const { result } = renderHook(() => useDeviceType());

      expect(result.current.isTablet).toBe(true); // Width is > 600, so treated as tablet
      expect(result.current.isLandscape).toBe(true);
      expect(result.current.breakpoint).toBe('lg');
    });

    it('should correctly identify tablet in portrait', () => {
      mockUseWindowDimensions.mockReturnValue({
        width: 768,
        height: 1024,
        scale: 2,
        fontScale: 1,
      });

      const { result } = renderHook(() => useDeviceType());

      expect(result.current.isTablet).toBe(true);
      expect(result.current.isLandscape).toBe(false);
      expect(result.current.breakpoint).toBe('lg');
    });

    it('should correctly identify tablet in landscape', () => {
      mockUseWindowDimensions.mockReturnValue({
        width: 1024,
        height: 768,
        scale: 2,
        fontScale: 1,
      });

      const { result } = renderHook(() => useDeviceType());

      expect(result.current.isTablet).toBe(true);
      expect(result.current.isLandscape).toBe(true);
      expect(result.current.breakpoint).toBe('xl');
    });

    it('should correctly identify large iPad Pro', () => {
      mockUseWindowDimensions.mockReturnValue({
        width: 1024,
        height: 1366,
        scale: 2,
        fontScale: 1,
      });

      const { result } = renderHook(() => useDeviceType());

      expect(result.current.isTablet).toBe(true);
      expect(result.current.isLandscape).toBe(false);
      expect(result.current.breakpoint).toBe('xl');
    });
  });
});
