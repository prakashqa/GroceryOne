import { createWedgeDetector } from '@/lib/barcode/keyboardWedge';

/**
 * A USB/Bluetooth keyboard-wedge scanner types the barcode as a very fast
 * burst of keydowns terminated by Enter. A human types far slower. The
 * detector distinguishes the two purely by inter-key timing, so it must be
 * driven by an injectable clock — no real timers.
 */
describe('createWedgeDetector — distinguishes scanner bursts from human typing', () => {
  function feed(detector: ReturnType<typeof createWedgeDetector>, keys: string[], startTs: number, gapMs: number) {
    let ts = startTs;
    for (const key of keys) {
      detector.handleKey(key, ts);
      ts += gapMs;
    }
  }

  it('emits the buffered code on a fast burst terminated by Enter', () => {
    const onScan = jest.fn();
    const d = createWedgeDetector({ onScan });
    feed(d, '5901234123457'.split(''), 1000, 10); // 10ms apart = scanner speed
    d.handleKey('Enter', 1000 + 13 * 10);
    expect(onScan).toHaveBeenCalledTimes(1);
    expect(onScan).toHaveBeenCalledWith('5901234123457');
  });

  it('does NOT emit for human-speed typing even when Enter is pressed', () => {
    const onScan = jest.fn();
    const d = createWedgeDetector({ onScan });
    feed(d, '5901234123457'.split(''), 1000, 200); // 200ms apart = human
    d.handleKey('Enter', 1000 + 13 * 200);
    expect(onScan).not.toHaveBeenCalled();
  });

  it('does NOT emit when the burst is shorter than minLength', () => {
    const onScan = jest.fn();
    const d = createWedgeDetector({ onScan, minLength: 4 });
    feed(d, '123'.split(''), 1000, 10);
    d.handleKey('Enter', 1040);
    expect(onScan).not.toHaveBeenCalled();
  });

  it('resets the buffer when a gap appears mid-burst (only post-gap chars survive)', () => {
    const onScan = jest.fn();
    const d = createWedgeDetector({ onScan, minLength: 4 });
    feed(d, '12'.split(''), 1000, 10);
    // Long pause — human interruption — then a few fast keys + Enter.
    feed(d, '34'.split(''), 5000, 10); // only "34" survives (2 < minLength)
    d.handleKey('Enter', 5050);
    expect(onScan).not.toHaveBeenCalled();
  });

  it('ignores modifier/navigation keys (multi-char key names) inside a burst', () => {
    const onScan = jest.fn();
    const d = createWedgeDetector({ onScan });
    let ts = 1000;
    for (const k of '8901'.split('')) { d.handleKey(k, ts); ts += 10; }
    d.handleKey('Shift', ts); ts += 10; // ignored, not appended, doesn't break burst
    for (const k of '2345'.split('')) { d.handleKey(k, ts); ts += 10; }
    d.handleKey('Enter', ts);
    expect(onScan).toHaveBeenCalledWith('89012345');
  });

  it('supports alphanumeric CODE-128 payloads', () => {
    const onScan = jest.fn();
    const d = createWedgeDetector({ onScan });
    feed(d, 'ABC12345'.split(''), 1000, 12); // last key at 1000 + 7*12 = 1084
    d.handleKey('Enter', 1096); // within maxInterKeyMs of the last key
    expect(onScan).toHaveBeenCalledWith('ABC12345');
  });

  it('handles two consecutive scans (buffer cleared after emit)', () => {
    const onScan = jest.fn();
    const d = createWedgeDetector({ onScan });
    feed(d, '11112222'.split(''), 1000, 10);
    d.handleKey('Enter', 1100);
    feed(d, '33334444'.split(''), 2000, 10);
    d.handleKey('Enter', 2100);
    expect(onScan).toHaveBeenNthCalledWith(1, '11112222');
    expect(onScan).toHaveBeenNthCalledWith(2, '33334444');
  });

  it('reset() clears a partial buffer', () => {
    const onScan = jest.fn();
    const d = createWedgeDetector({ onScan });
    feed(d, '9999'.split(''), 1000, 10);
    d.reset();
    d.handleKey('Enter', 1050);
    expect(onScan).not.toHaveBeenCalled();
  });
});
