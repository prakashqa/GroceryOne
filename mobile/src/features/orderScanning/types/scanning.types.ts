/**
 * Paper Order Scanning Types
 * Types for the OCR-based order scanning feature
 */

import { Item } from '../../../domain/types/picking';

/**
 * Detected language from OCR analysis
 */
export type DetectedLanguage = 'en' | 'te' | 'mixed';

/**
 * Confidence level for item matching
 */
export type MatchConfidence = 'exact' | 'high' | 'medium' | 'low' | 'none';

/**
 * Valid unit types (matches Item.unit from picking.ts)
 */
export type ItemUnit = 'kg' | 'gm' | 'pcs' | 'L' | 'ml';

/**
 * Processing steps for the scanning pipeline
 */
export type ProcessingStep = 'ocr' | 'parsing' | 'matching';

/**
 * Session status for tracking scan progress
 */
export type ScanSessionStatus =
  | 'capturing'
  | 'processing'
  | 'reviewing'
  | 'completed'
  | 'error';

/**
 * Raw text block extracted from OCR
 */
export interface OcrTextBlock {
  text: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Result from OCR processing
 */
export interface OcrResult {
  success: boolean;
  rawText: string;
  lines: string[];
  detectedLanguage: DetectedLanguage;
  textBlocks?: OcrTextBlock[];
  error?: string;
}

/**
 * Parsed line item extracted from OCR text
 */
export interface ParsedLineItem {
  rawText: string;
  itemName: string;
  quantity: number | null;
  unit: ItemUnit | null;
  language: DetectedLanguage;
  lineIndex: number;
}

/**
 * Alternative match suggestion
 */
export interface AlternativeMatch {
  item: Item;
  score: number;
}

/**
 * User override for a match result
 */
export interface MatchOverride {
  selectedItemId: string;
  selectedQuantity: number;
}

/**
 * Result from fuzzy matching an item
 */
export interface MatchResult {
  parsedItem: ParsedLineItem;
  matchedItem: Item | null;
  confidence: MatchConfidence;
  confidenceScore: number; // 0-100
  alternatives: AlternativeMatch[];
  userOverride?: MatchOverride;
  isSkipped?: boolean;
}

/**
 * Complete scan session state
 */
export interface ScanSession {
  id: string;
  imageUri: string;
  ocrResult: OcrResult | null;
  matchResults: MatchResult[];
  selectedCartId: string | null;
  status: ScanSessionStatus;
  createdAt: string;
  error?: string;
}

/**
 * Redux state for scanning feature
 */
export interface ScanState {
  currentSession: ScanSession | null;
  isProcessing: boolean;
  processingStep: ProcessingStep | null;
  error: string | null;
}

/**
 * Configuration for the fuzzy matcher
 */
export interface FuzzyMatcherConfig {
  exactMatchThreshold: number; // Score for exact match (default: 100)
  highConfidenceThreshold: number; // Min score for 'high' (default: 85)
  mediumConfidenceThreshold: number; // Min score for 'medium' (default: 65)
  lowConfidenceThreshold: number; // Min score for 'low' (default: 45)
  maxAlternatives: number; // Max alternative matches to return (default: 3)
}

/**
 * Item with translations for matching
 */
export interface IndexedItem {
  item: Item;
  englishName: string;
  teluguName: string;
  normalizedEnglish: string;
  normalizedTelugu: string;
  tokens: string[];
  teluguSynonyms: string[];
  normalizedTeluguSynonyms: string[];
}

/**
 * Input for adding scanned items to cart
 */
export interface ScannedCartItem {
  item: Item;
  quantity: number;
}
