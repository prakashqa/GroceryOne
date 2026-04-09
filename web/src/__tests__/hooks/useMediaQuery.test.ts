import { renderHook, act } from '@testing-library/react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

describe('useMediaQuery', () => {
  let listeners: Map<string, (e: MediaQueryListEvent) => void>;
  let matchesMap: Map<string, boolean>;

  beforeEach(() => {
    listeners = new Map();
    matchesMap = new Map();

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn((query: string) => ({
        matches: matchesMap.get(query) ?? false,
        media: query,
        addEventListener: jest.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
          if (event === 'change') listeners.set(query, handler);
        }),
        removeEventListener: jest.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
          if (event === 'change' && listeners.get(query) === handler) listeners.delete(query);
        }),
      })),
    });
  });

  it('returns false initially (SSR-safe default)', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'));
    // Before useEffect runs on mount, the initial state is false
    // After mount, it reads matchMedia which we set to false
    expect(result.current).toBe(false);
  });

  it('returns true when query matches', () => {
    matchesMap.set('(min-width: 1024px)', true);
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'));
    expect(result.current).toBe(true);
  });

  it('updates when media query changes', () => {
    matchesMap.set('(min-width: 1024px)', false);
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'));
    expect(result.current).toBe(false);

    // Simulate a media query change
    act(() => {
      const handler = listeners.get('(min-width: 1024px)');
      if (handler) {
        handler({ matches: true } as MediaQueryListEvent);
      }
    });

    expect(result.current).toBe(true);
  });

  it('cleans up listener on unmount', () => {
    const { unmount } = renderHook(() => useMediaQuery('(min-width: 1024px)'));
    unmount();
    expect(listeners.has('(min-width: 1024px)')).toBe(false);
  });
});
