/**
 * OcrService
 * Handles OCR processing using Google Cloud Vision API
 */

import * as FileSystem from 'expo-file-system';
import { OcrResult, DetectedLanguage, ScanErrorType } from '../types/scanning.types';

/**
 * Configuration for OcrService
 */
export interface OcrServiceConfig {
  timeoutMs?: number;       // default: 30000
  maxRetries?: number;      // default: 2
  initialDelayMs?: number;  // default: 1000
  onRetry?: (attempt: number, maxRetries: number) => void;
}

const GOOGLE_VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

/**
 * Telugu Unicode range for language detection
 * Telugu: U+0C00 to U+0C7F
 */
const TELUGU_REGEX = /[\u0C00-\u0C7F]/;

export class OcrService {
  private apiKey: string;
  private timeoutMs: number;
  private maxRetries: number;
  private initialDelayMs: number;
  private config: OcrServiceConfig;

  constructor(apiKey: string, config?: OcrServiceConfig) {
    if (!apiKey) {
      throw new Error('API key is required');
    }
    this.apiKey = apiKey;
    this.config = config || {};
    this.timeoutMs = config?.timeoutMs ?? 30000;
    this.maxRetries = config?.maxRetries ?? 2;
    this.initialDelayMs = config?.initialDelayMs ?? 1000;
  }

  /**
   * Process an image and extract text using Google Cloud Vision API
   * Supports timeout and external cancellation via AbortSignal.
   */
  async processImage(imageUri: string, externalSignal?: AbortSignal): Promise<OcrResult> {
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), this.timeoutMs);

    // Compose: abort if EITHER timeout OR external cancel fires
    const composedController = new AbortController();
    const abortComposed = () => composedController.abort();
    timeoutController.signal.addEventListener('abort', abortComposed);
    externalSignal?.addEventListener('abort', abortComposed);

    try {
      // Read image file and convert to base64
      const base64Image = await this.readImageAsBase64(imageUri);

      // Call Google Cloud Vision API
      const response = await this.callVisionApi(base64Image, composedController.signal);

      // Clean up timer on success
      clearTimeout(timeoutId);

      // Parse the response
      return this.parseApiResponse(response);
    } catch (error) {
      clearTimeout(timeoutId);

      // Check cancellation causes in priority order
      if (externalSignal?.aborted) {
        return this.createErrorResult('Scan cancelled', 'cancelled');
      }
      if (timeoutController.signal.aborted) {
        return this.createErrorResult('Request timed out', 'timeout');
      }

      const message = error instanceof Error ? error.message : 'Unknown error occurred';

      // Surface the actual cause in dev so the next "Something went wrong"
      // bug isn't a black box. Production behaviour is unchanged.
      // eslint-disable-next-line no-undef
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.error('[OcrService] processImage failure:', error);
      }

      // Classify HTTP errors thrown by callVisionApi as api_error so the UI
      // shows "Server error. Please try again." instead of the generic
      // "Something went wrong." and so the retry policy correctly skips 4xx.
      if (message.startsWith('API request failed:')) {
        return this.createErrorResult(message, 'api_error');
      }

      return this.createErrorResult(message, 'unknown');
    } finally {
      timeoutController.signal.removeEventListener('abort', abortComposed);
      externalSignal?.removeEventListener('abort', abortComposed);
    }
  }

  /**
   * Read image file and convert to base64
   */
  private async readImageAsBase64(imageUri: string): Promise<string> {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  }

  /**
   * Call Google Cloud Vision API
   */
  private async callVisionApi(base64Image: string, signal?: AbortSignal): Promise<unknown> {
    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image,
          },
          features: [
            {
              type: 'DOCUMENT_TEXT_DETECTION',
              maxResults: 1,
            },
          ],
          imageContext: {
            languageHints: ['en', 'te'],
          },
        },
      ],
    };

    const response = await fetch(`${GOOGLE_VISION_API_URL}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal,
    });

    if (!response.ok) {
      // Try to read the response body so the actual Vision API message
      // (e.g. "API key not valid", "Quota exceeded") makes it into logs and
      // the surfaced error message — the bare status text is rarely useful.
      let detail = '';
      try {
        const body = await response.text();
        if (body) {
          // Vision API errors are JSON: { error: { message, code, status } }
          try {
            const parsed = JSON.parse(body) as { error?: { message?: string } };
            detail = parsed?.error?.message || body;
          } catch {
            detail = body;
          }
        }
      } catch {
        // Reading body failed — fall back to status text only
      }
      const detailSuffix = detail ? ` — ${detail}` : '';
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}${detailSuffix}`,
      );
    }

    return response.json();
  }

  /**
   * Parse Google Cloud Vision API response
   */
  private parseApiResponse(response: unknown): OcrResult {
    // Type assertion for the response structure
    const typedResponse = response as {
      responses?: Array<{
        fullTextAnnotation?: {
          text?: string;
        };
        textAnnotations?: Array<{
          description?: string;
          locale?: string;
        }>;
        error?: {
          message?: string;
        };
      }>;
    };

    const firstResponse = typedResponse.responses?.[0];

    // Check for API-level error (HTTP 200 but Vision API rejected the image)
    if (firstResponse?.error) {
      return this.createErrorResult(
        firstResponse.error.message || 'Vision API error',
        'api_error',
      );
    }

    // Extract text from response
    const fullText = firstResponse?.fullTextAnnotation?.text || '';
    const textAnnotations = firstResponse?.textAnnotations || [];

    if (!fullText && textAnnotations.length === 0) {
      return this.createErrorResult('No text detected in image', 'no_text');
    }

    // Use full text if available, otherwise use first annotation
    const rawText = fullText || textAnnotations[0]?.description || '';

    // Split into lines and filter empty ones
    const lines = rawText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // Detect language from API response or text content
    let detectedLanguage: DetectedLanguage = 'en';
    const apiLocale = textAnnotations[0]?.locale;

    if (apiLocale === 'te') {
      detectedLanguage = 'te';
    } else {
      // Fallback to content-based detection
      detectedLanguage = this.detectLanguage(rawText);
    }

    return {
      success: true,
      rawText,
      lines,
      detectedLanguage,
    };
  }

  /**
   * Detect language from text content
   */
  detectLanguage(text: string): DetectedLanguage {
    const hasEnglish = /[a-zA-Z]/.test(text);
    const hasTelugu = TELUGU_REGEX.test(text);

    if (hasEnglish && hasTelugu) {
      return 'mixed';
    } else if (hasTelugu) {
      return 'te';
    } else {
      return 'en';
    }
  }

  /**
   * Check if the device is online by making a lightweight HEAD request.
   * Uses Google's generate_204 endpoint with a 3s timeout.
   */
  static async isOnline(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      await fetch('https://clients3.google.com/generate_204', {
        method: 'HEAD',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Process image with automatic retry and exponential backoff.
   * Wraps processImage() — retries on network/server errors, never retries
   * on cancellation, 4xx errors, or non-retryable content errors (no_text, no_items).
   */
  async processImageWithRetry(
    imageUri: string,
    externalSignal?: AbortSignal
  ): Promise<OcrResult> {
    // Pre-flight offline check
    const online = await OcrService.isOnline();
    if (!online) {
      return this.createErrorResult('No internet connection', 'offline');
    }

    let lastResult: OcrResult | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      // Check cancellation before each attempt
      if (externalSignal?.aborted) {
        return this.createErrorResult('Scan cancelled', 'cancelled');
      }

      // Backoff delay before retries (not before first attempt)
      if (attempt > 0) {
        this.config.onRetry?.(attempt, this.maxRetries);
        const delay = this.initialDelayMs * Math.pow(2, attempt - 1);
        await this.sleep(delay, externalSignal);

        // Check cancellation after sleep
        if (externalSignal?.aborted) {
          return this.createErrorResult('Scan cancelled', 'cancelled');
        }
      }

      lastResult = await this.processImage(imageUri, externalSignal);

      // Success — return immediately
      if (lastResult.success) return lastResult;

      // Don't retry non-retryable error types
      const nonRetryableTypes: ScanErrorType[] = ['cancelled', 'no_text', 'no_items'];
      if (lastResult.errorType && nonRetryableTypes.includes(lastResult.errorType)) {
        return lastResult;
      }

      // Don't retry 4xx client errors
      if (lastResult.error?.includes('API request failed: 4')) {
        return lastResult;
      }
    }

    return lastResult!;
  }

  /**
   * Sleep for specified milliseconds, interruptible by AbortSignal
   */
  private sleep(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
      const timer = setTimeout(resolve, ms);
      signal?.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          resolve();
        },
        { once: true }
      );
    });
  }

  /**
   * Create an error result with optional error type classification
   */
  private createErrorResult(errorMessage: string, errorType?: ScanErrorType): OcrResult {
    return {
      success: false,
      rawText: '',
      lines: [],
      detectedLanguage: 'en',
      error: errorMessage,
      errorType,
    };
  }
}

// Factory function to create OcrService instance
export const createOcrService = (apiKey: string): OcrService => {
  return new OcrService(apiKey);
};
