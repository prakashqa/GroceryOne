/**
 * receiptBitmap Tests
 * TDD: Validates chunk filtering and error handling for native bitmap rendering
 */

import { NativeModules } from 'react-native';
import { renderTextToImages, renderTextToImage } from '../receiptBitmap';

const mockReceiptBitmap = NativeModules.ReceiptBitmap;

describe('renderTextToImages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return valid chunks when native module works correctly', async () => {
    mockReceiptBitmap.renderTextToImages.mockResolvedValue(['chunk1', 'chunk2']);

    const result = await renderTextToImages('receipt text', 576);
    expect(result).toEqual(['chunk1', 'chunk2']);
  });

  it('should filter out empty strings from chunks', async () => {
    mockReceiptBitmap.renderTextToImages.mockResolvedValue([
      'valid1', '', 'valid2', '',
    ]);

    const result = await renderTextToImages('receipt text', 576);
    expect(result).toEqual(['valid1', 'valid2']);
    expect(result).toHaveLength(2);
  });

  it('should filter out null/falsy values from chunks', async () => {
    mockReceiptBitmap.renderTextToImages.mockResolvedValue([
      null as any, 'valid1', undefined as any,
    ]);

    const result = await renderTextToImages('receipt text', 576);
    expect(result).toEqual(['valid1']);
    expect(result).toHaveLength(1);
  });

  it('should throw when all chunks are empty', async () => {
    mockReceiptBitmap.renderTextToImages.mockResolvedValue(['', '', '']);

    await expect(renderTextToImages('receipt text', 576)).rejects.toThrow(
      'Receipt rendering produced no valid image chunks'
    );
  });

  it('should fall back to single image when renderTextToImages is unavailable', async () => {
    // Temporarily remove renderTextToImages
    const original = mockReceiptBitmap.renderTextToImages;
    mockReceiptBitmap.renderTextToImages = undefined;
    mockReceiptBitmap.renderTextToImage.mockResolvedValue('single-image');

    const result = await renderTextToImages('receipt text', 576);
    expect(result).toEqual(['single-image']);

    // Restore
    mockReceiptBitmap.renderTextToImages = original;
  });

  it('should throw when single-image fallback returns empty string', async () => {
    const original = mockReceiptBitmap.renderTextToImages;
    mockReceiptBitmap.renderTextToImages = undefined;
    mockReceiptBitmap.renderTextToImage.mockResolvedValue('');

    await expect(renderTextToImages('receipt text', 576)).rejects.toThrow(
      'Receipt rendering produced no valid image data'
    );

    mockReceiptBitmap.renderTextToImages = original;
  });
});

describe('renderTextToImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return base64 string from native module', async () => {
    mockReceiptBitmap.renderTextToImage.mockResolvedValue('base64data');

    const result = await renderTextToImage('text', 576);
    expect(result).toBe('base64data');
  });
});
