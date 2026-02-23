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

import { NativeModules } from 'react-native';

const { ReceiptBitmap } = NativeModules;

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
  return ReceiptBitmap.renderTextToImage(text, width, fontSize);
};
