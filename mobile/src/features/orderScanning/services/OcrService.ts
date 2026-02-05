/**
 * OcrService
 * Handles OCR processing using Google Cloud Vision API
 */

import * as FileSystem from 'expo-file-system';
import { OcrResult, DetectedLanguage } from '../types/scanning.types';

const GOOGLE_VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

/**
 * Telugu Unicode range for language detection
 * Telugu: U+0C00 to U+0C7F
 */
const TELUGU_REGEX = /[\u0C00-\u0C7F]/;

export class OcrService {
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('API key is required');
    }
    this.apiKey = apiKey;
  }

  /**
   * Process an image and extract text using Google Cloud Vision API
   */
  async processImage(imageUri: string): Promise<OcrResult> {
    try {
      // Read image file and convert to base64
      const base64Image = await this.readImageAsBase64(imageUri);

      // Call Google Cloud Vision API
      const response = await this.callVisionApi(base64Image);

      // Parse the response
      return this.parseApiResponse(response);
    } catch (error) {
      return this.createErrorResult(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
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
  private async callVisionApi(base64Image: string): Promise<unknown> {
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
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
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

    // Check for API-level error
    if (firstResponse?.error) {
      return this.createErrorResult(
        firstResponse.error.message || 'Vision API error'
      );
    }

    // Extract text from response
    const fullText = firstResponse?.fullTextAnnotation?.text || '';
    const textAnnotations = firstResponse?.textAnnotations || [];

    if (!fullText && textAnnotations.length === 0) {
      return this.createErrorResult('No text detected in image');
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
   * Create an error result
   */
  private createErrorResult(errorMessage: string): OcrResult {
    return {
      success: false,
      rawText: '',
      lines: [],
      detectedLanguage: 'en',
      error: errorMessage,
    };
  }
}

// Factory function to create OcrService instance
export const createOcrService = (apiKey: string): OcrService => {
  return new OcrService(apiKey);
};
