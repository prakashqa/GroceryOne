/**
 * Animation Utilities Tests
 */

import { Animated } from 'react-native';
import { renderHook, act } from '@testing-library/react-native';
import {
  ANIMATION_PRESETS,
  STAGGER_DELAY,
  MAX_STAGGER_DELAY,
  useFadeIn,
  useScaleOnPress,
  useStaggeredEntrance,
  getStaggerDelay,
} from '../animations';

describe('Animation Utilities', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });
  describe('ANIMATION_PRESETS', () => {
    it('has spring gentle preset with correct values', () => {
      expect(ANIMATION_PRESETS.SPRING_GENTLE).toEqual({
        speed: 50,
        bounciness: 4,
      });
    });

    it('has spring bouncy preset with correct values', () => {
      expect(ANIMATION_PRESETS.SPRING_BOUNCY).toEqual({
        speed: 40,
        bounciness: 8,
      });
    });

    it('has timing fast preset with correct duration', () => {
      expect(ANIMATION_PRESETS.TIMING_FAST).toEqual({
        duration: 150,
      });
    });

    it('has timing normal preset with correct duration', () => {
      expect(ANIMATION_PRESETS.TIMING_NORMAL).toEqual({
        duration: 200,
      });
    });

    it('has timing slow preset with correct duration', () => {
      expect(ANIMATION_PRESETS.TIMING_SLOW).toEqual({
        duration: 300,
      });
    });
  });

  describe('STAGGER_DELAY', () => {
    it('has correct base delay value', () => {
      expect(STAGGER_DELAY).toBe(50);
    });
  });

  describe('MAX_STAGGER_DELAY', () => {
    it('has correct maximum delay value', () => {
      expect(MAX_STAGGER_DELAY).toBe(300);
    });
  });

  describe('getStaggerDelay', () => {
    it('returns correct delay for index 0', () => {
      expect(getStaggerDelay(0)).toBe(0);
    });

    it('returns correct delay for index 1', () => {
      expect(getStaggerDelay(1)).toBe(50);
    });

    it('returns correct delay for index 5', () => {
      expect(getStaggerDelay(5)).toBe(250);
    });

    it('caps delay at MAX_STAGGER_DELAY', () => {
      expect(getStaggerDelay(10)).toBe(300);
    });

    it('accepts custom base delay', () => {
      expect(getStaggerDelay(2, 30)).toBe(60);
    });

    it('accepts custom max delay', () => {
      expect(getStaggerDelay(10, 50, 100)).toBe(100);
    });
  });

  describe('useFadeIn', () => {
    it('returns an Animated.Value', () => {
      const { result } = renderHook(() => useFadeIn());
      expect(result.current).toBeInstanceOf(Animated.Value);
    });

    it('starts with opacity 0', () => {
      const { result } = renderHook(() => useFadeIn());
      // Access the internal value - Animated.Value stores it in __getValue()
      // @ts-expect-error - accessing internal for testing
      const initialValue = (result.current as any).__getValue?.() ??
        // Fallback for different RN versions
        (result.current as any)._value;
      expect(initialValue).toBe(0);
    });
  });

  describe('useScaleOnPress', () => {
    it('returns animated value and press handlers', () => {
      const { result } = renderHook(() => useScaleOnPress());

      expect(result.current.scaleValue).toBeInstanceOf(Animated.Value);
      expect(typeof result.current.onPressIn).toBe('function');
      expect(typeof result.current.onPressOut).toBe('function');
    });

    it('starts with scale 1', () => {
      const { result } = renderHook(() => useScaleOnPress());
      // @ts-expect-error - accessing internal for testing
      const initialValue = (result.current.scaleValue as any).__getValue?.() ??
        (result.current.scaleValue as any)._value;
      expect(initialValue).toBe(1);
    });

    it('press handlers are callable', () => {
      const { result } = renderHook(() => useScaleOnPress());

      // Should not throw
      act(() => {
        result.current.onPressIn();
      });

      act(() => {
        result.current.onPressOut();
      });
    });

    it('accepts custom scale value parameter', () => {
      const { result } = renderHook(() => useScaleOnPress(0.9));

      expect(result.current.scaleValue).toBeInstanceOf(Animated.Value);
    });
  });

  describe('useStaggeredEntrance', () => {
    it('returns an array of Animated.Values', () => {
      const { result } = renderHook(() => useStaggeredEntrance(3));

      expect(result.current).toHaveLength(3);
      result.current.forEach((value) => {
        expect(value).toBeInstanceOf(Animated.Value);
      });
    });

    it('returns empty array for count of 0', () => {
      const { result } = renderHook(() => useStaggeredEntrance(0));
      expect(result.current).toHaveLength(0);
    });

    it('all values start at 0', () => {
      const { result } = renderHook(() => useStaggeredEntrance(3));

      result.current.forEach((value) => {
        // @ts-expect-error - accessing internal for testing
        const initialValue = (value as any).__getValue?.() ?? (value as any)._value;
        expect(initialValue).toBe(0);
      });
    });

    it('respects baseDelay parameter', () => {
      // Test that the hook works with custom baseDelay
      const { result } = renderHook(() => useStaggeredEntrance(2, 100));

      expect(result.current).toHaveLength(2);
    });
  });
});
