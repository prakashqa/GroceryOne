/**
 * Tenant-Isolated Seed Data
 * Each tenant has its own distinct categories and items with zero overlap.
 *
 * FreshMart (premium): Raw ingredients, bulk grocery — grains, rice, dals, oils, spices, vegetables, beverages, essentials, personal care
 * QuickBasket (standard): Convenience store — dairy, fruits, snacks, bakery, frozen foods, cleaning, baby care, ready-to-cook
 * VijayParcelPOS (standard): Food parcel POS — chicken, curry, fry, rice, biryani, other, seafood + kitchen inventory (rice/grains, spices, oils, cooking ingredients, ready mix)
 */

export interface CategorySeed {
  slug: string;
  name: string;
  nameTe?: string;
  icon: string;
  sortOrder: number;
}

export interface ItemSeed {
  slug: string;
  categorySlug: string;
  name: string;
  nameTe?: string;
  unit: 'kg' | 'gm' | 'pcs' | 'L' | 'ml';
  defaultQuantity: number;
  price?: number; // Sale price per unit in INR
  compareAtPrice: number; // MRP (Maximum Retail Price) per unit in INR
  sortOrder: number;
}

// =============================================================================
// FreshMart Groceries — Premium, full-service Indian grocery store
// 9 categories, ~113 items focused on raw ingredients and bulk buying
// =============================================================================

export const FRESHMART_CATEGORIES: CategorySeed[] = [
  { slug: 'grains-flour', name: 'Grains & Flour', nameTe: 'ధాన్యాలు & పిండులు', icon: '🌾', sortOrder: 1 },
  { slug: 'rice', name: 'Rice', nameTe: 'బియ్యం', icon: '🍚', sortOrder: 2 },
  { slug: 'dals-pulses', name: 'Dals & Pulses', nameTe: 'పప్పులు', icon: '🫘', sortOrder: 3 },
  { slug: 'oils-ghee', name: 'Oils & Ghee', nameTe: 'నూనెలు & నెయ్యి', icon: '🫒', sortOrder: 4 },
  { slug: 'spices', name: 'Spices & Masalas', nameTe: 'మసాలాలు', icon: '🌶️', sortOrder: 5 },
  { slug: 'vegetables', name: 'Vegetables', nameTe: 'కూరగాయలు', icon: '🥬', sortOrder: 6 },
  { slug: 'beverages', name: 'Tea, Coffee & Beverages', nameTe: 'టీ, కాఫీ & పానీయాలు', icon: '☕', sortOrder: 7 },
  { slug: 'daily-essentials', name: 'Daily Essentials', nameTe: 'రోజువారీ అవసరాలు', icon: '🏪', sortOrder: 8 },
  { slug: 'personal-care', name: 'Personal Care', nameTe: 'వ్యక్తిగత సంరక్షణ', icon: '🧴', sortOrder: 9 },
];

export const FRESHMART_ITEMS: ItemSeed[] = [
  // ========== Grains & Flour ==========
  // Wheat Products
  { slug: 'gf-001', categorySlug: 'grains-flour', name: 'Wheat Flour / Atta', nameTe: 'గోధుమ పిండి', unit: 'kg', defaultQuantity: 5, price: 48, compareAtPrice: 48, sortOrder: 1 },
  { slug: 'gf-002', categorySlug: 'grains-flour', name: 'Maida (All Purpose Flour)', nameTe: 'మైదా', unit: 'kg', defaultQuantity: 1, price: 42, compareAtPrice: 42, sortOrder: 2 },
  { slug: 'gf-003', categorySlug: 'grains-flour', name: 'Upma Rava / Sooji', nameTe: 'ఉప్మా రవ్వ', unit: 'kg', defaultQuantity: 1, price: 55, compareAtPrice: 55, sortOrder: 3 },
  { slug: 'gf-004', categorySlug: 'grains-flour', name: 'Bombay Rava', nameTe: 'బొంబాయి రవ్వ', unit: 'kg', defaultQuantity: 1, price: 52, compareAtPrice: 52, sortOrder: 4 },

  // Alternative Flours
  { slug: 'gf-005', categorySlug: 'grains-flour', name: 'Rice Flour', nameTe: 'బియ్యం పిండి', unit: 'kg', defaultQuantity: 1, price: 60, compareAtPrice: 60, sortOrder: 5 },
  { slug: 'gf-006', categorySlug: 'grains-flour', name: 'Ragi Flour (Finger Millet)', nameTe: 'రాగి పిండి', unit: 'kg', defaultQuantity: 1, price: 85, compareAtPrice: 85, sortOrder: 6 },
  { slug: 'gf-007', categorySlug: 'grains-flour', name: 'Jowar Flour (Sorghum)', nameTe: 'జొన్న పిండి', unit: 'kg', defaultQuantity: 1, price: 75, compareAtPrice: 75, sortOrder: 7 },
  { slug: 'gf-008', categorySlug: 'grains-flour', name: 'Bajra Flour (Pearl Millet)', nameTe: 'సజ్జ పిండి', unit: 'kg', defaultQuantity: 1, price: 70, compareAtPrice: 70, sortOrder: 8 },
  { slug: 'gf-009', categorySlug: 'grains-flour', name: 'Besan (Chickpea Flour)', nameTe: 'శెనగ పిండి', unit: 'kg', defaultQuantity: 1, price: 110, compareAtPrice: 110, sortOrder: 9 },

  // Other Grains
  { slug: 'gf-010', categorySlug: 'grains-flour', name: 'Poha (Flattened Rice)', nameTe: 'అట్లు', unit: 'kg', defaultQuantity: 1, price: 65, compareAtPrice: 65, sortOrder: 10 },
  { slug: 'gf-011', categorySlug: 'grains-flour', name: 'Oats', nameTe: 'ఓట్స్', unit: 'kg', defaultQuantity: 1, price: 120, compareAtPrice: 120, sortOrder: 11 },

  // ========== Rice ==========
  // Premium Varieties
  { slug: 'rc-001', categorySlug: 'rice', name: 'Basmati Rice', nameTe: 'బాస్మతి బియ్యం', unit: 'kg', defaultQuantity: 5, price: 140, compareAtPrice: 140, sortOrder: 1 },
  { slug: 'rc-002', categorySlug: 'rice', name: 'Jeera Samba Rice', nameTe: 'జీరా సాంబా', unit: 'kg', defaultQuantity: 1, price: 125, compareAtPrice: 125, sortOrder: 2 },

  // Daily Use Varieties
  { slug: 'rc-003', categorySlug: 'rice', name: 'Sona Masuri (New)', nameTe: 'సోనా మసూరి (కొత్తది)', unit: 'kg', defaultQuantity: 5, price: 65, compareAtPrice: 65, sortOrder: 3 },
  { slug: 'rc-004', categorySlug: 'rice', name: 'Sona Masuri (Old)', nameTe: 'సోనా మసూరి (పాతది)', unit: 'kg', defaultQuantity: 5, price: 72, compareAtPrice: 72, sortOrder: 4 },
  { slug: 'rc-005', categorySlug: 'rice', name: 'Ponni Rice', nameTe: 'పొన్ని బియ్యం', unit: 'kg', defaultQuantity: 5, price: 58, compareAtPrice: 58, sortOrder: 5 },
  { slug: 'rc-006', categorySlug: 'rice', name: 'Kolam Rice', nameTe: 'కొలాం బియ్యం', unit: 'kg', defaultQuantity: 5, price: 62, compareAtPrice: 62, sortOrder: 6 },
  { slug: 'rc-007', categorySlug: 'rice', name: 'Boiled Rice', nameTe: 'ఉడికిన బియ్యం', unit: 'kg', defaultQuantity: 5, price: 60, compareAtPrice: 60, sortOrder: 7 },

  // Specialty Rice
  { slug: 'rc-008', categorySlug: 'rice', name: 'Idli Rice', nameTe: 'ఇడ్లీ బియ్యం', unit: 'kg', defaultQuantity: 2, price: 55, compareAtPrice: 55, sortOrder: 8 },
  { slug: 'rc-009', categorySlug: 'rice', name: 'Dosa Rice', nameTe: 'దోస బియ్యం', unit: 'kg', defaultQuantity: 2, price: 56, compareAtPrice: 56, sortOrder: 9 },
  { slug: 'rc-010', categorySlug: 'rice', name: 'Broken Rice / Idli Rava', nameTe: 'రవ్వ బియ్యం', unit: 'kg', defaultQuantity: 1, price: 48, compareAtPrice: 48, sortOrder: 10 },
  { slug: 'rc-011', categorySlug: 'rice', name: 'Brown Rice', nameTe: 'బ్రౌన్ రైస్', unit: 'kg', defaultQuantity: 1, price: 95, compareAtPrice: 95, sortOrder: 11 },

  // ========== Dals & Pulses ==========
  // Common Split Dals
  { slug: 'dl-001', categorySlug: 'dals-pulses', name: 'Toor Dal / Arhar Dal', nameTe: 'కంది పప్పు', unit: 'kg', defaultQuantity: 2, price: 160, compareAtPrice: 160, sortOrder: 1 },
  { slug: 'dl-002', categorySlug: 'dals-pulses', name: 'Moong Dal (Split)', nameTe: 'పెసర పప్పు', unit: 'kg', defaultQuantity: 1, price: 140, compareAtPrice: 140, sortOrder: 2 },
  { slug: 'dl-003', categorySlug: 'dals-pulses', name: 'Masoor Dal (Red Lentils)', nameTe: 'మసూర్ పప్పు', unit: 'kg', defaultQuantity: 1, price: 115, compareAtPrice: 115, sortOrder: 3 },
  { slug: 'dl-004', categorySlug: 'dals-pulses', name: 'Urad Dal (Split)', nameTe: 'మినప పప్పు', unit: 'kg', defaultQuantity: 1, price: 150, compareAtPrice: 150, sortOrder: 4 },
  { slug: 'dl-005', categorySlug: 'dals-pulses', name: 'Chana Dal (Bengal Gram)', nameTe: 'శెనగ పప్పు', unit: 'kg', defaultQuantity: 1, price: 95, compareAtPrice: 95, sortOrder: 5 },

  // Whole Pulses
  { slug: 'dl-006', categorySlug: 'dals-pulses', name: 'Moong Dal (Whole)', nameTe: 'పెసలు', unit: 'kg', defaultQuantity: 1, price: 130, compareAtPrice: 130, sortOrder: 6 },
  { slug: 'dl-007', categorySlug: 'dals-pulses', name: 'Urad Dal (Whole)', nameTe: 'మినపప్పు (మొత్తం)', unit: 'kg', defaultQuantity: 1, price: 145, compareAtPrice: 145, sortOrder: 7 },
  { slug: 'dl-008', categorySlug: 'dals-pulses', name: 'Chickpeas / Kabuli Chana', nameTe: 'శెనగలు', unit: 'kg', defaultQuantity: 1, price: 100, compareAtPrice: 100, sortOrder: 8 },
  { slug: 'dl-009', categorySlug: 'dals-pulses', name: 'Rajma (Kidney Beans)', nameTe: 'రాజ్మా', unit: 'kg', defaultQuantity: 1, price: 125, compareAtPrice: 125, sortOrder: 9 },
  { slug: 'dl-010', categorySlug: 'dals-pulses', name: 'Cow Peas / Black-eyed Beans', nameTe: 'అలసందలు', unit: 'kg', defaultQuantity: 1, price: 90, compareAtPrice: 90, sortOrder: 10 },
  { slug: 'dl-011', categorySlug: 'dals-pulses', name: 'Horse Gram', nameTe: 'ఉలవలు', unit: 'kg', defaultQuantity: 1, price: 85, compareAtPrice: 85, sortOrder: 11 },
  { slug: 'dl-012', categorySlug: 'dals-pulses', name: 'Black Gram (Whole)', nameTe: 'నల్ల ఉలవలు', unit: 'kg', defaultQuantity: 1, price: 135, compareAtPrice: 135, sortOrder: 12 },

  // ========== Oils & Ghee ==========
  // Cooking Oils
  { slug: 'ol-001', categorySlug: 'oils-ghee', name: 'Sunflower Oil', nameTe: 'సన్‌ఫ్లవర్ నూనె', unit: 'L', defaultQuantity: 2, price: 145, compareAtPrice: 145, sortOrder: 1 },
  { slug: 'ol-002', categorySlug: 'oils-ghee', name: 'Groundnut Oil', nameTe: 'వేరుశెనగ నూనె', unit: 'L', defaultQuantity: 2, price: 195, compareAtPrice: 195, sortOrder: 2 },
  { slug: 'ol-003', categorySlug: 'oils-ghee', name: 'Mustard Oil', nameTe: 'ఆవప నూనె', unit: 'L', defaultQuantity: 1, price: 180, compareAtPrice: 180, sortOrder: 3 },
  { slug: 'ol-004', categorySlug: 'oils-ghee', name: 'Sesame Oil', nameTe: 'నువ్వుల నూనె', unit: 'L', defaultQuantity: 1, price: 220, compareAtPrice: 220, sortOrder: 4 },
  { slug: 'ol-005', categorySlug: 'oils-ghee', name: 'Coconut Oil', nameTe: 'కొబ్బరి నూనె', unit: 'L', defaultQuantity: 1, price: 210, compareAtPrice: 210, sortOrder: 5 },
  { slug: 'ol-006', categorySlug: 'oils-ghee', name: 'Olive Oil', nameTe: 'ఆలివ్ ఆయిల్', unit: 'L', defaultQuantity: 1, price: 450, compareAtPrice: 450, sortOrder: 6 },
  { slug: 'ol-007', categorySlug: 'oils-ghee', name: 'Rice Bran Oil', nameTe: 'రైస్ బ్రాన్ ఆయిల్', unit: 'L', defaultQuantity: 1, price: 165, compareAtPrice: 165, sortOrder: 7 },

  // Ghee
  { slug: 'ol-008', categorySlug: 'oils-ghee', name: 'Cow Ghee', nameTe: 'ఆవు నెయ్యి', unit: 'kg', defaultQuantity: 1, price: 550, compareAtPrice: 550, sortOrder: 8 },
  { slug: 'ol-009', categorySlug: 'oils-ghee', name: 'Buffalo Ghee', nameTe: 'గేదె నెయ్యి', unit: 'kg', defaultQuantity: 1, price: 480, compareAtPrice: 480, sortOrder: 9 },

  // ========== Spices & Masalas (prices per KG for gm items) ==========
  // Whole Spices
  { slug: 'sp-001', categorySlug: 'spices', name: 'Cumin Seeds', nameTe: 'జీలకర్ర', unit: 'gm', defaultQuantity: 250, price: 340, compareAtPrice: 340, sortOrder: 1 },        // 340/kg
  { slug: 'sp-002', categorySlug: 'spices', name: 'Coriander Seeds', nameTe: 'ధనియాలు', unit: 'gm', defaultQuantity: 250, price: 240, compareAtPrice: 240, sortOrder: 2 },    // 240/kg
  { slug: 'sp-003', categorySlug: 'spices', name: 'Mustard Seeds', nameTe: 'ఆవాలు', unit: 'gm', defaultQuantity: 250, price: 280, compareAtPrice: 280, sortOrder: 3 },       // 280/kg
  { slug: 'sp-004', categorySlug: 'spices', name: 'Fenugreek Seeds', nameTe: 'మెంతులు', unit: 'gm', defaultQuantity: 250, price: 260, compareAtPrice: 260, sortOrder: 4 },   // 260/kg
  { slug: 'sp-005', categorySlug: 'spices', name: 'Black Pepper', nameTe: 'మిరియాలు', unit: 'gm', defaultQuantity: 100, price: 1800, compareAtPrice: 1800, sortOrder: 5 },    // 1800/kg
  { slug: 'sp-006', categorySlug: 'spices', name: 'Cloves', nameTe: 'లవంగాలు', unit: 'gm', defaultQuantity: 50, price: 6400, compareAtPrice: 6400, sortOrder: 6 },            // 6400/kg
  { slug: 'sp-007', categorySlug: 'spices', name: 'Cinnamon Sticks', nameTe: 'దాల్చిన చెక్క', unit: 'gm', defaultQuantity: 50, price: 5600, compareAtPrice: 5600, sortOrder: 7 }, // 5600/kg
  { slug: 'sp-008', categorySlug: 'spices', name: 'Cardamom', nameTe: 'ఏలకులు', unit: 'gm', defaultQuantity: 50, price: 9000, compareAtPrice: 9000, sortOrder: 8 },           // 9000/kg
  { slug: 'sp-009', categorySlug: 'spices', name: 'Bay Leaves', nameTe: 'బిర్యానీ ఆకు', unit: 'gm', defaultQuantity: 25, price: 4800, compareAtPrice: 4800, sortOrder: 9 },   // 4800/kg
  { slug: 'sp-010', categorySlug: 'spices', name: 'Star Anise', nameTe: 'స్టార్ యానిస్', unit: 'gm', defaultQuantity: 25, price: 9600, compareAtPrice: 9600, sortOrder: 10 }, // 9600/kg

  // Dried Ingredients
  { slug: 'sp-011', categorySlug: 'spices', name: 'Dry Red Chillies', nameTe: 'ఎండు మిరపకాయలు', unit: 'gm', defaultQuantity: 250, price: 560, compareAtPrice: 560, sortOrder: 11 },   // 560/kg
  { slug: 'sp-012', categorySlug: 'spices', name: 'Dry Green Chillies', nameTe: 'ఎండు పచ్చి మిర్చి', unit: 'gm', defaultQuantity: 100, price: 1600, compareAtPrice: 1600, sortOrder: 12 }, // 1600/kg
  { slug: 'sp-013', categorySlug: 'spices', name: 'Tamarind', nameTe: 'చింతపండు', unit: 'gm', defaultQuantity: 500, price: 170, compareAtPrice: 170, sortOrder: 13 },              // 170/kg
  { slug: 'sp-014', categorySlug: 'spices', name: 'Dry Curry Leaves', nameTe: 'కరివేపాకు (ఎండు)', unit: 'gm', defaultQuantity: 50, price: 2000, compareAtPrice: 2000, sortOrder: 14 }, // 2000/kg
  { slug: 'sp-015', categorySlug: 'spices', name: 'Dry Mango Powder (Amchur)', nameTe: 'ఆమ్చూర్ పొడి', unit: 'gm', defaultQuantity: 100, price: 950, compareAtPrice: 950, sortOrder: 15 }, // 950/kg

  // Powdered Spices
  { slug: 'sp-016', categorySlug: 'spices', name: 'Turmeric Powder', nameTe: 'పసుపు పొడి', unit: 'gm', defaultQuantity: 500, price: 150, compareAtPrice: 150, sortOrder: 16 },   // 150/kg
  { slug: 'sp-017', categorySlug: 'spices', name: 'Red Chilli Powder', nameTe: 'కారం పొడి', unit: 'gm', defaultQuantity: 500, price: 240, compareAtPrice: 240, sortOrder: 17 },  // 240/kg
  { slug: 'sp-018', categorySlug: 'spices', name: 'Coriander Powder', nameTe: 'ధనియాల పొడి', unit: 'gm', defaultQuantity: 250, price: 220, compareAtPrice: 220, sortOrder: 18 }, // 220/kg
  { slug: 'sp-019', categorySlug: 'spices', name: 'Cumin Powder', nameTe: 'జీలకర్ర పొడి', unit: 'gm', defaultQuantity: 100, price: 900, compareAtPrice: 900, sortOrder: 19 },    // 900/kg

  // Masala Blends
  { slug: 'sp-020', categorySlug: 'spices', name: 'Garam Masala', nameTe: 'గరం మసాలా', unit: 'gm', defaultQuantity: 100, price: 1100, compareAtPrice: 1100, sortOrder: 20 },      // 1100/kg
  { slug: 'sp-021', categorySlug: 'spices', name: 'Sambar Powder', nameTe: 'సాంబార్ పొడి', unit: 'gm', defaultQuantity: 250, price: 280, compareAtPrice: 280, sortOrder: 21 },   // 280/kg
  { slug: 'sp-022', categorySlug: 'spices', name: 'Rasam Powder', nameTe: 'రసం పొడి', unit: 'gm', defaultQuantity: 250, price: 260, compareAtPrice: 260, sortOrder: 22 },        // 260/kg
  { slug: 'sp-023', categorySlug: 'spices', name: 'Biryani Masala', nameTe: 'బిర్యానీ మసాలా', unit: 'gm', defaultQuantity: 100, price: 1150, compareAtPrice: 1150, sortOrder: 23 }, // 1150/kg
  { slug: 'sp-024', categorySlug: 'spices', name: 'Chaat Masala', nameTe: 'చాట్ మసాలా', unit: 'gm', defaultQuantity: 100, price: 1050, compareAtPrice: 1050, sortOrder: 24 },      // 1050/kg
  { slug: 'sp-025', categorySlug: 'spices', name: 'Asafoetida (Hing)', nameTe: 'ఇంగువ', unit: 'gm', defaultQuantity: 50, price: 4000, compareAtPrice: 4000, sortOrder: 25 },       // 4000/kg

  // ========== Vegetables (gm items use per-KG prices) ==========
  { slug: 'vg-001', categorySlug: 'vegetables', name: 'Potato', nameTe: 'బంగాళదుంప', unit: 'kg', defaultQuantity: 2, price: 35, compareAtPrice: 35, sortOrder: 1 },
  { slug: 'vg-002', categorySlug: 'vegetables', name: 'Onion', nameTe: 'ఉల్లిపాయ', unit: 'kg', defaultQuantity: 2, price: 40, compareAtPrice: 40, sortOrder: 2 },
  { slug: 'vg-003', categorySlug: 'vegetables', name: 'Tomato', nameTe: 'టమోటా', unit: 'kg', defaultQuantity: 2, price: 45, compareAtPrice: 45, sortOrder: 3 },
  { slug: 'vg-004', categorySlug: 'vegetables', name: 'Green Chilli', nameTe: 'పచ్చి మిర్చి', unit: 'gm', defaultQuantity: 250, price: 320, compareAtPrice: 320, sortOrder: 4 },   // 320/kg
  { slug: 'vg-005', categorySlug: 'vegetables', name: 'Ginger', nameTe: 'అల్లం', unit: 'gm', defaultQuantity: 250, price: 400, compareAtPrice: 400, sortOrder: 5 },              // 400/kg
  { slug: 'vg-006', categorySlug: 'vegetables', name: 'Garlic', nameTe: 'వెల్లుల్లి', unit: 'gm', defaultQuantity: 250, price: 480, compareAtPrice: 480, sortOrder: 6 },         // 480/kg
  { slug: 'vg-007', categorySlug: 'vegetables', name: 'Coriander Leaves', nameTe: 'కొత్తిమీర', unit: 'gm', defaultQuantity: 100, price: 250, compareAtPrice: 250, sortOrder: 7 }, // 250/kg
  { slug: 'vg-008', categorySlug: 'vegetables', name: 'Curry Leaves', nameTe: 'కరివేపాకు', unit: 'gm', defaultQuantity: 50, price: 300, compareAtPrice: 300, sortOrder: 8 },     // 300/kg
  { slug: 'vg-009', categorySlug: 'vegetables', name: 'Lemon', nameTe: 'నిమ్మకాయ', unit: 'pcs', defaultQuantity: 6, price: 8, compareAtPrice: 8, sortOrder: 9 },

  // ========== Beverages (gm items use per-KG prices) ==========
  // Tea
  { slug: 'bv-001', categorySlug: 'beverages', name: 'Loose Tea Leaves', nameTe: 'టీ పొడి', unit: 'gm', defaultQuantity: 500, price: 440, compareAtPrice: 440, sortOrder: 1 },    // 440/kg
  { slug: 'bv-002', categorySlug: 'beverages', name: 'Tea Bags', nameTe: 'టీ బ్యాగ్స్', unit: 'pcs', defaultQuantity: 100, price: 180, compareAtPrice: 180, sortOrder: 2 },
  { slug: 'bv-003', categorySlug: 'beverages', name: 'Green Tea', nameTe: 'గ్రీన్ టీ', unit: 'pcs', defaultQuantity: 25, price: 160, compareAtPrice: 160, sortOrder: 3 },

  // Coffee
  { slug: 'bv-004', categorySlug: 'beverages', name: 'Coffee Powder (Filter)', nameTe: 'కాఫీ పొడి', unit: 'gm', defaultQuantity: 500, price: 900, compareAtPrice: 900, sortOrder: 4 },  // 900/kg
  { slug: 'bv-005', categorySlug: 'beverages', name: 'Instant Coffee', nameTe: 'ఇన్‌స్టెంట్ కాఫీ', unit: 'gm', defaultQuantity: 200, price: 1400, compareAtPrice: 1400, sortOrder: 5 }, // 1400/kg

  // Health Drinks
  { slug: 'bv-006', categorySlug: 'beverages', name: 'Horlicks', nameTe: 'హార్లిక్స్', unit: 'gm', defaultQuantity: 500, price: 640, compareAtPrice: 640, sortOrder: 6 },  // 640/kg
  { slug: 'bv-007', categorySlug: 'beverages', name: 'Bournvita', nameTe: 'బౌర్న్‌విటా', unit: 'gm', defaultQuantity: 500, price: 620, compareAtPrice: 620, sortOrder: 7 }, // 620/kg
  { slug: 'bv-008', categorySlug: 'beverages', name: 'Complan', nameTe: 'కాంప్లాన్', unit: 'gm', defaultQuantity: 500, price: 760, compareAtPrice: 760, sortOrder: 8 },    // 760/kg

  // ========== Daily Essentials (gm items use per-KG prices) ==========
  // Sweeteners
  { slug: 'es-001', categorySlug: 'daily-essentials', name: 'Sugar (White)', nameTe: 'పంచదార', unit: 'kg', defaultQuantity: 2, price: 42, compareAtPrice: 42, sortOrder: 1 },
  { slug: 'es-002', categorySlug: 'daily-essentials', name: 'Jaggery', nameTe: 'బెల్లం', unit: 'kg', defaultQuantity: 1, price: 65, compareAtPrice: 65, sortOrder: 2 },
  { slug: 'es-003', categorySlug: 'daily-essentials', name: 'Jaggery Powder', nameTe: 'బెల్లం పొడి', unit: 'kg', defaultQuantity: 1, price: 70, compareAtPrice: 70, sortOrder: 3 },

  // Salt
  { slug: 'es-004', categorySlug: 'daily-essentials', name: 'Iodized Salt', nameTe: 'ఉప్పు', unit: 'kg', defaultQuantity: 1, price: 20, compareAtPrice: 20, sortOrder: 4 },
  { slug: 'es-005', categorySlug: 'daily-essentials', name: 'Rock Salt', nameTe: 'రాయి ఉప్పు', unit: 'gm', defaultQuantity: 500, price: 60, compareAtPrice: 60, sortOrder: 5 },    // 60/kg
  { slug: 'es-006', categorySlug: 'daily-essentials', name: 'Black Salt', nameTe: 'నల్ల ఉప్పు', unit: 'gm', defaultQuantity: 250, price: 100, compareAtPrice: 100, sortOrder: 6 },  // 100/kg

  // Cooking Essentials
  { slug: 'es-007', categorySlug: 'daily-essentials', name: 'Cooking Soda', nameTe: 'వంట సోడా', unit: 'gm', defaultQuantity: 200, price: 175, compareAtPrice: 175, sortOrder: 7 },     // 175/kg
  { slug: 'es-008', categorySlug: 'daily-essentials', name: 'Baking Powder', nameTe: 'బేకింగ్ పౌడర్', unit: 'gm', defaultQuantity: 200, price: 275, compareAtPrice: 275, sortOrder: 8 }, // 275/kg
  { slug: 'es-009', categorySlug: 'daily-essentials', name: 'Dry Coconut', nameTe: 'ఎండు కొబ్బరి', unit: 'gm', defaultQuantity: 250, price: 480, compareAtPrice: 480, sortOrder: 9 },   // 480/kg
  { slug: 'es-010', categorySlug: 'daily-essentials', name: 'Poppy Seeds', nameTe: 'గసగసాలు', unit: 'gm', defaultQuantity: 100, price: 1400, compareAtPrice: 1400, sortOrder: 10 },      // 1400/kg
  { slug: 'es-011', categorySlug: 'daily-essentials', name: 'Cashews', nameTe: 'జీడిపప్పు', unit: 'gm', defaultQuantity: 250, price: 1680, compareAtPrice: 1680, sortOrder: 11 },        // 1680/kg
  { slug: 'es-012', categorySlug: 'daily-essentials', name: 'Almonds', nameTe: 'బాదం పప్పు', unit: 'gm', defaultQuantity: 250, price: 1920, compareAtPrice: 1920, sortOrder: 12 },       // 1920/kg
  { slug: 'es-013', categorySlug: 'daily-essentials', name: 'Raisins', nameTe: 'ఎండుద్రాక్ష', unit: 'gm', defaultQuantity: 250, price: 720, compareAtPrice: 720, sortOrder: 13 },       // 720/kg

  // ========== Personal Care (gm->per-KG, ml->per-L prices) ==========
  // Oral Care
  { slug: 'pc-001', categorySlug: 'personal-care', name: 'Toothpaste', nameTe: 'టూత్‌పేస్ట్', unit: 'gm', defaultQuantity: 200, price: 425, compareAtPrice: 425, sortOrder: 1 },    // 425/kg
  { slug: 'pc-002', categorySlug: 'personal-care', name: 'Toothbrush', nameTe: 'టూత్‌బ్రష్', unit: 'pcs', defaultQuantity: 2, price: 35, compareAtPrice: 35, sortOrder: 2 },
  { slug: 'pc-003', categorySlug: 'personal-care', name: 'Mouthwash', nameTe: 'మౌత్‌వాష్', unit: 'ml', defaultQuantity: 250, price: 560, compareAtPrice: 560, sortOrder: 3 },        // 560/L

  // Hair Care
  { slug: 'pc-004', categorySlug: 'personal-care', name: 'Shampoo', nameTe: 'షాంపూ', unit: 'ml', defaultQuantity: 340, price: 647, compareAtPrice: 647, sortOrder: 4 },             // 647/L
  { slug: 'pc-005', categorySlug: 'personal-care', name: 'Conditioner', nameTe: 'కండీషనర్', unit: 'ml', defaultQuantity: 200, price: 900, compareAtPrice: 900, sortOrder: 5 },      // 900/L
  { slug: 'pc-006', categorySlug: 'personal-care', name: 'Hair Oil', nameTe: 'జుట్టు నూనె', unit: 'ml', defaultQuantity: 200, price: 600, compareAtPrice: 600, sortOrder: 6 },      // 600/L

  // Bathing
  { slug: 'pc-007', categorySlug: 'personal-care', name: 'Bathing Soap', nameTe: 'స్నానం సబ్బు', unit: 'pcs', defaultQuantity: 3, price: 30, compareAtPrice: 30, sortOrder: 7 },
  { slug: 'pc-008', categorySlug: 'personal-care', name: 'Body Wash', nameTe: 'బాడీ వాష్', unit: 'ml', defaultQuantity: 250, price: 700, compareAtPrice: 700, sortOrder: 8 },       // 700/L

  // Skin Care
  { slug: 'pc-009', categorySlug: 'personal-care', name: 'Body Lotion', nameTe: 'బాడీ లోషన్', unit: 'ml', defaultQuantity: 400, price: 625, compareAtPrice: 625, sortOrder: 9 },    // 625/L
  { slug: 'pc-010', categorySlug: 'personal-care', name: 'Face Cream', nameTe: 'ఫేస్ క్రీమ్', unit: 'gm', defaultQuantity: 50, price: 3200, compareAtPrice: 3200, sortOrder: 10 },   // 3200/kg
  { slug: 'pc-011', categorySlug: 'personal-care', name: 'Face Wash', nameTe: 'ఫేస్ వాష్', unit: 'ml', defaultQuantity: 100, price: 1350, compareAtPrice: 1350, sortOrder: 11 },     // 1350/L
  { slug: 'pc-012', categorySlug: 'personal-care', name: 'Sunscreen', nameTe: 'సన్‌స్క్రీన్', unit: 'ml', defaultQuantity: 100, price: 2800, compareAtPrice: 2800, sortOrder: 12 },  // 2800/L

  // Other
  { slug: 'pc-013', categorySlug: 'personal-care', name: 'Talcum Powder', nameTe: 'పౌడర్', unit: 'gm', defaultQuantity: 400, price: 363, compareAtPrice: 363, sortOrder: 13 },      // 363/kg
  { slug: 'pc-014', categorySlug: 'personal-care', name: 'Deodorant', nameTe: 'డియోడరెంట్', unit: 'ml', defaultQuantity: 150, price: 1267, compareAtPrice: 1267, sortOrder: 14 },    // 1267/L
  { slug: 'pc-015', categorySlug: 'personal-care', name: 'Hand Sanitizer', nameTe: 'హ్యాండ్ శానిటైజర్', unit: 'ml', defaultQuantity: 200, price: 475, compareAtPrice: 475, sortOrder: 15 }, // 475/L
];

// =============================================================================
// QuickBasket Store — Standard, convenience-oriented store
// 8 categories, ~80 items focused on ready-to-use products and daily needs
// =============================================================================

export const QUICKBASKET_CATEGORIES: CategorySeed[] = [
  { slug: 'dairy-eggs', name: 'Dairy & Eggs', nameTe: 'పాల ఉత్పత్తులు & గుడ్లు', icon: '🥛', sortOrder: 1 },
  { slug: 'fruits', name: 'Fruits', nameTe: 'పండ్లు', icon: '🍎', sortOrder: 2 },
  { slug: 'snacks-namkeen', name: 'Snacks & Namkeen', nameTe: 'చిరుతిండ్లు & నమ్కీన్', icon: '🍿', sortOrder: 3 },
  { slug: 'bakery-bread', name: 'Bakery & Bread', nameTe: 'బేకరీ & బ్రెడ్', icon: '🍞', sortOrder: 4 },
  { slug: 'frozen-foods', name: 'Frozen Foods', nameTe: 'ఫ్రోజెన్ ఆహారాలు', icon: '🧊', sortOrder: 5 },
  { slug: 'cleaning-household', name: 'Cleaning & Household', nameTe: 'శుభ్రపరచడం & గృహ సామగ్రి', icon: '🧹', sortOrder: 6 },
  { slug: 'baby-care', name: 'Baby Care', nameTe: 'శిశు సంరక్షణ', icon: '👶', sortOrder: 7 },
  { slug: 'ready-to-cook', name: 'Ready to Cook', nameTe: 'వంటకు సిద్ధం', icon: '🍝', sortOrder: 8 },
];

export const QUICKBASKET_ITEMS: ItemSeed[] = [
  // ========== Dairy & Eggs ==========
  { slug: 'qb-dy-001', categorySlug: 'dairy-eggs', name: 'Full Cream Milk', nameTe: 'ఫుల్ క్రీమ్ పాలు', unit: 'L', defaultQuantity: 1, price: 60, compareAtPrice: 62, sortOrder: 1 },
  { slug: 'qb-dy-002', categorySlug: 'dairy-eggs', name: 'Toned Milk', nameTe: 'టోన్డ్ పాలు', unit: 'L', defaultQuantity: 1, price: 50, compareAtPrice: 52, sortOrder: 2 },
  { slug: 'qb-dy-003', categorySlug: 'dairy-eggs', name: 'Curd / Dahi', nameTe: 'పెరుగు', unit: 'kg', defaultQuantity: 1, price: 60, compareAtPrice: 65, sortOrder: 3 },
  { slug: 'qb-dy-004', categorySlug: 'dairy-eggs', name: 'Paneer', nameTe: 'పనీర్', unit: 'gm', defaultQuantity: 200, price: 400, compareAtPrice: 420, sortOrder: 4 },          // 400/kg
  { slug: 'qb-dy-005', categorySlug: 'dairy-eggs', name: 'Butter', nameTe: 'వెన్న', unit: 'gm', defaultQuantity: 500, price: 560, compareAtPrice: 580, sortOrder: 5 },           // 560/kg
  { slug: 'qb-dy-006', categorySlug: 'dairy-eggs', name: 'Cheese Slices', nameTe: 'చీజ్ స్లైసులు', unit: 'gm', defaultQuantity: 200, price: 700, compareAtPrice: 750, sortOrder: 6 }, // 700/kg
  { slug: 'qb-dy-007', categorySlug: 'dairy-eggs', name: 'Eggs (Farm)', nameTe: 'గుడ్లు (ఫార్మ్)', unit: 'pcs', defaultQuantity: 12, price: 7, compareAtPrice: 8, sortOrder: 7 },
  { slug: 'qb-dy-008', categorySlug: 'dairy-eggs', name: 'Buttermilk', nameTe: 'మజ్జిగ', unit: 'L', defaultQuantity: 1, price: 30, compareAtPrice: 35, sortOrder: 8 },
  { slug: 'qb-dy-009', categorySlug: 'dairy-eggs', name: 'Fresh Cream', nameTe: 'ఫ్రెష్ క్రీమ్', unit: 'ml', defaultQuantity: 200, price: 300, compareAtPrice: 320, sortOrder: 9 },  // 300/L
  { slug: 'qb-dy-010', categorySlug: 'dairy-eggs', name: 'Flavoured Yogurt', nameTe: 'ఫ్లేవర్డ్ యోగర్ట్', unit: 'gm', defaultQuantity: 200, price: 350, compareAtPrice: 380, sortOrder: 10 }, // 350/kg

  // ========== Fruits ==========
  { slug: 'qb-fr-001', categorySlug: 'fruits', name: 'Banana', nameTe: 'అరటిపండు', unit: 'pcs', defaultQuantity: 12, price: 5, compareAtPrice: 5, sortOrder: 1 },
  { slug: 'qb-fr-002', categorySlug: 'fruits', name: 'Apple (Shimla)', nameTe: 'ఆపిల్ (శిమ్లా)', unit: 'kg', defaultQuantity: 1, price: 180, compareAtPrice: 200, sortOrder: 2 },
  { slug: 'qb-fr-003', categorySlug: 'fruits', name: 'Mango (Banganapalli)', nameTe: 'మామిడి (బంగినపల్లి)', unit: 'kg', defaultQuantity: 1, price: 120, compareAtPrice: 140, sortOrder: 3 },
  { slug: 'qb-fr-004', categorySlug: 'fruits', name: 'Grapes (Green)', nameTe: 'ద్రాక్ష (ఆకుపచ్చ)', unit: 'kg', defaultQuantity: 1, price: 100, compareAtPrice: 110, sortOrder: 4 },
  { slug: 'qb-fr-005', categorySlug: 'fruits', name: 'Pomegranate', nameTe: 'దానిమ్మ', unit: 'kg', defaultQuantity: 1, price: 160, compareAtPrice: 180, sortOrder: 5 },
  { slug: 'qb-fr-006', categorySlug: 'fruits', name: 'Papaya', nameTe: 'బొప్పాయి', unit: 'kg', defaultQuantity: 1, price: 40, compareAtPrice: 45, sortOrder: 6 },
  { slug: 'qb-fr-007', categorySlug: 'fruits', name: 'Orange (Nagpur)', nameTe: 'నారింజ (నాగ్‌పూర్)', unit: 'kg', defaultQuantity: 1, price: 80, compareAtPrice: 90, sortOrder: 7 },
  { slug: 'qb-fr-008', categorySlug: 'fruits', name: 'Watermelon', nameTe: 'పుచ్చకాయ', unit: 'kg', defaultQuantity: 2, price: 25, compareAtPrice: 30, sortOrder: 8 },
  { slug: 'qb-fr-009', categorySlug: 'fruits', name: 'Guava', nameTe: 'జామకాయ', unit: 'kg', defaultQuantity: 1, price: 60, compareAtPrice: 70, sortOrder: 9 },
  { slug: 'qb-fr-010', categorySlug: 'fruits', name: 'Sapota (Chikoo)', nameTe: 'సపోటా', unit: 'kg', defaultQuantity: 1, price: 80, compareAtPrice: 90, sortOrder: 10 },

  // ========== Snacks & Namkeen (gm items use per-KG prices) ==========
  { slug: 'qb-sn-001', categorySlug: 'snacks-namkeen', name: 'Potato Chips (Salted)', nameTe: 'ఆలూ చిప్స్ (ఉప్పు)', unit: 'gm', defaultQuantity: 200, price: 500, compareAtPrice: 500, sortOrder: 1 },   // 500/kg
  { slug: 'qb-sn-002', categorySlug: 'snacks-namkeen', name: 'Glucose Biscuits', nameTe: 'గ్లూకోజ్ బిస్కట్‌లు', unit: 'gm', defaultQuantity: 500, price: 200, compareAtPrice: 200, sortOrder: 2 },     // 200/kg
  { slug: 'qb-sn-003', categorySlug: 'snacks-namkeen', name: 'Cream Biscuits', nameTe: 'క్రీమ్ బిస్కట్‌లు', unit: 'gm', defaultQuantity: 200, price: 450, compareAtPrice: 500, sortOrder: 3 },         // 450/kg
  { slug: 'qb-sn-004', categorySlug: 'snacks-namkeen', name: 'Namkeen Mixture', nameTe: 'నమ్కీన్ మిక్చర్', unit: 'gm', defaultQuantity: 500, price: 360, compareAtPrice: 400, sortOrder: 4 },           // 360/kg
  { slug: 'qb-sn-005', categorySlug: 'snacks-namkeen', name: 'Murukku', nameTe: 'ముర్కులు', unit: 'gm', defaultQuantity: 250, price: 480, compareAtPrice: 480, sortOrder: 5 },                            // 480/kg
  { slug: 'qb-sn-006', categorySlug: 'snacks-namkeen', name: 'Dry Fruit Biscuits', nameTe: 'డ్రై ఫ్రూట్ బిస్కట్‌లు', unit: 'gm', defaultQuantity: 200, price: 600, compareAtPrice: 650, sortOrder: 6 }, // 600/kg
  { slug: 'qb-sn-007', categorySlug: 'snacks-namkeen', name: 'Rusk (Toast)', nameTe: 'రస్క్ (టోస్ట్)', unit: 'gm', defaultQuantity: 400, price: 350, compareAtPrice: 380, sortOrder: 7 },               // 350/kg
  { slug: 'qb-sn-008', categorySlug: 'snacks-namkeen', name: 'Peanut Chikki', nameTe: 'వేరుశెనగ చిక్కి', unit: 'gm', defaultQuantity: 250, price: 320, compareAtPrice: 340, sortOrder: 8 },             // 320/kg
  { slug: 'qb-sn-009', categorySlug: 'snacks-namkeen', name: 'Banana Chips', nameTe: 'అరటి చిప్స్', unit: 'gm', defaultQuantity: 200, price: 440, compareAtPrice: 480, sortOrder: 9 },                   // 440/kg
  { slug: 'qb-sn-010', categorySlug: 'snacks-namkeen', name: 'Marie Biscuits', nameTe: 'మేరీ బిస్కట్‌లు', unit: 'gm', defaultQuantity: 250, price: 280, compareAtPrice: 300, sortOrder: 10 },             // 280/kg

  // ========== Bakery & Bread ==========
  { slug: 'qb-bk-001', categorySlug: 'bakery-bread', name: 'White Bread', nameTe: 'వైట్ బ్రెడ్', unit: 'pcs', defaultQuantity: 1, price: 40, compareAtPrice: 45, sortOrder: 1 },
  { slug: 'qb-bk-002', categorySlug: 'bakery-bread', name: 'Brown Bread (Whole Wheat)', nameTe: 'బ్రౌన్ బ్రెడ్ (గోధుమ)', unit: 'pcs', defaultQuantity: 1, price: 50, compareAtPrice: 55, sortOrder: 2 },
  { slug: 'qb-bk-003', categorySlug: 'bakery-bread', name: 'Pav Buns', nameTe: 'పావ్ బన్నులు', unit: 'pcs', defaultQuantity: 8, price: 5, compareAtPrice: 6, sortOrder: 3 },
  { slug: 'qb-bk-004', categorySlug: 'bakery-bread', name: 'Milk Bread', nameTe: 'మిల్క్ బ్రెడ్', unit: 'pcs', defaultQuantity: 1, price: 45, compareAtPrice: 50, sortOrder: 4 },
  { slug: 'qb-bk-005', categorySlug: 'bakery-bread', name: 'Vanilla Cake', nameTe: 'వెనిల్లా కేక్', unit: 'gm', defaultQuantity: 500, price: 500, compareAtPrice: 540, sortOrder: 5 },   // 500/kg
  { slug: 'qb-bk-006', categorySlug: 'bakery-bread', name: 'Fruit Bun', nameTe: 'ఫ్రూట్ బన్', unit: 'pcs', defaultQuantity: 4, price: 12, compareAtPrice: 15, sortOrder: 6 },
  { slug: 'qb-bk-007', categorySlug: 'bakery-bread', name: 'Khara Bun', nameTe: 'ఖారా బన్', unit: 'pcs', defaultQuantity: 4, price: 10, compareAtPrice: 12, sortOrder: 7 },
  { slug: 'qb-bk-008', categorySlug: 'bakery-bread', name: 'Dilkush (Sweet Bread)', nameTe: 'దిల్‌కుష్ (తీపి బ్రెడ్)', unit: 'pcs', defaultQuantity: 2, price: 20, compareAtPrice: 25, sortOrder: 8 },

  // ========== Frozen Foods (gm items use per-KG prices, ml items use per-L prices) ==========
  { slug: 'qb-fz-001', categorySlug: 'frozen-foods', name: 'Frozen Peas', nameTe: 'ఫ్రోజెన్ బటానీలు', unit: 'gm', defaultQuantity: 500, price: 200, compareAtPrice: 220, sortOrder: 1 },          // 200/kg
  { slug: 'qb-fz-002', categorySlug: 'frozen-foods', name: 'Frozen Sweet Corn', nameTe: 'ఫ్రోజెన్ మొక్కజొన్న', unit: 'gm', defaultQuantity: 500, price: 220, compareAtPrice: 240, sortOrder: 2 },  // 220/kg
  { slug: 'qb-fz-003', categorySlug: 'frozen-foods', name: 'Frozen Parathas', nameTe: 'ఫ్రోజెన్ పరాఠాలు', unit: 'pcs', defaultQuantity: 5, price: 25, compareAtPrice: 28, sortOrder: 3 },
  { slug: 'qb-fz-004', categorySlug: 'frozen-foods', name: 'Ice Cream (Vanilla)', nameTe: 'ఐస్ క్రీమ్ (వెనిల్లా)', unit: 'ml', defaultQuantity: 500, price: 320, compareAtPrice: 350, sortOrder: 4 }, // 320/L
  { slug: 'qb-fz-005', categorySlug: 'frozen-foods', name: 'Frozen Mixed Vegetables', nameTe: 'ఫ్రోజెన్ కూరగాయలు', unit: 'gm', defaultQuantity: 500, price: 180, compareAtPrice: 200, sortOrder: 5 }, // 180/kg
  { slug: 'qb-fz-006', categorySlug: 'frozen-foods', name: 'Frozen Samosas', nameTe: 'ఫ్రోజెన్ సమోసాలు', unit: 'pcs', defaultQuantity: 10, price: 15, compareAtPrice: 18, sortOrder: 6 },
  { slug: 'qb-fz-007', categorySlug: 'frozen-foods', name: 'Ice Cream (Chocolate)', nameTe: 'ఐస్ క్రీమ్ (చాక్లెట్)', unit: 'ml', defaultQuantity: 500, price: 350, compareAtPrice: 380, sortOrder: 7 }, // 350/L
  { slug: 'qb-fz-008', categorySlug: 'frozen-foods', name: 'Frozen French Fries', nameTe: 'ఫ్రోజెన్ ఫ్రెంచ్ ఫ్రైస్', unit: 'gm', defaultQuantity: 500, price: 260, compareAtPrice: 280, sortOrder: 8 }, // 260/kg

  // ========== Cleaning & Household (gm items per-KG, ml items per-L) ==========
  { slug: 'qb-cl-001', categorySlug: 'cleaning-household', name: 'Detergent Powder', nameTe: 'డిటర్జెంట్ పౌడర్', unit: 'kg', defaultQuantity: 1, price: 120, compareAtPrice: 130, sortOrder: 1 },
  { slug: 'qb-cl-002', categorySlug: 'cleaning-household', name: 'Liquid Detergent', nameTe: 'లిక్విడ్ డిటర్జెంట్', unit: 'L', defaultQuantity: 1, price: 180, compareAtPrice: 200, sortOrder: 2 },
  { slug: 'qb-cl-003', categorySlug: 'cleaning-household', name: 'Dish Wash Liquid', nameTe: 'డిష్ వాష్ లిక్విడ్', unit: 'ml', defaultQuantity: 500, price: 280, compareAtPrice: 300, sortOrder: 3 },  // 280/L
  { slug: 'qb-cl-004', categorySlug: 'cleaning-household', name: 'Dish Wash Bar', nameTe: 'డిష్ వాష్ బార్', unit: 'gm', defaultQuantity: 500, price: 160, compareAtPrice: 180, sortOrder: 4 },         // 160/kg
  { slug: 'qb-cl-005', categorySlug: 'cleaning-household', name: 'Floor Cleaner', nameTe: 'ఫ్లోర్ క్లీనర్', unit: 'L', defaultQuantity: 1, price: 140, compareAtPrice: 160, sortOrder: 5 },
  { slug: 'qb-cl-006', categorySlug: 'cleaning-household', name: 'Toilet Cleaner', nameTe: 'టాయిలెట్ క్లీనర్', unit: 'ml', defaultQuantity: 500, price: 200, compareAtPrice: 220, sortOrder: 6 },     // 200/L
  { slug: 'qb-cl-007', categorySlug: 'cleaning-household', name: 'Broom (Soft)', nameTe: 'చీపురు (మెత్తని)', unit: 'pcs', defaultQuantity: 1, price: 80, compareAtPrice: 90, sortOrder: 7 },
  { slug: 'qb-cl-008', categorySlug: 'cleaning-household', name: 'Steel Scrubber', nameTe: 'స్టీల్ స్క్రబ్బర్', unit: 'pcs', defaultQuantity: 3, price: 15, compareAtPrice: 18, sortOrder: 8 },
  { slug: 'qb-cl-009', categorySlug: 'cleaning-household', name: 'Garbage Bags', nameTe: 'చెత్త సంచులు', unit: 'pcs', defaultQuantity: 30, price: 4, compareAtPrice: 5, sortOrder: 9 },
  { slug: 'qb-cl-010', categorySlug: 'cleaning-household', name: 'Glass Cleaner', nameTe: 'గ్లాస్ క్లీనర్', unit: 'ml', defaultQuantity: 500, price: 240, compareAtPrice: 260, sortOrder: 10 },       // 240/L

  // ========== Baby Care (gm items per-KG, ml items per-L) ==========
  { slug: 'qb-bc-001', categorySlug: 'baby-care', name: 'Baby Diapers (Small)', nameTe: 'బేబీ డయాపర్లు (చిన్న)', unit: 'pcs', defaultQuantity: 40, price: 14, compareAtPrice: 15, sortOrder: 1 },
  { slug: 'qb-bc-002', categorySlug: 'baby-care', name: 'Baby Diapers (Medium)', nameTe: 'బేబీ డయాపర్లు (మధ్యమ)', unit: 'pcs', defaultQuantity: 34, price: 17, compareAtPrice: 18, sortOrder: 2 },
  { slug: 'qb-bc-003', categorySlug: 'baby-care', name: 'Baby Cereal', nameTe: 'బేబీ సీరియల్', unit: 'gm', defaultQuantity: 300, price: 567, compareAtPrice: 600, sortOrder: 3 },                    // 567/kg
  { slug: 'qb-bc-004', categorySlug: 'baby-care', name: 'Baby Soap', nameTe: 'బేబీ సబ్బు', unit: 'gm', defaultQuantity: 75, price: 933, compareAtPrice: 1000, sortOrder: 4 },                        // 933/kg
  { slug: 'qb-bc-005', categorySlug: 'baby-care', name: 'Baby Wipes', nameTe: 'బేబీ వైప్స్', unit: 'pcs', defaultQuantity: 72, price: 4, compareAtPrice: 5, sortOrder: 5 },
  { slug: 'qb-bc-006', categorySlug: 'baby-care', name: 'Baby Shampoo', nameTe: 'బేబీ షాంపూ', unit: 'ml', defaultQuantity: 200, price: 600, compareAtPrice: 650, sortOrder: 6 },                     // 600/L
  { slug: 'qb-bc-007', categorySlug: 'baby-care', name: 'Baby Lotion', nameTe: 'బేబీ లోషన్', unit: 'ml', defaultQuantity: 200, price: 500, compareAtPrice: 550, sortOrder: 7 },                      // 500/L
  { slug: 'qb-bc-008', categorySlug: 'baby-care', name: 'Baby Oil', nameTe: 'బేబీ ఆయిల్', unit: 'ml', defaultQuantity: 200, price: 450, compareAtPrice: 500, sortOrder: 8 },                         // 450/L

  // ========== Ready to Cook (gm items per-KG, ml items per-L) ==========
  { slug: 'qb-rc-001', categorySlug: 'ready-to-cook', name: 'Instant Noodles', nameTe: 'ఇన్స్టంట్ నూడుల్స్', unit: 'gm', defaultQuantity: 280, price: 500, compareAtPrice: 500, sortOrder: 1 },       // 500/kg
  { slug: 'qb-rc-002', categorySlug: 'ready-to-cook', name: 'Pasta (Penne)', nameTe: 'పాస్తా (పెన్నె)', unit: 'gm', defaultQuantity: 500, price: 240, compareAtPrice: 260, sortOrder: 2 },              // 240/kg
  { slug: 'qb-rc-003', categorySlug: 'ready-to-cook', name: 'Tomato Ketchup', nameTe: 'టమోటో కెచప్', unit: 'gm', defaultQuantity: 500, price: 300, compareAtPrice: 320, sortOrder: 3 },                // 300/kg
  { slug: 'qb-rc-004', categorySlug: 'ready-to-cook', name: 'Soy Sauce', nameTe: 'సోయా సాస్', unit: 'ml', defaultQuantity: 200, price: 450, compareAtPrice: 500, sortOrder: 4 },                       // 450/L
  { slug: 'qb-rc-005', categorySlug: 'ready-to-cook', name: 'Mango Pickle', nameTe: 'ఆవకాయ', unit: 'gm', defaultQuantity: 500, price: 400, compareAtPrice: 420, sortOrder: 5 },                       // 400/kg
  { slug: 'qb-rc-006', categorySlug: 'ready-to-cook', name: 'Lemon Pickle', nameTe: 'నిమ్మకాయ ఊరగాయ', unit: 'gm', defaultQuantity: 300, price: 467, compareAtPrice: 500, sortOrder: 6 },              // 467/kg
  { slug: 'qb-rc-007', categorySlug: 'ready-to-cook', name: 'Ready-mix Gulab Jamun', nameTe: 'రెడీ-మిక్స్ గులాబ్ జామూన్', unit: 'gm', defaultQuantity: 200, price: 400, compareAtPrice: 450, sortOrder: 7 }, // 400/kg
  { slug: 'qb-rc-008', categorySlug: 'ready-to-cook', name: 'Ready-mix Idli', nameTe: 'రెడీ-మిక్స్ ఇడ్లీ', unit: 'gm', defaultQuantity: 500, price: 200, compareAtPrice: 220, sortOrder: 8 },         // 200/kg
  { slug: 'qb-rc-009', categorySlug: 'ready-to-cook', name: 'Vermicelli (Sevai)', nameTe: 'సేమియా', unit: 'gm', defaultQuantity: 500, price: 160, compareAtPrice: 180, sortOrder: 9 },                 // 160/kg
  { slug: 'qb-rc-010', categorySlug: 'ready-to-cook', name: 'Green Chilli Sauce', nameTe: 'పచ్చి మిరప సాస్', unit: 'ml', defaultQuantity: 200, price: 350, compareAtPrice: 380, sortOrder: 10 },       // 350/L
];

// =============================================================================
// Vijay Parcel POS — Standard, food parcel point-of-sale
// 12 categories, 59 items: ready-to-eat Andhra food + raw kitchen inventory ingredients
// =============================================================================

export const VIJAYPARCELPOS_CATEGORIES: CategorySeed[] = [
  { slug: 'chicken-items', name: 'Chicken Items', nameTe: 'చికెన్ ఐటమ్స్', icon: '🍗', sortOrder: 1 },
  { slug: 'curry-items', name: 'Curry Items', nameTe: 'కర్రీ ఐటమ్స్', icon: '🍛', sortOrder: 2 },
  { slug: 'fry-items', name: 'Fry Items', nameTe: 'ఫ్రై ఐటమ్స్', icon: '🍳', sortOrder: 3 },
  { slug: 'rice-items', name: 'Rice Items', nameTe: 'రైస్ ఐటమ్స్', icon: '🍚', sortOrder: 4 },
  { slug: 'biryani-items', name: 'Biryani Items', nameTe: 'బిర్యానీ ఐటమ్స్', icon: '🥘', sortOrder: 5 },
  { slug: 'other-items', name: 'Other Items', nameTe: 'ఇతర ఐటమ్స్', icon: '🥣', sortOrder: 6 },
  { slug: 'seafood-items', name: 'Seafood Items', nameTe: 'సీఫుడ్ ఐటమ్స్', icon: '🐟', sortOrder: 7 },
  // ========== Inventory / Kitchen Ingredient Categories ==========
  { slug: 'rice-grains', name: 'Rice & Grains', nameTe: 'బియ్యం & ధాన్యాలు', icon: '🌾', sortOrder: 8 },
  { slug: 'spices-powders', name: 'Spices & Powders', nameTe: 'సుగంధ ద్రవ్యాలు & పొడులు', icon: '🌶️', sortOrder: 9 },
  { slug: 'oils-dairy', name: 'Oils & Dairy', nameTe: 'నూనెలు & పాల ఉత్పత్తులు', icon: '🫒', sortOrder: 10 },
  { slug: 'other-cooking', name: 'Other Cooking Ingredients', nameTe: 'ఇతర వంట సామగ్రి', icon: '🧅', sortOrder: 11 },
  { slug: 'ready-mix-kitchen', name: 'Ready Mix / Kitchen Items', nameTe: 'రెడీ మిక్స్ / కిచెన్ ఐటమ్స్', icon: '🥫', sortOrder: 12 },
];

export const VIJAYPARCELPOS_ITEMS: ItemSeed[] = [
  // ========== Chicken Items ==========
  { slug: 'vp-ch-001', categorySlug: 'chicken-items', name: 'Chicken Curry', nameTe: 'చికెన్ కర్రీ', unit: 'pcs', defaultQuantity: 1, price: 180, compareAtPrice: 180, sortOrder: 1 },
  { slug: 'vp-ch-002', categorySlug: 'chicken-items', name: 'Chicken Masala', nameTe: 'చికెన్ మసాలా', unit: 'pcs', defaultQuantity: 1, price: 200, compareAtPrice: 200, sortOrder: 2 },
  { slug: 'vp-ch-003', categorySlug: 'chicken-items', name: 'Chicken Fry', nameTe: 'చికెన్ ఫ్రై', unit: 'pcs', defaultQuantity: 1, price: 200, compareAtPrice: 200, sortOrder: 3 },
  { slug: 'vp-ch-004', categorySlug: 'chicken-items', name: 'Chicken 65', nameTe: 'చికెన్ 65', unit: 'pcs', defaultQuantity: 1, price: 180, compareAtPrice: 180, sortOrder: 4 },

  // ========== Curry Items ==========
  { slug: 'vp-cu-001', categorySlug: 'curry-items', name: 'Mutton Curry', nameTe: 'మటన్ కర్రీ', unit: 'pcs', defaultQuantity: 1, price: 250, compareAtPrice: 250, sortOrder: 1 },
  { slug: 'vp-cu-002', categorySlug: 'curry-items', name: 'Egg Curry', nameTe: 'ఎగ్ కర్రీ', unit: 'pcs', defaultQuantity: 1, price: 120, compareAtPrice: 120, sortOrder: 2 },
  { slug: 'vp-cu-003', categorySlug: 'curry-items', name: 'Mixed Vegetable Curry', nameTe: 'మిక్స్డ్ వెజిటబుల్ కర్రీ', unit: 'pcs', defaultQuantity: 1, price: 130, compareAtPrice: 130, sortOrder: 3 },
  { slug: 'vp-cu-004', categorySlug: 'curry-items', name: 'Mushroom Masala', nameTe: 'మష్రూమ్ మసాలా', unit: 'pcs', defaultQuantity: 1, price: 140, compareAtPrice: 140, sortOrder: 4 },

  // ========== Fry Items ==========
  { slug: 'vp-fr-001', categorySlug: 'fry-items', name: 'Brinjal Fry', nameTe: 'వంకాయ ఫ్రై', unit: 'pcs', defaultQuantity: 1, price: 80, compareAtPrice: 80, sortOrder: 1 },
  { slug: 'vp-fr-002', categorySlug: 'fry-items', name: 'Mutton Fry', nameTe: 'మటన్ ఫ్రై', unit: 'pcs', defaultQuantity: 1, price: 280, compareAtPrice: 280, sortOrder: 2 },

  // ========== Rice Items ==========
  { slug: 'vp-ri-001', categorySlug: 'rice-items', name: 'Plain Rice', nameTe: 'ప్లెయిన్ రైస్', unit: 'pcs', defaultQuantity: 1, price: 60, compareAtPrice: 60, sortOrder: 1 },
  { slug: 'vp-ri-002', categorySlug: 'rice-items', name: 'Lemon Rice', nameTe: 'నిమ్మకాయ రైస్', unit: 'pcs', defaultQuantity: 1, price: 90, compareAtPrice: 90, sortOrder: 2 },
  { slug: 'vp-ri-003', categorySlug: 'rice-items', name: 'Tomato Rice', nameTe: 'టమాటో రైస్', unit: 'pcs', defaultQuantity: 1, price: 90, compareAtPrice: 90, sortOrder: 3 },
  { slug: 'vp-ri-004', categorySlug: 'rice-items', name: 'Vegetable Pulao', nameTe: 'వెజిటబుల్ పులావ్', unit: 'pcs', defaultQuantity: 1, price: 130, compareAtPrice: 130, sortOrder: 4 },
  { slug: 'vp-ri-005', categorySlug: 'rice-items', name: 'Curd Rice', nameTe: 'పెరుగు అన్నం', unit: 'pcs', defaultQuantity: 1, price: 80, compareAtPrice: 80, sortOrder: 5 },

  // ========== Biryani Items ==========
  { slug: 'vp-bi-001', categorySlug: 'biryani-items', name: 'Chicken Dum Biryani', nameTe: 'చికెన్ దమ్ బిర్యానీ', unit: 'pcs', defaultQuantity: 1, price: 180, compareAtPrice: 180, sortOrder: 1 },
  { slug: 'vp-bi-002', categorySlug: 'biryani-items', name: 'Chicken Fry Piece Biryani', nameTe: 'చికెన్ ఫ్రై పీస్ బిర్యానీ', unit: 'pcs', defaultQuantity: 1, price: 180, compareAtPrice: 180, sortOrder: 2 },
  { slug: 'vp-bi-003', categorySlug: 'biryani-items', name: 'Mutton Biryani', nameTe: 'మటన్ బిర్యానీ', unit: 'pcs', defaultQuantity: 1, price: 260, compareAtPrice: 260, sortOrder: 3 },
  { slug: 'vp-bi-004', categorySlug: 'biryani-items', name: 'Egg Biryani', nameTe: 'ఎగ్ బిర్యానీ', unit: 'pcs', defaultQuantity: 1, price: 140, compareAtPrice: 140, sortOrder: 4 },
  { slug: 'vp-bi-005', categorySlug: 'biryani-items', name: 'Veg Biryani', nameTe: 'వెజ్ బిర్యానీ', unit: 'pcs', defaultQuantity: 1, price: 140, compareAtPrice: 140, sortOrder: 5 },

  // ========== Other Items ==========
  { slug: 'vp-ot-001', categorySlug: 'other-items', name: 'Curd', nameTe: 'పెరుగు', unit: 'pcs', defaultQuantity: 1, price: 30, compareAtPrice: 30, sortOrder: 1 },
  { slug: 'vp-ot-002', categorySlug: 'other-items', name: 'Rasam', nameTe: 'రసం', unit: 'pcs', defaultQuantity: 1, price: 40, compareAtPrice: 40, sortOrder: 2 },
  { slug: 'vp-ot-003', categorySlug: 'other-items', name: 'Sambar', nameTe: 'సాంబార్', unit: 'pcs', defaultQuantity: 1, price: 40, compareAtPrice: 40, sortOrder: 3 },

  // ========== Seafood Items ==========
  { slug: 'vp-sf-001', categorySlug: 'seafood-items', name: 'Fish Fry', nameTe: 'చేపల ఫ్రై', unit: 'pcs', defaultQuantity: 1, price: 200, compareAtPrice: 200, sortOrder: 1 },
  { slug: 'vp-sf-002', categorySlug: 'seafood-items', name: 'Fish Pulusu (Andhra Style)', nameTe: 'చేపల పులుసు (ఆంధ్ర స్టైల్)', unit: 'pcs', defaultQuantity: 1, price: 210, compareAtPrice: 210, sortOrder: 2 },
  { slug: 'vp-sf-003', categorySlug: 'seafood-items', name: 'Prawn Curry', nameTe: 'రొయ్యల కర్రీ', unit: 'pcs', defaultQuantity: 1, price: 200, compareAtPrice: 200, sortOrder: 3 },
  { slug: 'vp-sf-004', categorySlug: 'seafood-items', name: 'Prawn Fry', nameTe: 'రొయ్యల ఫ్రై', unit: 'pcs', defaultQuantity: 1, price: 220, compareAtPrice: 220, sortOrder: 4 },
  { slug: 'vp-sf-005', categorySlug: 'seafood-items', name: 'Royyala Iguru (Andhra Prawn Curry)', nameTe: 'రొయ్యల ఇగురు (ఆంధ్ర రొయ్యల కర్రీ)', unit: 'pcs', defaultQuantity: 1, price: 250, compareAtPrice: 250, sortOrder: 5 },

  // ========== Rice & Grains (Inventory) ==========
  { slug: 'vp-rg-001', categorySlug: 'rice-grains', name: 'Raw Rice', nameTe: 'బియ్యం', unit: 'kg', defaultQuantity: 1, price: 50, compareAtPrice: 50, sortOrder: 1 },
  { slug: 'vp-rg-002', categorySlug: 'rice-grains', name: 'Basmati Rice', nameTe: 'బాస్మతి బియ్యం', unit: 'kg', defaultQuantity: 1, price: 120, compareAtPrice: 120, sortOrder: 2 },
  { slug: 'vp-rg-003', categorySlug: 'rice-grains', name: 'Toor Dal', nameTe: 'కందిపప్పు', unit: 'kg', defaultQuantity: 1, price: 130, compareAtPrice: 130, sortOrder: 3 },
  { slug: 'vp-rg-004', categorySlug: 'rice-grains', name: 'Moong Dal', nameTe: 'పెసరపప్పు', unit: 'kg', defaultQuantity: 1, price: 110, compareAtPrice: 110, sortOrder: 4 },
  { slug: 'vp-rg-005', categorySlug: 'rice-grains', name: 'Chana Dal', nameTe: 'శనగపప్పు', unit: 'kg', defaultQuantity: 1, price: 90, compareAtPrice: 90, sortOrder: 5 },

  // ========== Spices & Powders (Inventory) ==========
  { slug: 'vp-sp-001', categorySlug: 'spices-powders', name: 'Turmeric Powder', nameTe: 'పసుపు పొడి', unit: 'gm', defaultQuantity: 100, price: 30, compareAtPrice: 30, sortOrder: 1 },
  { slug: 'vp-sp-002', categorySlug: 'spices-powders', name: 'Red Chilli Powder', nameTe: 'ఎర్ర మిర్చి పొడి', unit: 'gm', defaultQuantity: 100, price: 40, compareAtPrice: 40, sortOrder: 2 },
  { slug: 'vp-sp-003', categorySlug: 'spices-powders', name: 'Coriander Powder', nameTe: 'ధనియాల పొడి', unit: 'gm', defaultQuantity: 100, price: 35, compareAtPrice: 35, sortOrder: 3 },
  { slug: 'vp-sp-004', categorySlug: 'spices-powders', name: 'Cumin Powder', nameTe: 'జీలకర్ర పొడి', unit: 'gm', defaultQuantity: 100, price: 50, compareAtPrice: 50, sortOrder: 4 },
  { slug: 'vp-sp-005', categorySlug: 'spices-powders', name: 'Garam Masala', nameTe: 'గరం మసాలా', unit: 'gm', defaultQuantity: 100, price: 60, compareAtPrice: 60, sortOrder: 5 },
  { slug: 'vp-sp-006', categorySlug: 'spices-powders', name: 'Black Pepper', nameTe: 'నల్ల మిరియాలు', unit: 'gm', defaultQuantity: 100, price: 80, compareAtPrice: 80, sortOrder: 6 },
  { slug: 'vp-sp-007', categorySlug: 'spices-powders', name: 'Mustard Seeds', nameTe: 'ఆవాలు', unit: 'gm', defaultQuantity: 100, price: 20, compareAtPrice: 20, sortOrder: 7 },
  { slug: 'vp-sp-008', categorySlug: 'spices-powders', name: 'Cumin Seeds', nameTe: 'జీలకర్ర', unit: 'gm', defaultQuantity: 100, price: 50, compareAtPrice: 50, sortOrder: 8 },
  { slug: 'vp-sp-009', categorySlug: 'spices-powders', name: 'Cloves', nameTe: 'లవంగాలు', unit: 'gm', defaultQuantity: 100, price: 120, compareAtPrice: 120, sortOrder: 9 },
  { slug: 'vp-sp-010', categorySlug: 'spices-powders', name: 'Cardamom', nameTe: 'ఏలకులు', unit: 'gm', defaultQuantity: 100, price: 200, compareAtPrice: 200, sortOrder: 10 },
  { slug: 'vp-sp-011', categorySlug: 'spices-powders', name: 'Cinnamon', nameTe: 'దాల్చిన చెక్క', unit: 'gm', defaultQuantity: 100, price: 100, compareAtPrice: 100, sortOrder: 11 },

  // ========== Oils & Dairy (Inventory) ==========
  { slug: 'vp-od-001', categorySlug: 'oils-dairy', name: 'Cooking Oil', nameTe: 'వంట నూనె', unit: 'L', defaultQuantity: 1, price: 150, compareAtPrice: 150, sortOrder: 1 },
  { slug: 'vp-od-002', categorySlug: 'oils-dairy', name: 'Ghee', nameTe: 'నెయ్యి', unit: 'kg', defaultQuantity: 1, price: 600, compareAtPrice: 600, sortOrder: 2 },
  { slug: 'vp-od-003', categorySlug: 'oils-dairy', name: 'Butter', nameTe: 'వెన్న', unit: 'gm', defaultQuantity: 500, price: 250, compareAtPrice: 250, sortOrder: 3 },

  // ========== Other Cooking Ingredients (Inventory) ==========
  { slug: 'vp-oc-001', categorySlug: 'other-cooking', name: 'Tamarind', nameTe: 'చింతపండు', unit: 'kg', defaultQuantity: 1, price: 150, compareAtPrice: 150, sortOrder: 1 },
  { slug: 'vp-oc-002', categorySlug: 'other-cooking', name: 'Cashew Nuts', nameTe: 'జీడిపప్పు', unit: 'gm', defaultQuantity: 100, price: 120, compareAtPrice: 120, sortOrder: 2 },

  // ========== Ready Mix / Kitchen Items (Inventory) ==========
  { slug: 'vp-rm-001', categorySlug: 'ready-mix-kitchen', name: 'Sambar Powder', nameTe: 'సాంబార్ పొడి', unit: 'gm', defaultQuantity: 100, price: 40, compareAtPrice: 40, sortOrder: 1 },
  { slug: 'vp-rm-002', categorySlug: 'ready-mix-kitchen', name: 'Rasam Powder', nameTe: 'రసం పొడి', unit: 'gm', defaultQuantity: 100, price: 35, compareAtPrice: 35, sortOrder: 2 },
  { slug: 'vp-rm-003', categorySlug: 'ready-mix-kitchen', name: 'Biryani Masala', nameTe: 'బిర్యానీ మసాలా', unit: 'gm', defaultQuantity: 100, price: 50, compareAtPrice: 50, sortOrder: 3 },
  { slug: 'vp-rm-004', categorySlug: 'ready-mix-kitchen', name: 'Chicken Masala', nameTe: 'చికెన్ మసాలా', unit: 'gm', defaultQuantity: 100, price: 45, compareAtPrice: 45, sortOrder: 4 },
  { slug: 'vp-rm-005', categorySlug: 'ready-mix-kitchen', name: 'Ginger Garlic Paste', nameTe: 'అల్లం వెల్లుల్లి పేస్ట్', unit: 'gm', defaultQuantity: 100, price: 30, compareAtPrice: 30, sortOrder: 5 },
];

// =============================================================================
// Tenant-specific seed data lookup
// =============================================================================

export interface TenantSeedData {
  categories: CategorySeed[];
  items: ItemSeed[];
}

const TENANT_SEED_MAP: Record<string, TenantSeedData> = {
  freshmart: { categories: FRESHMART_CATEGORIES, items: FRESHMART_ITEMS },
  quickbasket: { categories: QUICKBASKET_CATEGORIES, items: QUICKBASKET_ITEMS },
  vijayparcelpos: { categories: VIJAYPARCELPOS_CATEGORIES, items: VIJAYPARCELPOS_ITEMS },
};

/**
 * Get tenant-specific seed data by tenant slug.
 * Throws if the slug is unrecognized.
 */
export function getTenantSeedData(tenantSlug: string): TenantSeedData {
  const data = TENANT_SEED_MAP[tenantSlug];
  if (!data) {
    throw new Error(`No seed data defined for tenant slug: '${tenantSlug}'`);
  }
  return data;
}

// =============================================================================
// Backward-compatible aliases (deprecated — use tenant-specific exports)
// =============================================================================

/** @deprecated Use FRESHMART_CATEGORIES or getTenantSeedData() */
export const SEED_CATEGORIES = FRESHMART_CATEGORIES;

/** @deprecated Use FRESHMART_ITEMS or getTenantSeedData() */
export const SEED_ITEMS = FRESHMART_ITEMS;
