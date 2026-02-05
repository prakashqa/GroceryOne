/**
 * OcrService Tests
 * TDD: Tests written first to define expected behavior
 */

import { OcrService } from '../OcrService';
import { OcrResult } from '../../types/scanning.types';

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: {
    Base64: 'base64',
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('OcrService', () => {
  let ocrService: OcrService;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    jest.clearAllMocks();
    ocrService = new OcrService(mockApiKey);
  });

  describe('processImage', () => {
    const mockImageUri = 'file:///path/to/image.jpg';

    beforeEach(() => {
      // Mock file system to return base64 image data
      const FileSystem = require('expo-file-system');
      FileSystem.readAsStringAsync.mockResolvedValue('base64ImageData');
    });

    it('should successfully process an image with English text', async () => {
      // Mock successful Google Vision API response
      const mockApiResponse = {
        responses: [
          {
            fullTextAnnotation: {
              text: 'Toor Dal 1 kg\nBasmati Rice 5 kg\nSugar 500 gm',
            },
            textAnnotations: [
              {
                description: 'Toor Dal 1 kg\nBasmati Rice 5 kg\nSugar 500 gm',
                locale: 'en',
              },
            ],
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const result = await ocrService.processImage(mockImageUri);

      expect(result.success).toBe(true);
      expect(result.rawText).toBe('Toor Dal 1 kg\nBasmati Rice 5 kg\nSugar 500 gm');
      expect(result.lines).toHaveLength(3);
      expect(result.lines[0]).toBe('Toor Dal 1 kg');
      expect(result.lines[1]).toBe('Basmati Rice 5 kg');
      expect(result.lines[2]).toBe('Sugar 500 gm');
      expect(result.detectedLanguage).toBe('en');
    });

    it('should successfully process an image with Telugu text', async () => {
      const mockApiResponse = {
        responses: [
          {
            fullTextAnnotation: {
              text: 'కందిపప్పు 1 కి.గ్రా\nబియ్యం 5 కి.గ్రా',
            },
            textAnnotations: [
              {
                description: 'కందిపప్పు 1 కి.గ్రా\nబియ్యం 5 కి.గ్రా',
                locale: 'te',
              },
            ],
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const result = await ocrService.processImage(mockImageUri);

      expect(result.success).toBe(true);
      expect(result.detectedLanguage).toBe('te');
      expect(result.lines).toHaveLength(2);
    });

    it('should detect mixed language text', async () => {
      const mockApiResponse = {
        responses: [
          {
            fullTextAnnotation: {
              text: 'Rice 5 kg\nకందిపప్పు 1 కి.గ్రా',
            },
            textAnnotations: [
              {
                description: 'Rice 5 kg\nకందిపప్పు 1 కి.గ్రా',
              },
            ],
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const result = await ocrService.processImage(mockImageUri);

      expect(result.success).toBe(true);
      expect(result.detectedLanguage).toBe('mixed');
    });

    it('should handle empty OCR response', async () => {
      const mockApiResponse = {
        responses: [
          {
            // No text detected
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const result = await ocrService.processImage(mockImageUri);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No text detected in image');
      expect(result.rawText).toBe('');
      expect(result.lines).toHaveLength(0);
    });

    it('should handle API error response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      const result = await ocrService.processImage(mockImageUri);

      expect(result.success).toBe(false);
      expect(result.error).toContain('API request failed');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await ocrService.processImage(mockImageUri);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should handle file read errors', async () => {
      const FileSystem = require('expo-file-system');
      FileSystem.readAsStringAsync.mockRejectedValueOnce(
        new Error('File not found')
      );

      const result = await ocrService.processImage(mockImageUri);

      expect(result.success).toBe(false);
      expect(result.error).toContain('File not found');
    });

    it('should filter out empty lines', async () => {
      const mockApiResponse = {
        responses: [
          {
            fullTextAnnotation: {
              text: 'Toor Dal 1 kg\n\n\nBasmati Rice 5 kg\n  \nSugar 500 gm',
            },
            textAnnotations: [
              {
                description: 'Toor Dal 1 kg\n\n\nBasmati Rice 5 kg\n  \nSugar 500 gm',
                locale: 'en',
              },
            ],
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const result = await ocrService.processImage(mockImageUri);

      expect(result.success).toBe(true);
      expect(result.lines).toHaveLength(3);
      expect(result.lines).not.toContain('');
      expect(result.lines).not.toContain('  ');
    });

    it('should call Google Vision API with correct parameters', async () => {
      const FileSystem = require('expo-file-system');
      FileSystem.readAsStringAsync.mockResolvedValue('testBase64Data');

      const mockApiResponse = {
        responses: [
          {
            fullTextAnnotation: { text: 'Test' },
            textAnnotations: [{ description: 'Test', locale: 'en' }],
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      await ocrService.processImage(mockImageUri);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('vision.googleapis.com'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('DOCUMENT_TEXT_DETECTION'),
        })
      );

      // Verify request body contains base64 image and language hints
      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.requests[0].image.content).toBe('testBase64Data');
      expect(body.requests[0].imageContext.languageHints).toContain('en');
      expect(body.requests[0].imageContext.languageHints).toContain('te');
    });
  });

  describe('detectLanguage', () => {
    it('should detect English text', () => {
      expect(ocrService.detectLanguage('Toor Dal 5 kg')).toBe('en');
    });

    it('should detect Telugu text', () => {
      expect(ocrService.detectLanguage('కందిపప్పు 1 కిలో')).toBe('te');
    });

    it('should detect mixed text', () => {
      expect(ocrService.detectLanguage('Rice కందిపప్పు')).toBe('mixed');
    });

    it('should return "en" for numbers only', () => {
      expect(ocrService.detectLanguage('123 456')).toBe('en');
    });
  });

  describe('without API key', () => {
    it('should throw error when API key is not provided', () => {
      expect(() => new OcrService('')).toThrow('API key is required');
    });
  });
});
