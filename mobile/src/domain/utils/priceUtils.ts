/**
 * Price Utilities
 * Helper functions for price lookup from items array
 */

import type { Item } from '../types/picking';

/**
 * Fallback price data for items when API/catalog doesn't have prices
 * This ensures the app can function offline or when backend price data is missing
 */
interface FallbackItem {
  id: string;
  name: string;
  price: number;
}

const FALLBACK_ITEMS: FallbackItem[] = [
  // Grains & Flour
  { id: 'gf-001', name: 'Wheat Flour / Atta', price: 48 },
  { id: 'gf-002', name: 'Maida (All Purpose Flour)', price: 42 },
  { id: 'gf-003', name: 'Upma Rava / Sooji', price: 55 },
  { id: 'gf-004', name: 'Bombay Rava', price: 52 },
  { id: 'gf-005', name: 'Rice Flour', price: 60 },
  { id: 'gf-006', name: 'Ragi Flour (Finger Millet)', price: 85 },
  { id: 'gf-007', name: 'Jowar Flour (Sorghum)', price: 75 },
  { id: 'gf-008', name: 'Bajra Flour (Pearl Millet)', price: 70 },
  { id: 'gf-009', name: 'Besan (Chickpea Flour)', price: 110 },
  { id: 'gf-010', name: 'Poha (Flattened Rice)', price: 65 },
  { id: 'gf-011', name: 'Oats', price: 120 },

  // Rice
  { id: 'rc-001', name: 'Basmati Rice', price: 140 },
  { id: 'rc-002', name: 'Jeera Samba Rice', price: 125 },
  { id: 'rc-003', name: 'Sona Masuri (New)', price: 65 },
  { id: 'rc-004', name: 'Sona Masuri (Old)', price: 72 },
  { id: 'rc-005', name: 'Ponni Rice', price: 58 },
  { id: 'rc-006', name: 'Kolam Rice', price: 62 },
  { id: 'rc-007', name: 'Boiled Rice', price: 60 },
  { id: 'rc-008', name: 'Idli Rice', price: 55 },
  { id: 'rc-009', name: 'Dosa Rice', price: 56 },
  { id: 'rc-010', name: 'Broken Rice / Idli Rava', price: 48 },
  { id: 'rc-011', name: 'Brown Rice', price: 95 },

  // Dals & Pulses
  { id: 'dl-001', name: 'Toor Dal / Arhar Dal', price: 160 },
  { id: 'dl-002', name: 'Moong Dal (Split)', price: 140 },
  { id: 'dl-003', name: 'Masoor Dal (Red Lentils)', price: 115 },
  { id: 'dl-004', name: 'Urad Dal (Split)', price: 150 },
  { id: 'dl-005', name: 'Chana Dal (Bengal Gram)', price: 95 },
  { id: 'dl-006', name: 'Moong Dal (Whole)', price: 130 },
  { id: 'dl-007', name: 'Urad Dal (Whole)', price: 145 },
  { id: 'dl-008', name: 'Chickpeas / Kabuli Chana', price: 100 },
  { id: 'dl-009', name: 'Rajma (Kidney Beans)', price: 125 },
  { id: 'dl-010', name: 'Cow Peas / Black-eyed Beans', price: 90 },
  { id: 'dl-011', name: 'Horse Gram', price: 85 },
  { id: 'dl-012', name: 'Black Gram (Whole)', price: 135 },

  // Oils & Ghee
  { id: 'ol-001', name: 'Sunflower Oil', price: 145 },
  { id: 'ol-002', name: 'Groundnut Oil', price: 195 },
  { id: 'ol-003', name: 'Mustard Oil', price: 180 },
  { id: 'ol-004', name: 'Sesame Oil', price: 220 },
  { id: 'ol-005', name: 'Coconut Oil', price: 210 },
  { id: 'ol-006', name: 'Olive Oil', price: 450 },
  { id: 'ol-007', name: 'Rice Bran Oil', price: 165 },
  { id: 'ol-008', name: 'Cow Ghee', price: 550 },
  { id: 'ol-009', name: 'Buffalo Ghee', price: 480 },

  // Spices & Masalas (prices per KG - gm items)
  { id: 'sp-001', name: 'Cumin Seeds', price: 340 },        // 250gm @ 85 → 340/kg
  { id: 'sp-002', name: 'Coriander Seeds', price: 240 },    // 250gm @ 60 → 240/kg
  { id: 'sp-003', name: 'Mustard Seeds', price: 280 },      // 250gm @ 70 → 280/kg
  { id: 'sp-004', name: 'Fenugreek Seeds', price: 260 },    // 250gm @ 65 → 260/kg
  { id: 'sp-005', name: 'Black Pepper', price: 1800 },      // 100gm @ 180 → 1800/kg
  { id: 'sp-006', name: 'Cloves', price: 6400 },            // 50gm @ 320 → 6400/kg
  { id: 'sp-007', name: 'Cinnamon Sticks', price: 5600 },   // 50gm @ 280 → 5600/kg
  { id: 'sp-008', name: 'Cardamom', price: 9000 },          // 50gm @ 450 → 9000/kg
  { id: 'sp-009', name: 'Bay Leaves', price: 4800 },        // 25gm @ 120 → 4800/kg
  { id: 'sp-010', name: 'Star Anise', price: 9600 },        // 25gm @ 240 → 9600/kg
  { id: 'sp-011', name: 'Dry Red Chillies', price: 560 },   // 250gm @ 140 → 560/kg
  { id: 'sp-012', name: 'Dry Green Chillies', price: 1600 }, // 100gm @ 160 → 1600/kg
  { id: 'sp-013', name: 'Tamarind', price: 170 },           // 500gm @ 85 → 170/kg
  { id: 'sp-014', name: 'Dry Curry Leaves', price: 2000 },  // 50gm @ 100 → 2000/kg
  { id: 'sp-015', name: 'Dry Mango Powder (Amchur)', price: 950 }, // 100gm @ 95 → 950/kg
  { id: 'sp-016', name: 'Turmeric Powder', price: 150 },    // 500gm @ 75 → 150/kg
  { id: 'sp-017', name: 'Red Chilli Powder', price: 240 },  // 500gm @ 120 → 240/kg
  { id: 'sp-018', name: 'Coriander Powder', price: 220 },   // 250gm @ 55 → 220/kg
  { id: 'sp-019', name: 'Cumin Powder', price: 900 },       // 100gm @ 90 → 900/kg
  { id: 'sp-020', name: 'Garam Masala', price: 1100 },      // 100gm @ 110 → 1100/kg
  { id: 'sp-021', name: 'Sambar Powder', price: 280 },      // 250gm @ 70 → 280/kg
  { id: 'sp-022', name: 'Rasam Powder', price: 260 },       // 250gm @ 65 → 260/kg
  { id: 'sp-023', name: 'Biryani Masala', price: 1150 },    // 100gm @ 115 → 1150/kg
  { id: 'sp-024', name: 'Chaat Masala', price: 1050 },      // 100gm @ 105 → 1050/kg
  { id: 'sp-025', name: 'Asafoetida (Hing)', price: 4000 }, // 50gm @ 200 → 4000/kg

  // Vegetables (kg items stay same, gm items converted to per-KG)
  { id: 'vg-001', name: 'Potato', price: 35 },            // kg item - no change
  { id: 'vg-002', name: 'Onion', price: 40 },             // kg item - no change
  { id: 'vg-003', name: 'Tomato', price: 45 },            // kg item - no change
  { id: 'vg-004', name: 'Green Chilli', price: 320 },     // 250gm @ 80 → 320/kg
  { id: 'vg-005', name: 'Ginger', price: 400 },           // 250gm @ 100 → 400/kg
  { id: 'vg-006', name: 'Garlic', price: 480 },           // 250gm @ 120 → 480/kg
  { id: 'vg-007', name: 'Coriander Leaves', price: 250 }, // 100gm @ 25 → 250/kg
  { id: 'vg-008', name: 'Curry Leaves', price: 300 },     // 50gm @ 15 → 300/kg
  { id: 'vg-009', name: 'Lemon', price: 8 },              // pcs item - no change

  // Beverages (gm items converted to per-KG, pcs items stay same)
  { id: 'bv-001', name: 'Loose Tea Leaves', price: 440 },  // 500gm @ 220 → 440/kg
  { id: 'bv-002', name: 'Tea Bags', price: 180 },          // pcs item - no change
  { id: 'bv-003', name: 'Green Tea', price: 160 },         // pcs item - no change
  { id: 'bv-004', name: 'Coffee Powder (Filter)', price: 900 }, // 500gm @ 450 → 900/kg
  { id: 'bv-005', name: 'Instant Coffee', price: 1400 },   // 200gm @ 280 → 1400/kg
  { id: 'bv-006', name: 'Horlicks', price: 640 },          // 500gm @ 320 → 640/kg
  { id: 'bv-007', name: 'Bournvita', price: 620 },         // 500gm @ 310 → 620/kg
  { id: 'bv-008', name: 'Complan', price: 760 },           // 500gm @ 380 → 760/kg

  // Daily Essentials (kg items stay same, gm items converted to per-KG)
  { id: 'es-001', name: 'Sugar (White)', price: 42 },     // kg item - no change
  { id: 'es-002', name: 'Jaggery', price: 65 },           // kg item - no change
  { id: 'es-003', name: 'Jaggery Powder', price: 70 },    // kg item - no change
  { id: 'es-004', name: 'Iodized Salt', price: 20 },      // kg item - no change
  { id: 'es-005', name: 'Rock Salt', price: 60 },         // 500gm @ 30 → 60/kg
  { id: 'es-006', name: 'Black Salt', price: 100 },       // 250gm @ 25 → 100/kg
  { id: 'es-007', name: 'Cooking Soda', price: 175 },     // 200gm @ 35 → 175/kg
  { id: 'es-008', name: 'Baking Powder', price: 275 },    // 200gm @ 55 → 275/kg
  { id: 'es-009', name: 'Dry Coconut', price: 480 },      // 250gm @ 120 → 480/kg
  { id: 'es-010', name: 'Poppy Seeds', price: 1400 },     // 100gm @ 140 → 1400/kg
  { id: 'es-011', name: 'Cashews', price: 1680 },         // 250gm @ 420 → 1680/kg
  { id: 'es-012', name: 'Almonds', price: 1920 },         // 250gm @ 480 → 1920/kg
  { id: 'es-013', name: 'Raisins', price: 720 },          // 250gm @ 180 → 720/kg

  // Personal Care (gm→per-KG, ml→per-L, pcs stay same)
  { id: 'pc-001', name: 'Toothpaste', price: 425 },       // 200gm @ 85 → 425/kg
  { id: 'pc-002', name: 'Toothbrush', price: 35 },        // pcs item - no change
  { id: 'pc-003', name: 'Mouthwash', price: 560 },        // 250ml @ 140 → 560/L
  { id: 'pc-004', name: 'Shampoo', price: 647 },          // 340ml @ 220 → 647/L
  { id: 'pc-005', name: 'Conditioner', price: 900 },      // 200ml @ 180 → 900/L
  { id: 'pc-006', name: 'Hair Oil', price: 600 },         // 200ml @ 120 → 600/L
  { id: 'pc-007', name: 'Bathing Soap', price: 30 },      // pcs item - no change
  { id: 'pc-008', name: 'Body Wash', price: 700 },        // 250ml @ 175 → 700/L
  { id: 'pc-009', name: 'Body Lotion', price: 625 },      // 400ml @ 250 → 625/L
  { id: 'pc-010', name: 'Face Cream', price: 3200 },      // 50gm @ 160 → 3200/kg
  { id: 'pc-011', name: 'Face Wash', price: 1350 },       // 100ml @ 135 → 1350/L
  { id: 'pc-012', name: 'Sunscreen', price: 2800 },       // 100ml @ 280 → 2800/L
  { id: 'pc-013', name: 'Talcum Powder', price: 363 },    // 400gm @ 145 → 362.5/kg
  { id: 'pc-014', name: 'Deodorant', price: 1267 },       // 150ml @ 190 → 1266.67/L
  { id: 'pc-015', name: 'Hand Sanitizer', price: 475 },   // 200ml @ 95 → 475/L
];

/**
 * Get price for an item from a provided items array
 * Tries ID match first, then falls back to name match
 *
 * @param itemId - Item ID to lookup
 * @param itemName - Item name for fallback match
 * @param items - Array of items to search in (from API or Redux store)
 * @returns Price if found, undefined otherwise
 *
 * @example
 * const { items } = useCatalog();
 * const price = getItemPrice('sp-001', 'Cumin Seeds', items);
 */
export const getItemPrice = (
  itemId: string,
  itemName: string,
  items: Item[]
): number | undefined => {
  // Try exact ID match first
  let item = items.find((i) => i.id === itemId);

  // If no ID match or no price, try name match (case-insensitive)
  if (!item || item.price === undefined) {
    item = items.find(
      (i) =>
        i.name.toLowerCase() === itemName.toLowerCase() &&
        i.price !== undefined
    );
  }

  return item?.price;
};

/**
 * Get price for an item by ID only
 *
 * @param itemId - Item ID to lookup
 * @param items - Array of items to search in
 * @returns Price if found, undefined otherwise
 */
export const getItemPriceById = (
  itemId: string,
  items: Item[]
): number | undefined => {
  const item = items.find((i) => i.id === itemId);
  return item?.price;
};

/**
 * Get price for an item by name (case-insensitive)
 *
 * @param itemName - Item name to lookup
 * @param items - Array of items to search in
 * @returns Price if found, undefined otherwise
 */
export const getItemPriceByName = (
  itemName: string,
  items: Item[]
): number | undefined => {
  const item = items.find(
    (i) =>
      i.name.toLowerCase() === itemName.toLowerCase() &&
      i.price !== undefined
  );
  return item?.price;
};

/**
 * Get unit multiplier for price calculation
 * For 'gm' and 'ml' units, prices are stored per-KG/per-L, so multiply by 0.001
 * For 'kg', 'L', 'pcs' units, no conversion needed (multiplier = 1)
 */
const getUnitMultiplier = (unit: string): number => {
  if (unit === 'gm' || unit === 'ml') return 0.001;
  return 1;
};

/**
 * Calculate total price for a cart item
 * Applies unit multiplier for gm/ml items (prices stored per-KG/per-L)
 *
 * @param price - Unit price (per kg for gm items, per L for ml items)
 * @param quantity - Quantity (in grams for gm items, in ml for ml items)
 * @param unit - Unit type ('kg', 'gm', 'L', 'ml', 'pcs')
 * @returns Total price
 */
export const calculateItemTotal = (
  price: number | undefined,
  quantity: number,
  unit: string = 'kg'
): number => {
  if (price === undefined) return 0;
  const multiplier = getUnitMultiplier(unit);
  return price * quantity * multiplier;
};

/**
 * Get price for an item from the hardcoded fallback items list
 * Used when the catalog/API doesn't have price data
 * Tries ID match first, then falls back to name match (case-insensitive)
 *
 * @param itemId - Item ID to lookup
 * @param itemName - Item name for fallback match
 * @returns Price if found, undefined otherwise
 *
 * @example
 * const price = getHardcodedItemPrice('gf-001', 'Wheat Flour / Atta');
 * // returns 48
 */
export const getHardcodedItemPrice = (
  itemId: string,
  itemName: string
): number | undefined => {
  // Try exact ID match first
  let item = FALLBACK_ITEMS.find((i) => i.id === itemId);

  // If no ID match, try name match (case-insensitive)
  if (!item) {
    item = FALLBACK_ITEMS.find(
      (i) => i.name.toLowerCase() === itemName.toLowerCase()
    );
  }

  return item?.price;
};
