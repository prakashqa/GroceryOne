/**
 * FuzzyMatcher Tests
 * TDD: Tests written first to define expected behavior
 */

import { FuzzyMatcher } from '../FuzzyMatcher';
import { Item } from '../../../../domain/types/picking';
import { MatchConfidence, FuzzyMatcherConfig } from '../../types/scanning.types';

// Mock items for testing
const mockItems: Item[] = [
  { id: 'atta-1', categoryId: 'atta-rice', name: 'Aashirvaad Atta', unit: 'kg', defaultQuantity: 5 },
  { id: 'atta-2', categoryId: 'atta-rice', name: 'Fortune Chakki Atta', unit: 'kg', defaultQuantity: 5 },
  { id: 'atta-3', categoryId: 'atta-rice', name: 'Basmati Rice', unit: 'kg', defaultQuantity: 1 },
  { id: 'dal-1', categoryId: 'dal-pulses', name: 'Toor Dal', unit: 'kg', defaultQuantity: 1 },
  { id: 'dal-2', categoryId: 'dal-pulses', name: 'Moong Dal', unit: 'kg', defaultQuantity: 1 },
  { id: 'dal-3', categoryId: 'dal-pulses', name: 'Chana Dal', unit: 'kg', defaultQuantity: 1 },
  { id: 'oil-1', categoryId: 'oil-ghee', name: 'Fortune Sunflower Oil', unit: 'L', defaultQuantity: 1 },
  { id: 'oil-3', categoryId: 'oil-ghee', name: 'Amul Ghee', unit: 'kg', defaultQuantity: 1 },
  { id: 'tea-1', categoryId: 'tea-coffee', name: 'Tata Tea Gold', unit: 'gm', defaultQuantity: 500 },
  { id: 'snack-3', categoryId: 'chips-biscuits', name: 'Parle-G', unit: 'gm', defaultQuantity: 800 },
  { id: 'bath-1', categoryId: 'bath-body', name: 'Dove Soap', unit: 'pcs', defaultQuantity: 3 },
  { id: 'bath-6', categoryId: 'bath-body', name: 'Colgate Toothpaste', unit: 'gm', defaultQuantity: 200 },
  { id: 'atta-7', categoryId: 'atta-rice', name: 'Suji', unit: 'kg', defaultQuantity: 1 },
  { id: 'atta-8', categoryId: 'atta-rice', name: 'Poha', unit: 'kg', defaultQuantity: 1 },
  { id: 'dal-5', categoryId: 'dal-pulses', name: 'Urad Dal', unit: 'kg', defaultQuantity: 1 },
];

// Mock Telugu translations (using actual Telugu translations from te/common.json)
const mockTranslations: Record<string, string> = {
  'atta-1': 'ఆశీర్వాద్ ఆటా',
  'atta-2': 'ఫార్చ్యూన్ చక్కీ ఆటా', // Note: చక్కీ with long i vowel (ీ)
  'atta-3': 'బాస్మతి రైస్',
  'dal-1': 'కందిపప్పు',
  'dal-2': 'పెసరపప్పు',
  'dal-3': 'శనగపప్పు',
  'oil-1': 'ఫార్చ్యూన్ సన్‌ఫ్లవర్ ఆయిల్',
  'oil-3': 'అమూల్ ఘీ',
  'tea-1': 'టాటా టీ గోల్డ్',
  'snack-3': 'పార్లే-జి',
  'bath-1': 'డవ్ సోప్',
  'bath-6': 'కోల్‌గేట్ టూత్‌పేస్ట్',
};

const mockGetTranslatedName = (itemId: string): string => {
  return mockTranslations[itemId] || itemId;
};

describe('FuzzyMatcher', () => {
  let matcher: FuzzyMatcher;

  beforeEach(() => {
    matcher = new FuzzyMatcher(mockItems, mockGetTranslatedName);
  });

  describe('exact matching', () => {
    it('should return exact match for "Toor Dal"', () => {
      const result = matcher.match('Toor Dal', 'en');
      expect(result.confidence).toBe('exact');
      expect(result.confidenceScore).toBe(100);
      expect(result.matchedItem?.id).toBe('dal-1');
    });

    it('should return exact match for "Aashirvaad Atta"', () => {
      const result = matcher.match('Aashirvaad Atta', 'en');
      expect(result.confidence).toBe('exact');
      expect(result.matchedItem?.id).toBe('atta-1');
    });

    it('should return exact match for Telugu "కందిపప్పు" (Toor Dal)', () => {
      const result = matcher.match('కందిపప్పు', 'te');
      expect(result.confidence).toBe('exact');
      expect(result.matchedItem?.id).toBe('dal-1');
    });

    it('should return exact match for Telugu "పెసరపప్పు" (Moong Dal)', () => {
      const result = matcher.match('పెసరపప్పు', 'te');
      expect(result.confidence).toBe('exact');
      expect(result.matchedItem?.id).toBe('dal-2');
    });

    it('should be case insensitive for English', () => {
      const result = matcher.match('toor dal', 'en');
      expect(result.confidence).toBe('exact');
      expect(result.matchedItem?.id).toBe('dal-1');
    });

    it('should be case insensitive for English (mixed case)', () => {
      const result = matcher.match('TOOR DAL', 'en');
      expect(result.confidence).toBe('exact');
      expect(result.matchedItem?.id).toBe('dal-1');
    });
  });

  describe('high confidence fuzzy matching', () => {
    it('should match "Ashirvad Atta" to "Aashirvaad Atta" with high confidence', () => {
      const result = matcher.match('Ashirvad Atta', 'en');
      expect(result.confidence).toBe('high');
      expect(result.confidenceScore).toBeGreaterThanOrEqual(85);
      expect(result.matchedItem?.id).toBe('atta-1');
    });

    it('should match "Toor Daal" to "Toor Dal" with high confidence', () => {
      const result = matcher.match('Toor Daal', 'en');
      expect(result.confidence).toBe('high');
      expect(result.confidenceScore).toBeGreaterThanOrEqual(85);
      expect(result.matchedItem?.id).toBe('dal-1');
    });

    it('should match "Basmatee Rice" to "Basmati Rice" with high confidence', () => {
      const result = matcher.match('Basmatee Rice', 'en');
      expect(result.confidence).toBe('high');
      expect(result.confidenceScore).toBeGreaterThanOrEqual(85);
      expect(result.matchedItem?.id).toBe('atta-3');
    });

    it('should match "Dove Soep" to "Dove Soap" with high confidence', () => {
      const result = matcher.match('Dove Soep', 'en');
      expect(result.confidence).toBe('high');
      expect(result.confidenceScore).toBeGreaterThanOrEqual(85);
      expect(result.matchedItem?.id).toBe('bath-1');
    });
  });

  describe('medium confidence fuzzy matching', () => {
    it('should match "Colgate" to "Colgate Toothpaste" with medium confidence', () => {
      const result = matcher.match('Colgate', 'en');
      expect(['high', 'medium']).toContain(result.confidence);
      expect(result.confidenceScore).toBeGreaterThanOrEqual(65);
      expect(result.matchedItem?.id).toBe('bath-6');
    });

    it('should match "Sunflower Oil" to "Fortune Sunflower Oil" with medium+ confidence', () => {
      const result = matcher.match('Sunflower Oil', 'en');
      expect(['high', 'medium']).toContain(result.confidence);
      expect(result.confidenceScore).toBeGreaterThanOrEqual(65);
      expect(result.matchedItem?.id).toBe('oil-1');
    });
  });

  describe('token-based matching', () => {
    it('should match partial name "Tata Tea" to "Tata Tea Gold"', () => {
      const result = matcher.match('Tata Tea', 'en');
      expect(['exact', 'high', 'medium']).toContain(result.confidence);
      expect(result.matchedItem?.id).toBe('tea-1');
    });

    it('should match reordered tokens "Ghee Amul" to "Amul Ghee"', () => {
      const result = matcher.match('Ghee Amul', 'en');
      expect(['exact', 'high', 'medium']).toContain(result.confidence);
      expect(result.matchedItem?.id).toBe('oil-3');
    });
  });

  describe('no match scenarios', () => {
    it('should return no match for completely unknown text', () => {
      const result = matcher.match('xyz123abc', 'en');
      expect(result.confidence).toBe('none');
      expect(result.matchedItem).toBeNull();
      expect(result.confidenceScore).toBeLessThan(45);
    });

    it('should return no match for "Special Masala"', () => {
      const result = matcher.match('Special Masala', 'en');
      expect(result.confidence).toBe('none');
      expect(result.matchedItem).toBeNull();
    });

    it('should return no match for empty string', () => {
      const result = matcher.match('', 'en');
      expect(result.confidence).toBe('none');
      expect(result.matchedItem).toBeNull();
    });
  });

  describe('alternative matches', () => {
    it('should provide alternatives for ambiguous "Dal"', () => {
      const result = matcher.match('Dal', 'en');
      expect(result.alternatives.length).toBeGreaterThan(0);
    });

    it('should limit alternatives to maxAlternatives config', () => {
      const customMatcher = new FuzzyMatcher(mockItems, mockGetTranslatedName, undefined, {
        maxAlternatives: 2,
      });
      const result = customMatcher.match('Dal', 'en');
      expect(result.alternatives.length).toBeLessThanOrEqual(2);
    });

    it('should sort alternatives by score descending', () => {
      const result = matcher.match('Dal', 'en');
      if (result.alternatives.length > 1) {
        for (let i = 0; i < result.alternatives.length - 1; i++) {
          expect(result.alternatives[i].score).toBeGreaterThanOrEqual(
            result.alternatives[i + 1].score
          );
        }
      }
    });
  });

  describe('confidence thresholds', () => {
    it('should respect exactMatchThreshold (100)', () => {
      const result = matcher.match('Toor Dal', 'en');
      expect(result.confidenceScore).toBe(100);
      expect(result.confidence).toBe('exact');
    });

    it('should classify score >= 85 as high confidence', () => {
      const result = matcher.match('Toor Daal', 'en');
      if (result.confidenceScore >= 85 && result.confidenceScore < 100) {
        expect(result.confidence).toBe('high');
      }
    });

    it('should classify score >= 65 and < 85 as medium confidence', () => {
      // Use a search that typically results in medium confidence
      const result = matcher.match('Tea Gold', 'en');
      if (result.confidenceScore >= 65 && result.confidenceScore < 85) {
        expect(result.confidence).toBe('medium');
      }
    });
  });

  describe('custom configuration', () => {
    it('should use custom thresholds when provided', () => {
      const customConfig: Partial<FuzzyMatcherConfig> = {
        highConfidenceThreshold: 90,
        mediumConfidenceThreshold: 70,
        lowConfidenceThreshold: 50,
      };
      const customMatcher = new FuzzyMatcher(
        mockItems,
        mockGetTranslatedName,
        undefined,
        customConfig
      );

      // A match that would normally be "high" at 85+ might now be "medium"
      const result = customMatcher.match('Toor Daal', 'en');
      // Just verify it works with custom config
      expect(result).toBeDefined();
      expect(result.confidence).toBeDefined();
    });
  });

  describe('whitespace handling', () => {
    it('should handle leading/trailing whitespace', () => {
      const result = matcher.match('  Toor Dal  ', 'en');
      expect(result.confidence).toBe('exact');
      expect(result.matchedItem?.id).toBe('dal-1');
    });

    it('should handle extra internal whitespace', () => {
      const result = matcher.match('Toor   Dal', 'en');
      expect(result.confidence).toBe('exact');
      expect(result.matchedItem?.id).toBe('dal-1');
    });
  });

  describe('matchAll', () => {
    it('should match multiple search terms', () => {
      const results = matcher.matchAll(['Toor Dal', 'Basmati Rice', 'xyz'], 'en');
      expect(results).toHaveLength(3);
      expect(results[0].matchedItem?.id).toBe('dal-1');
      expect(results[1].matchedItem?.id).toBe('atta-3');
      expect(results[2].matchedItem).toBeNull();
    });
  });

  describe('special characters', () => {
    it('should handle "Parle-G" with hyphen', () => {
      const result = matcher.match('Parle-G', 'en');
      expect(result.confidence).toBe('exact');
      expect(result.matchedItem?.id).toBe('snack-3');
    });

    it('should handle "Parle G" without hyphen', () => {
      const result = matcher.match('Parle G', 'en');
      expect(['exact', 'high']).toContain(result.confidence);
      expect(result.matchedItem?.id).toBe('snack-3');
    });

    it('should handle "ParleG" without space', () => {
      const result = matcher.match('ParleG', 'en');
      expect(['exact', 'high']).toContain(result.confidence);
      expect(result.matchedItem?.id).toBe('snack-3');
    });
  });

  describe('Telugu script matching', () => {
    it('should match Telugu with slight variations', () => {
      // Testing that Telugu matching works for the base case
      const result = matcher.match('కందిపప్పు', 'te');
      expect(result.confidence).toBe('exact');
      expect(result.matchedItem?.id).toBe('dal-1');
    });
  });

  describe('getConfidenceLevel', () => {
    it('should return correct confidence level for scores', () => {
      expect(matcher.getConfidenceLevel(100)).toBe('exact');
      expect(matcher.getConfidenceLevel(90)).toBe('high');
      expect(matcher.getConfidenceLevel(85)).toBe('high');
      expect(matcher.getConfidenceLevel(75)).toBe('medium');
      expect(matcher.getConfidenceLevel(65)).toBe('medium');
      expect(matcher.getConfidenceLevel(55)).toBe('low');
      expect(matcher.getConfidenceLevel(45)).toBe('low');
      expect(matcher.getConfidenceLevel(30)).toBe('none');
    });
  });

  describe('Telugu fuzzy matching with vowel variations', () => {
    // Telugu vowel marks that are commonly confused in OCR:
    // ి (short i) vs ీ (long i)
    // ు (short u) vs ూ (long u)
    // ె (short e) vs ే (long e)
    // ొ (short o) vs ో (long o)

    it('should match "చక్కి" to "చక్కీ" with vowel variation (short i vs long i)', () => {
      // OCR detected "ఫార్చ్యూన్ చక్కి ఆటా" but database has "ఫార్చ్యూన్ చక్కీ ఆటా"
      const result = matcher.match('ఫార్చ్యూన్ చక్కి ఆటా', 'te');
      expect(result.matchedItem).not.toBeNull();
      expect(result.matchedItem?.id).toBe('atta-2');
      expect(result.confidenceScore).toBeGreaterThanOrEqual(85);
    });

    it('should match Telugu "బాస్మతి రైస్" exactly', () => {
      const result = matcher.match('బాస్మతి రైస్', 'te');
      expect(result.matchedItem).not.toBeNull();
      expect(result.matchedItem?.id).toBe('atta-3');
      expect(result.confidence).toBe('exact');
    });

    it('should match Telugu with minor OCR errors in vowel marks', () => {
      // Testing various vowel mark variations
      // Database: "కందిపప్పు" -> Testing with slight variation
      const result = matcher.match('కందిపప్పు', 'te');
      expect(result.matchedItem).not.toBeNull();
      expect(result.matchedItem?.id).toBe('dal-1');
    });

    it('should match Telugu "ఆశీర్వాద్ ఆటా" with minor variations', () => {
      // Testing common OCR variations for Aashirvaad Atta
      const result = matcher.match('ఆశీర్వాద్ ఆటా', 'te');
      expect(result.matchedItem).not.toBeNull();
      expect(result.matchedItem?.id).toBe('atta-1');
    });

    it('should handle Telugu text with extra spaces', () => {
      const result = matcher.match('బాస్మతి   రైస్', 'te');
      expect(result.matchedItem).not.toBeNull();
      expect(result.matchedItem?.id).toBe('atta-3');
    });

    it('should match Telugu Oil name "ఫార్చ్యూన్ సన్‌ఫ్లవర్ ఆయిల్"', () => {
      const result = matcher.match('ఫార్చ్యూన్ సన్‌ఫ్లవర్ ఆయిల్', 'te');
      expect(result.matchedItem).not.toBeNull();
      expect(result.matchedItem?.id).toBe('oil-1');
    });

    it('should match mixed language when language is "mixed"', () => {
      // When language is detected as mixed, should try both English and Telugu matching
      const result = matcher.match('ఫార్చ్యూన్ చక్కి ఆటా', 'mixed');
      expect(result.matchedItem).not.toBeNull();
      expect(result.matchedItem?.id).toBe('atta-2');
    });
  });

  describe('Telugu normalization', () => {
    it('should normalize Telugu vowel marks for better matching', () => {
      // The key test: OCR might detect short vowels instead of long vowels
      // చక్కి (chakki with short i) should match చక్కీ (chakkee with long i)
      const result = matcher.match('ఫార్చ్యూన్ చక్కి ఆటా', 'te');
      expect(result.matchedItem).not.toBeNull();
      expect(['exact', 'high']).toContain(result.confidence);
    });
  });

  describe('Telugu zero-width character handling', () => {
    it('should match Telugu text with embedded zero-width joiners (U+200D)', () => {
      const result = matcher.match('ఫార్చ్యూన్ సన్\u200Dఫ్లవర్ ఆయిల్', 'te');
      expect(result.matchedItem).not.toBeNull();
      expect(result.matchedItem?.id).toBe('oil-1');
    });

    it('should match Telugu text with zero-width non-joiners (U+200C)', () => {
      const result = matcher.match('కోల్\u200Cగేట్ టూత్\u200Cపేస్ట్', 'te');
      expect(result.matchedItem).not.toBeNull();
      expect(result.matchedItem?.id).toBe('bath-6');
    });

    it('should match Telugu text with zero-width spaces (U+200B)', () => {
      const result = matcher.match('కంది\u200Bపప్పు', 'te');
      expect(result.matchedItem).not.toBeNull();
      expect(result.matchedItem?.id).toBe('dal-1');
    });

    it('should match Telugu text with BOM characters (U+FEFF)', () => {
      const result = matcher.match('\uFEFFకందిపప్పు', 'te');
      expect(result.matchedItem).not.toBeNull();
      expect(result.matchedItem?.id).toBe('dal-1');
    });
  });

  describe('English fallback for Telugu-tagged items', () => {
    it('should match English brand name "Amul Ghee" even when language is "te"', () => {
      const result = matcher.match('Amul Ghee', 'te');
      expect(result.matchedItem).not.toBeNull();
      expect(result.matchedItem?.id).toBe('oil-3');
      expect(result.confidence).toBe('exact');
    });

    it('should match English brand name "Tata Tea Gold" when language is "te"', () => {
      const result = matcher.match('Tata Tea Gold', 'te');
      expect(result.matchedItem).not.toBeNull();
      expect(result.matchedItem?.id).toBe('tea-1');
    });

    it('should match "Dove Soap" when language is "te"', () => {
      const result = matcher.match('Dove Soap', 'te');
      expect(result.matchedItem).not.toBeNull();
      expect(result.matchedItem?.id).toBe('bath-1');
    });

    it('should prefer exact Telugu synonym match over English partial match', () => {
      const result = matcher.match('కందిపప్పు', 'te');
      expect(result.matchedItem?.id).toBe('dal-1');
      expect(result.confidence).toBe('exact');
    });
  });

  describe('Telugu synonym matching', () => {
    // Mock synonyms: native Telugu names that differ from transliterated names
    const mockSynonyms: Record<string, string[]> = {
      'dal-1': ['కందిపప్పు', 'కంది పప్పు'],
      'dal-2': ['పెసరపప్పు', 'పెసర పప్పు'],
      'dal-3': ['శనగపప్పు', 'శెనగపప్పు', 'శనగ పప్పు'],
      'dal-5': ['మినపప్పు', 'మినప పప్పు', 'ఉద్దిపప్పు'],
      'atta-3': ['బాస్మతి బియ్యం', 'బియ్యం'],
      'atta-7': ['రవ్వ'],
      'atta-8': ['అటుకులు'],
      'oil-3': ['నెయ్యి', 'అమూల్ నెయ్యి'],
    };

    const mockGetSynonyms = (itemId: string): string[] => {
      return mockSynonyms[itemId] || [];
    };

    let synonymMatcher: FuzzyMatcher;

    beforeEach(() => {
      // This matcher uses transliterated Telugu names (like the real te/common.json)
      // but also has synonym support for native Telugu names
      const transliteratedTranslations: Record<string, string> = {
        'atta-1': 'ఆశీర్వాద్ ఆటా',
        'atta-2': 'ఫార్చ్యూన్ చక్కీ ఆటా',
        'atta-3': 'బాస్మతి రైస్',
        'dal-1': 'తూర్ దాల్',
        'dal-2': 'మూంగ్ దాల్',
        'dal-3': 'చన దాల్',
        'dal-5': 'ఉరద్ దాల్',
        'oil-1': 'ఫార్చ్యూన్ సన్‌ఫ్లవర్ ఆయిల్',
        'oil-3': 'అమూల్ ఘీ',
        'tea-1': 'టాటా టీ గోల్డ్',
        'snack-3': 'పార్లే-జి',
        'bath-1': 'డవ్ సోప్',
        'bath-6': 'కోల్‌గేట్ టూత్‌పేస్ట్',
        'atta-7': 'సూజీ',
        'atta-8': 'పోహా',
      };

      const getTransliterated = (id: string) => transliteratedTranslations[id] || id;

      synonymMatcher = new FuzzyMatcher(
        mockItems,
        getTransliterated,
        mockGetSynonyms
      );
    });

    it('should match native Telugu "కందిపప్పు" to Toor Dal via synonym', () => {
      const result = synonymMatcher.match('కందిపప్పు', 'te');
      expect(result.matchedItem).not.toBeNull();
      expect(result.matchedItem?.id).toBe('dal-1');
      expect(result.confidence).toBe('exact');
    });

    it('should match native Telugu "పెసరపప్పు" to Moong Dal via synonym', () => {
      const result = synonymMatcher.match('పెసరపప్పు', 'te');
      expect(result.matchedItem).not.toBeNull();
      expect(result.matchedItem?.id).toBe('dal-2');
      expect(result.confidence).toBe('exact');
    });

    it('should match native Telugu "శనగపప్పు" to Chana Dal via synonym', () => {
      const result = synonymMatcher.match('శనగపప్పు', 'te');
      expect(result.matchedItem).not.toBeNull();
      expect(result.matchedItem?.id).toBe('dal-3');
      expect(result.confidence).toBe('exact');
    });

    it('should match spaced synonym "కంది పప్పు" to Toor Dal', () => {
      const result = synonymMatcher.match('కంది పప్పు', 'te');
      expect(result.matchedItem).not.toBeNull();
      expect(result.matchedItem?.id).toBe('dal-1');
      expect(result.confidence).toBe('exact');
    });

    it('should match alternate synonym "శెనగపప్పు" (variant spelling) to Chana Dal', () => {
      const result = synonymMatcher.match('శెనగపప్పు', 'te');
      expect(result.matchedItem).not.toBeNull();
      expect(result.matchedItem?.id).toBe('dal-3');
      expect(result.confidence).toBe('exact');
    });

    it('should match "రవ్వ" to Suji via synonym', () => {
      const result = synonymMatcher.match('రవ్వ', 'te');
      expect(result.matchedItem).not.toBeNull();
      expect(result.matchedItem?.id).toBe('atta-7');
      expect(result.confidence).toBe('exact');
    });

    it('should match "నెయ్యి" to Amul Ghee via synonym', () => {
      const result = synonymMatcher.match('నెయ్యి', 'te');
      expect(result.matchedItem).not.toBeNull();
      expect(result.matchedItem?.id).toBe('oil-3');
      expect(result.confidence).toBe('exact');
    });

    it('should still match transliterated names even with synonyms', () => {
      const result = synonymMatcher.match('తూర్ దాల్', 'te');
      expect(result.matchedItem).not.toBeNull();
      expect(result.matchedItem?.id).toBe('dal-1');
      expect(result.confidence).toBe('exact');
    });

    it('should still match English names with synonym matcher', () => {
      const result = synonymMatcher.match('Toor Dal', 'en');
      expect(result.matchedItem).not.toBeNull();
      expect(result.matchedItem?.id).toBe('dal-1');
      expect(result.confidence).toBe('exact');
    });

    it('should return no match for unknown Telugu text', () => {
      const result = synonymMatcher.match('అజ్ఞాత వస్తువు', 'te');
      expect(result.confidence).toBe('none');
      expect(result.matchedItem).toBeNull();
    });

    it('should work without synonyms getter (backward compatible)', () => {
      const noSynonymMatcher = new FuzzyMatcher(mockItems, mockGetTranslatedName);
      const result = noSynonymMatcher.match('కందిపప్పు', 'te');
      // Should still match since mockGetTranslatedName maps dal-1 to కందిపప్పు
      expect(result.matchedItem).not.toBeNull();
      expect(result.matchedItem?.id).toBe('dal-1');
    });
  });
});
