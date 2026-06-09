/**
 * USB / Bluetooth keyboard-wedge barcode scanner detector.
 *
 * These scanners are HID keyboards: on a scan they "type" the barcode as a
 * very fast burst of keydown events and finish with Enter. A human typing on a
 * real keyboard is an order of magnitude slower. We exploit that: characters
 * arriving within `maxInterKeyMs` of each other are treated as part of one
 * scanner burst; a longer gap resets the buffer (it was human input). On the
 * terminating Enter we emit the buffer if it reached `minLength`.
 *
 * The detector is pure and clock-injected — `handleKey(key, ts)` takes the
 * timestamp explicitly — so it can be unit-tested deterministically without
 * real timers. The React hook (`useBarcodeScanner`) supplies `performance.now()`.
 */
export interface WedgeOptions {
  onScan: (code: string) => void;
  /** Minimum decoded length to count as a real barcode. Default 4. */
  minLength?: number;
  /** Max gap (ms) between keys to still be considered one burst. Default 50. */
  maxInterKeyMs?: number;
  /** Key name that terminates a scan. Default 'Enter'. */
  terminator?: string;
}

export interface WedgeDetector {
  /** Feed one keydown. `ts` is a monotonic millisecond timestamp. */
  handleKey: (key: string, ts: number) => void;
  /** Discard any partially-buffered input. */
  reset: () => void;
}

export function createWedgeDetector(options: WedgeOptions): WedgeDetector {
  const {
    onScan,
    minLength = 4,
    maxInterKeyMs = 50,
    terminator = 'Enter',
  } = options;

  let buffer = '';
  let lastTs = -Infinity;

  const reset = () => {
    buffer = '';
    lastTs = -Infinity;
  };

  const handleKey = (key: string, ts: number) => {
    // A gap longer than the burst threshold means this keystroke isn't part of
    // a scanner burst — drop whatever we had buffered (it was human typing).
    if (ts - lastTs > maxInterKeyMs) {
      buffer = '';
    }

    if (key === terminator) {
      const code = buffer;
      buffer = '';
      lastTs = -Infinity;
      if (code.length >= minLength) onScan(code);
      return;
    }

    // Printable single characters extend the buffer. Multi-char key names
    // (Shift, Tab, ArrowLeft, …) are control keys: ignore them but DON'T break
    // the burst — some scanners emit a Shift before capital letters.
    if (key.length === 1) {
      buffer += key;
    }
    lastTs = ts;
  };

  return { handleKey, reset };
}
