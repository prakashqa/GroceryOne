import { renderHook } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';

/**
 * The hook attaches a window keydown listener, feeds the pure wedge detector a
 * monotonic timestamp, and calls onScan when a scanner burst completes. Timing
 * is driven by performance.now(), which we control here.
 */
describe('useBarcodeScanner', () => {
  let nowValue = 0;
  let nowSpy: jest.SpyInstance;

  beforeEach(() => {
    nowValue = 1000;
    nowSpy = jest.spyOn(performance, 'now').mockImplementation(() => nowValue);
  });
  afterEach(() => {
    nowSpy.mockRestore();
    document.body.innerHTML = '';
  });

  /** Type a code as a fast scanner burst on the given target. */
  function scan(code: string, target: Window | Element = window, gap = 10) {
    for (const key of code.split('')) {
      nowValue += gap;
      fireEvent.keyDown(target as any, { key });
    }
    nowValue += gap;
    fireEvent.keyDown(target as any, { key: 'Enter' });
  }

  it('calls onScan on a fast burst terminated by Enter', () => {
    const onScan = jest.fn();
    renderHook(() => useBarcodeScanner({ onScan }));
    scan('5901234123457');
    expect(onScan).toHaveBeenCalledWith('5901234123457');
  });

  it('does nothing when enabled is false', () => {
    const onScan = jest.fn();
    renderHook(() => useBarcodeScanner({ onScan, enabled: false }));
    scan('5901234123457');
    expect(onScan).not.toHaveBeenCalled();
  });

  it('ignores bursts while focus is in a text input (default captureInInput=false)', () => {
    const onScan = jest.fn();
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    renderHook(() => useBarcodeScanner({ onScan }));
    scan('5901234123457', input);
    expect(onScan).not.toHaveBeenCalled();
  });

  it('captures bursts inside an input when captureInInput is true', () => {
    const onScan = jest.fn();
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    renderHook(() => useBarcodeScanner({ onScan, captureInInput: true }));
    scan('5901234123457', input);
    expect(onScan).toHaveBeenCalledWith('5901234123457');
  });

  it('removes the listener on unmount', () => {
    const onScan = jest.fn();
    const { unmount } = renderHook(() => useBarcodeScanner({ onScan }));
    unmount();
    scan('5901234123457');
    expect(onScan).not.toHaveBeenCalled();
  });
});
