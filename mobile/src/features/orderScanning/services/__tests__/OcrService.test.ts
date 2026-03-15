/**
 * OcrService Tests
 * TDD: Tests written first to define expected behavior
 */
/* eslint-disable @typescript-eslint/no-var-requires */

import { OcrService } from '../OcrService';

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

  describe('timeout handling', () => {
    const mockImageUri = 'file:///path/to/image.jpg';

    /**
     * Helper: creates a fetch mock that never resolves on its own
     * but properly rejects when AbortSignal fires.
     */
    function mockFetchWithSignalSupport() {
      (global.fetch as jest.Mock).mockImplementation(
        (_url: string, options: RequestInit) =>
          new Promise((_resolve, reject) => {
            const signal = options?.signal;
            if (signal?.aborted) {
              reject(new DOMException('The operation was aborted', 'AbortError'));
              return;
            }
            signal?.addEventListener('abort', () => {
              reject(new DOMException('The operation was aborted', 'AbortError'));
            });
          })
      );
    }

    beforeEach(() => {
      const FileSystem = require('expo-file-system');
      FileSystem.readAsStringAsync.mockResolvedValue('base64ImageData');
    });

    it('should abort request after custom timeout', async () => {
      mockFetchWithSignalSupport();

      const service = new OcrService(mockApiKey, { timeoutMs: 50 });
      const result = await service.processImage(mockImageUri);

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('timeout');
    }, 10000);

    it('should return error result with timeout type and error message', async () => {
      mockFetchWithSignalSupport();

      const service = new OcrService(mockApiKey, { timeoutMs: 50 });
      const result = await service.processImage(mockImageUri);

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('timeout');
      expect(result.error).toBe('Request timed out');
      expect(result.rawText).toBe('');
      expect(result.lines).toHaveLength(0);
    }, 10000);

    it('should clean up timer when request succeeds before timeout', async () => {
      const mockApiResponse = {
        responses: [{
          fullTextAnnotation: { text: 'Test' },
          textAnnotations: [{ description: 'Test', locale: 'en' }],
        }],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const service = new OcrService(mockApiKey, { timeoutMs: 100 });
      const result = await service.processImage(mockImageUri);

      expect(result.success).toBe(true);
      expect(result.errorType).toBeUndefined();
    }, 10000);

    it('should use default timeout of 30000ms when not configured', () => {
      // Verify constructor sets correct default — indirectly tested via config
      const service = new OcrService(mockApiKey);
      // Access private field through any for testing
      expect((service as any).timeoutMs).toBe(30000);
    });
  });

  describe('external cancellation', () => {
    const mockImageUri = 'file:///path/to/image.jpg';

    beforeEach(() => {
      const FileSystem = require('expo-file-system');
      FileSystem.readAsStringAsync.mockResolvedValue('base64ImageData');
    });

    it('should accept an external AbortSignal for cancellation', async () => {
      // fetch that responds to abort signal
      (global.fetch as jest.Mock).mockImplementation(
        (_url: string, options: RequestInit) =>
          new Promise((_resolve, reject) => {
            const signal = options?.signal;
            if (signal?.aborted) {
              reject(new DOMException('The operation was aborted', 'AbortError'));
              return;
            }
            signal?.addEventListener('abort', () => {
              reject(new DOMException('The operation was aborted', 'AbortError'));
            });
          })
      );

      const controller = new AbortController();
      const service = new OcrService(mockApiKey, { timeoutMs: 30000 });
      const resultPromise = service.processImage(mockImageUri, controller.signal);

      // Cancel externally after a short delay to ensure fetch is called
      setTimeout(() => controller.abort(), 10);

      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('cancelled');
    }, 10000);

    it('should return cancelled error with message when externally aborted', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        (_url: string, options: RequestInit) =>
          new Promise((_resolve, reject) => {
            const signal = options?.signal;
            if (signal?.aborted) {
              reject(new DOMException('The operation was aborted', 'AbortError'));
              return;
            }
            signal?.addEventListener('abort', () => {
              reject(new DOMException('The operation was aborted', 'AbortError'));
            });
          })
      );

      const controller = new AbortController();
      const service = new OcrService(mockApiKey, { timeoutMs: 30000 });
      const resultPromise = service.processImage(mockImageUri, controller.signal);

      setTimeout(() => controller.abort(), 10);

      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('cancelled');
      expect(result.error).toBe('Scan cancelled');
    }, 10000);
  });

  describe('retry with exponential backoff (processImageWithRetry)', () => {
    const mockImageUri = 'file:///path/to/image.jpg';

    const mockSuccessApiResponse = {
      responses: [{
        fullTextAnnotation: { text: 'Toor Dal 1 kg' },
        textAnnotations: [{ description: 'Toor Dal 1 kg', locale: 'en' }],
      }],
    };

    beforeEach(() => {
      const FileSystem = require('expo-file-system');
      FileSystem.readAsStringAsync.mockResolvedValue('base64ImageData');
      // Mock isOnline to always return true — offline detection is tested separately
      jest.spyOn(OcrService, 'isOnline').mockResolvedValue(true);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should retry on network error up to maxRetries', async () => {
      // All attempts fail with network error
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const service = new OcrService(mockApiKey, {
        timeoutMs: 5000,
        maxRetries: 2,
        initialDelayMs: 10, // Short delays for fast tests
      });

      const result = await service.processImageWithRetry(mockImageUri);

      expect(result.success).toBe(false);
      // 1 initial + 2 retries = 3 total fetch calls
      expect(global.fetch).toHaveBeenCalledTimes(3);
    }, 15000);

    it('should retry on 5xx server error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });

      const service = new OcrService(mockApiKey, {
        timeoutMs: 5000,
        maxRetries: 1,
        initialDelayMs: 10,
      });

      const result = await service.processImageWithRetry(mockImageUri);

      expect(result.success).toBe(false);
      // 1 initial + 1 retry = 2 total fetch calls
      expect(global.fetch).toHaveBeenCalledTimes(2);
    }, 15000);

    it('should NOT retry on 4xx client error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      const service = new OcrService(mockApiKey, {
        timeoutMs: 5000,
        maxRetries: 2,
        initialDelayMs: 10,
      });

      const result = await service.processImageWithRetry(mockImageUri);

      expect(result.success).toBe(false);
      // Only 1 call — no retries for 4xx
      expect(global.fetch).toHaveBeenCalledTimes(1);
    }, 15000);

    it('should NOT retry on cancellation', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        (_url: string, options: RequestInit) =>
          new Promise((_resolve, reject) => {
            const signal = options?.signal;
            if (signal?.aborted) {
              reject(new DOMException('Aborted', 'AbortError'));
              return;
            }
            signal?.addEventListener('abort', () => {
              reject(new DOMException('Aborted', 'AbortError'));
            });
          })
      );

      const controller = new AbortController();
      const service = new OcrService(mockApiKey, {
        timeoutMs: 30000,
        maxRetries: 2,
        initialDelayMs: 10,
      });

      const resultPromise = service.processImageWithRetry(mockImageUri, controller.signal);
      setTimeout(() => controller.abort(), 10);

      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('cancelled');
      // Should only attempt once, not retry after cancellation
      expect(global.fetch).toHaveBeenCalledTimes(1);
    }, 15000);

    it('should use exponential backoff delays', async () => {
      const callTimestamps: number[] = [];

      (global.fetch as jest.Mock).mockImplementation(() => {
        callTimestamps.push(Date.now());
        return Promise.reject(new Error('Network error'));
      });

      const service = new OcrService(mockApiKey, {
        timeoutMs: 5000,
        maxRetries: 2,
        initialDelayMs: 50, // 50ms base delay
      });

      await service.processImageWithRetry(mockImageUri);

      expect(callTimestamps.length).toBe(3); // 1 + 2 retries
      // First retry: ~50ms delay (initialDelayMs * 2^0 = 50)
      const firstDelay = callTimestamps[1] - callTimestamps[0];
      expect(firstDelay).toBeGreaterThanOrEqual(40); // Allow some tolerance
      // Second retry: ~100ms delay (initialDelayMs * 2^1 = 100)
      const secondDelay = callTimestamps[2] - callTimestamps[1];
      expect(secondDelay).toBeGreaterThanOrEqual(80); // Allow some tolerance
    }, 15000);

    it('should call onRetry callback with attempt number', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const onRetry = jest.fn();
      const service = new OcrService(mockApiKey, {
        timeoutMs: 5000,
        maxRetries: 2,
        initialDelayMs: 10,
        onRetry,
      });

      await service.processImageWithRetry(mockImageUri);

      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenCalledWith(1, 2);
      expect(onRetry).toHaveBeenCalledWith(2, 2);
    }, 15000);

    it('should return last error after all retries exhausted', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Persistent error'));

      const service = new OcrService(mockApiKey, {
        timeoutMs: 5000,
        maxRetries: 2,
        initialDelayMs: 10,
      });

      const result = await service.processImageWithRetry(mockImageUri);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    }, 15000);

    it('should succeed on second attempt if first fails', async () => {
      // First call fails, second succeeds
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSuccessApiResponse),
        });

      const service = new OcrService(mockApiKey, {
        timeoutMs: 5000,
        maxRetries: 2,
        initialDelayMs: 10,
      });

      const result = await service.processImageWithRetry(mockImageUri);

      expect(result.success).toBe(true);
      expect(result.rawText).toContain('Toor Dal');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    }, 15000);

    it('should NOT retry on no_text error', async () => {
      // API returns empty text
      const emptyResponse = { responses: [{}] };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(emptyResponse),
      });

      const service = new OcrService(mockApiKey, {
        timeoutMs: 5000,
        maxRetries: 2,
        initialDelayMs: 10,
      });

      const result = await service.processImageWithRetry(mockImageUri);

      expect(result.success).toBe(false);
      // Only 1 call — no retries for no_text
      expect(global.fetch).toHaveBeenCalledTimes(1);
    }, 15000);
  });

  describe('offline detection', () => {
    it('isOnline() should return true when HEAD request succeeds', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      const result = await OcrService.isOnline();

      expect(result).toBe(true);
    });

    it('isOnline() should return false when HEAD request fails (network error)', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await OcrService.isOnline();

      expect(result).toBe(false);
    });

    it('isOnline() should return false when HEAD request times out', async () => {
      // Simulate a request that never resolves — will be aborted by internal 3s timeout
      (global.fetch as jest.Mock).mockImplementation(
        (_url: string, options: RequestInit) =>
          new Promise((_resolve, reject) => {
            const signal = options?.signal;
            if (signal?.aborted) {
              reject(new DOMException('Aborted', 'AbortError'));
              return;
            }
            signal?.addEventListener('abort', () => {
              reject(new DOMException('Aborted', 'AbortError'));
            });
          })
      );

      const result = await OcrService.isOnline();

      expect(result).toBe(false);
    }, 10000);

    it('processImageWithRetry should return offline error when isOnline() returns false', async () => {
      const mockImageUri = 'file:///path/to/image.jpg';
      const FileSystem = require('expo-file-system');
      FileSystem.readAsStringAsync.mockResolvedValue('base64ImageData');

      // Mock isOnline to return false
      jest.spyOn(OcrService, 'isOnline').mockResolvedValueOnce(false);

      const service = new OcrService(mockApiKey, {
        timeoutMs: 5000,
        maxRetries: 2,
        initialDelayMs: 10,
      });

      const result = await service.processImageWithRetry(mockImageUri);

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('offline');
      expect(result.error).toBeDefined();
      // fetch should NOT have been called for the actual API
      // (only the isOnline check's fetch, which is mocked via spy)
      expect(global.fetch).not.toHaveBeenCalledWith(
        expect.stringContaining('vision.googleapis.com'),
        expect.anything()
      );
    }, 15000);
  });
});
