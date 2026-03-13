/**
 * Receipt Bitmap Renderer
 * =======================
 * TypeScript wrapper for the ReceiptBitmap native Android module.
 *
 * Thermal receipt printers use single-byte codepages (CP437/Windows-1252) and
 * cannot render multi-byte scripts like Telugu in text mode. This module uses
 * Android's native Canvas + StaticLayout to render receipt text (including Telugu)
 * to a base64 PNG bitmap, which is then sent to the printer via printImageBase64().
 */

import { NativeModules, Platform } from 'react-native';

const ReceiptBitmap = Platform.OS !== 'web' ? NativeModules.ReceiptBitmap : null;

/**
 * Render pre-formatted receipt text to a base64 PNG image using Android's native Canvas.
 *
 * Uses Android's built-in text rendering which natively supports Telugu, Devanagari,
 * and other Indic scripts through font fallback chains:
 * - ASCII characters → Monospace font (Droid Sans Mono)
 * - Telugu characters → Noto Sans Telugu (automatic system fallback)
 *
 * @param text      Pre-formatted receipt text with newlines and column alignment
 * @param width     Image width in pixels (576 for 80mm paper, 384 for 58mm paper)
 * @param fontSize  Initial font size in pixels (default 33 — the native module
 *                  auto-scales this down if needed to fit all characters within
 *                  the bitmap width; with 28 chars/line at 576px the effective size is ~20.6px/char)
 * @returns         Base64-encoded PNG string (no data URI prefix)
 */
export const renderTextToImage = (
  text: string,
  width: number,
  fontSize: number = 33,
): Promise<string> => {
  if (!ReceiptBitmap) {
    return Promise.reject(
      new Error(
        'ReceiptBitmap native module not available. ' +
        'Ensure you are using a development build (not Expo Go). ' +
        'Run: npx expo run:android'
      )
    );
  }
  return ReceiptBitmap.renderTextToImage(text, width, fontSize);
};

/**
 * Render pre-formatted receipt text to multiple base64 PNG images (chunked).
 *
 * Large receipts (many items) produce bitmaps that exceed the printer's maximum
 * printable image height (~2000-4000px depending on model). This method splits
 * the receipt into multiple smaller bitmaps, each ≤ 400px tall, which can be
 * printed sequentially without silent truncation or BLE buffer overflow.
 *
 * Falls back to single-image rendering if the native chunked method is unavailable.
 *
 * @param text      Pre-formatted receipt text with newlines and column alignment
 * @param width     Image width in pixels (576 for 80mm paper, 384 for 58mm paper)
 * @param fontSize  Initial font size in pixels (default 33)
 * @returns         Array of base64-encoded PNG strings (one per chunk)
 */
export const renderTextToImages = async (
  text: string,
  width: number,
  fontSize: number = 33,
): Promise<string[]> => {
  if (!ReceiptBitmap) {
    return Promise.reject(
      new Error(
        'ReceiptBitmap native module not available. ' +
        'Ensure you are using a development build (not Expo Go). ' +
        'Run: npx expo run:android'
      )
    );
  }

  // Use native chunked method if available, otherwise fall back to single image
  if (typeof ReceiptBitmap.renderTextToImages === 'function') {
    const chunks: string[] = await ReceiptBitmap.renderTextToImages(text, width, fontSize);
    // Filter out empty/null chunks that may result from native bitmap creation failures
    const validChunks = chunks.filter((c: string) => c && c.length > 0);
    if (validChunks.length === 0) {
      throw new Error('Receipt rendering produced no valid image chunks');
    }
    return validChunks;
  }

  // Fallback: single image wrapped in array
  const singleImage = await ReceiptBitmap.renderTextToImage(text, width, fontSize);
  if (!singleImage || singleImage.length === 0) {
    throw new Error('Receipt rendering produced no valid image data');
  }
  return [singleImage];
};
