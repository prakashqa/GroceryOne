'use client';

import { useEffect, useRef } from 'react';
import { createWedgeDetector, type WedgeOptions } from '@/lib/barcode/keyboardWedge';

export interface UseBarcodeScannerOptions {
  /** Called with the decoded barcode when a scanner burst completes. */
  onScan: (code: string) => void;
  /** Attach the listener only when true. Default true. */
  enabled?: boolean;
  /**
   * Capture bursts even while focus is in a text input/textarea. Default false
   * so the POS search box and dialogs keep normal human typing. Item-management
   * "scan to fill the barcode field" passes true.
   */
  captureInInput?: boolean;
  /** Override detector tuning (minLength, maxInterKeyMs, terminator). */
  detector?: Omit<WedgeOptions, 'onScan'>;
}

function isEditableTarget(el: EventTarget | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    el.isContentEditable
  );
}

/**
 * Listen for USB/Bluetooth keyboard-wedge barcode scanners at the window level
 * and surface decoded codes via `onScan`. Mount this per-page (POS, item form)
 * — never in a shared/auth layout — so it never interferes with PIN entry.
 *
 * Timing comes from `performance.now()`; the heavy lifting is the pure
 * `createWedgeDetector`, which is unit-tested separately.
 */
export function useBarcodeScanner({
  onScan,
  enabled = true,
  captureInInput = false,
  detector,
}: UseBarcodeScannerOptions): void {
  // Keep the latest onScan without re-binding the listener every render.
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!enabled) return;

    const wedge = createWedgeDetector({
      ...detector,
      onScan: (code) => onScanRef.current(code),
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip when typing into a field, unless this scanner is meant to fill it.
      if (!captureInInput && isEditableTarget(e.target)) return;
      wedge.handleKey(e.key, performance.now());
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // detector is a stable options object from the caller; spreading it in deps
    // would re-bind on every render, so we intentionally depend on primitives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, captureInInput]);
}
