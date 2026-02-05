/**
 * FuzzyMatcher Service
 * Matches scanned text to items in the catalog using fuzzy matching
 */

import { Item } from '../../../domain/types/picking';
import {
  MatchResult,
  MatchConfidence,
  AlternativeMatch,
  DetectedLanguage,
  FuzzyMatcherConfig,
  IndexedItem,
  ParsedLineItem,
} from '../types/scanning.types';

const DEFAULT_CONFIG: FuzzyMatcherConfig = {
  exactMatchThreshold: 100,
  highConfidenceThreshold: 85,
  mediumConfidenceThreshold: 65,
  lowConfidenceThreshold: 45,
  maxAlternatives: 3,
};

/**
 * Telugu vowel mark normalization map
 * Maps long vowel marks to short vowel marks for more forgiving matching
 * This helps with OCR errors where long/short vowels are confused
 */
const TELUGU_VOWEL_NORMALIZATION: Record<string, string> = {
  // Long to short vowel marks
  'ా': 'ా', // aa (keep as is - no short form)
  'ీ': 'ి', // long i -> short i
  'ూ': 'ు', // long u -> short u
  'ే': 'ె', // long e -> short e
  'ో': 'ొ', // long o -> short o
  'ై': 'ై', // ai (keep as is)
  'ౌ': 'ౌ', // au (keep as is)
};

export class FuzzyMatcher {
  private indexedItems: IndexedItem[];
  private config: FuzzyMatcherConfig;

  constructor(
    items: Item[],
    getTranslatedName: (itemId: string) => string,
    config?: Partial<FuzzyMatcherConfig>
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.indexedItems = this.buildIndex(items, getTranslatedName);
  }

  /**
   * Build searchable index from items
   */
  private buildIndex(
    items: Item[],
    getTranslatedName: (itemId: string) => string
  ): IndexedItem[] {
    return items.map((item) => {
      const teluguName = getTranslatedName(item.id);
      return {
        item,
        englishName: item.name,
        teluguName: teluguName !== item.id ? teluguName : '',
        normalizedEnglish: this.normalize(item.name),
        normalizedTelugu: teluguName !== item.id ? this.normalizeTelugu(teluguName) : '',
        tokens: this.tokenize(item.name),
      };
    });
  }

  /**
   * Normalize text for comparison
   */
  private normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Normalize Telugu text for better matching
   * Converts long vowel marks to short vowel marks to handle OCR variations
   */
  private normalizeTelugu(text: string): string {
    let normalized = text;
    for (const [long, short] of Object.entries(TELUGU_VOWEL_NORMALIZATION)) {
      normalized = normalized.split(long).join(short);
    }
    return normalized
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Tokenize text into words
   */
  private tokenize(text: string): string[] {
    return this.normalize(text)
      .split(' ')
      .filter((t) => t.length > 0);
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    // Initialize matrix
    for (let i = 0; i <= a.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= b.length; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[a.length][b.length];
  }

  /**
   * Calculate similarity score (0-100) based on Levenshtein distance
   */
  private calculateSimilarity(searchText: string, targetText: string): number {
    if (!searchText || !targetText) return 0;

    const normalizedSearch = this.normalize(searchText);
    const normalizedTarget = this.normalize(targetText);

    // Exact match
    if (normalizedSearch === normalizedTarget) {
      return 100;
    }

    // Check if one contains the other
    if (normalizedTarget.includes(normalizedSearch)) {
      const ratio = normalizedSearch.length / normalizedTarget.length;
      return Math.round(70 + ratio * 30);
    }

    if (normalizedSearch.includes(normalizedTarget)) {
      const ratio = normalizedTarget.length / normalizedSearch.length;
      return Math.round(70 + ratio * 30);
    }

    // Levenshtein-based similarity
    const distance = this.levenshteinDistance(normalizedSearch, normalizedTarget);
    const maxLength = Math.max(normalizedSearch.length, normalizedTarget.length);
    const similarity = Math.round((1 - distance / maxLength) * 100);

    return Math.max(0, similarity);
  }

  /**
   * Calculate similarity score for Telugu text (already normalized)
   */
  private calculateTeluguSimilarity(
    normalizedSearch: string,
    normalizedTarget: string
  ): number {
    if (!normalizedSearch || !normalizedTarget) return 0;

    // Exact match after normalization
    if (normalizedSearch === normalizedTarget) {
      return 100;
    }

    // Check if one contains the other
    if (normalizedTarget.includes(normalizedSearch)) {
      const ratio = normalizedSearch.length / normalizedTarget.length;
      return Math.round(70 + ratio * 30);
    }

    if (normalizedSearch.includes(normalizedTarget)) {
      const ratio = normalizedTarget.length / normalizedSearch.length;
      return Math.round(70 + ratio * 30);
    }

    // Levenshtein-based similarity
    const distance = this.levenshteinDistance(normalizedSearch, normalizedTarget);
    const maxLength = Math.max(normalizedSearch.length, normalizedTarget.length);
    const similarity = Math.round((1 - distance / maxLength) * 100);

    return Math.max(0, similarity);
  }

  /**
   * Calculate token overlap score
   */
  private calculateTokenScore(
    searchTokens: string[],
    targetTokens: string[]
  ): number {
    if (searchTokens.length === 0 || targetTokens.length === 0) return 0;

    let matchedTokens = 0;
    let partialScore = 0;

    for (const searchToken of searchTokens) {
      // Exact token match
      if (targetTokens.includes(searchToken)) {
        matchedTokens++;
      } else {
        // Fuzzy token match
        let bestTokenSimilarity = 0;
        for (const targetToken of targetTokens) {
          const similarity = this.calculateSimilarity(searchToken, targetToken);
          bestTokenSimilarity = Math.max(bestTokenSimilarity, similarity);
        }
        if (bestTokenSimilarity >= 80) {
          partialScore += bestTokenSimilarity / 100;
        }
      }
    }

    const totalMatchScore = matchedTokens + partialScore;
    const maxPossible = Math.max(searchTokens.length, targetTokens.length);

    return Math.round((totalMatchScore / maxPossible) * 100);
  }

  /**
   * Match a search term against all indexed items
   */
  match(searchText: string, language: DetectedLanguage): MatchResult {
    const trimmedSearch = searchText.trim();

    if (!trimmedSearch) {
      return this.createNoMatchResult(trimmedSearch);
    }

    const normalizedSearch = this.normalize(trimmedSearch);
    const searchTokens = this.tokenize(trimmedSearch);
    const scoredMatches: Array<{ indexed: IndexedItem; score: number }> = [];

    for (const indexed of this.indexedItems) {
      let bestScore = 0;

      // English matching
      if (language === 'en' || language === 'mixed') {
        // Exact match check
        if (normalizedSearch === indexed.normalizedEnglish) {
          bestScore = 100;
        } else {
          // String similarity
          const stringSimilarity = this.calculateSimilarity(
            trimmedSearch,
            indexed.englishName
          );

          // Token-based similarity
          const tokenSimilarity = this.calculateTokenScore(
            searchTokens,
            indexed.tokens
          );

          bestScore = Math.max(stringSimilarity, tokenSimilarity);
        }
      }

      // Telugu matching
      if ((language === 'te' || language === 'mixed') && indexed.teluguName) {
        // Normalize Telugu search text for comparison
        const normalizedTeluguSearch = this.normalizeTelugu(trimmedSearch);

        // Exact Telugu match (with normalization)
        if (normalizedTeluguSearch === indexed.normalizedTelugu) {
          bestScore = Math.max(bestScore, 100);
        } else {
          // Calculate similarity using normalized Telugu text
          const teluguSimilarity = this.calculateTeluguSimilarity(
            normalizedTeluguSearch,
            indexed.normalizedTelugu
          );
          bestScore = Math.max(bestScore, teluguSimilarity);
        }
      }

      if (bestScore > 0) {
        scoredMatches.push({ indexed, score: bestScore });
      }
    }

    // Sort by score descending
    scoredMatches.sort((a, b) => b.score - a.score);

    if (scoredMatches.length === 0 || scoredMatches[0].score < this.config.lowConfidenceThreshold) {
      return this.createNoMatchResult(trimmedSearch);
    }

    const bestMatch = scoredMatches[0];
    const confidence = this.getConfidenceLevel(bestMatch.score);

    // Get alternatives (excluding the best match)
    const alternatives: AlternativeMatch[] = scoredMatches
      .slice(1, this.config.maxAlternatives + 1)
      .filter((m) => m.score >= this.config.lowConfidenceThreshold)
      .map((m) => ({
        item: m.indexed.item,
        score: m.score,
      }));

    return {
      parsedItem: this.createParsedItem(trimmedSearch, language),
      matchedItem: bestMatch.indexed.item,
      confidence,
      confidenceScore: bestMatch.score,
      alternatives,
    };
  }

  /**
   * Match multiple search terms
   */
  matchAll(
    searchTerms: string[],
    language: DetectedLanguage
  ): MatchResult[] {
    return searchTerms.map((term) => this.match(term, language));
  }

  /**
   * Get confidence level from score
   */
  getConfidenceLevel(score: number): MatchConfidence {
    if (score >= this.config.exactMatchThreshold) {
      return 'exact';
    } else if (score >= this.config.highConfidenceThreshold) {
      return 'high';
    } else if (score >= this.config.mediumConfidenceThreshold) {
      return 'medium';
    } else if (score >= this.config.lowConfidenceThreshold) {
      return 'low';
    }
    return 'none';
  }

  /**
   * Create a no-match result
   */
  private createNoMatchResult(searchText: string): MatchResult {
    return {
      parsedItem: this.createParsedItem(searchText, 'en'),
      matchedItem: null,
      confidence: 'none',
      confidenceScore: 0,
      alternatives: [],
    };
  }

  /**
   * Create a parsed item placeholder for match results
   */
  private createParsedItem(
    text: string,
    language: DetectedLanguage
  ): ParsedLineItem {
    return {
      rawText: text,
      itemName: text,
      quantity: null,
      unit: null,
      language,
      lineIndex: 0,
    };
  }
}
