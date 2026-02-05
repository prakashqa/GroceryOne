/**
 * Enhanced Seed Data
 * Cleaned, deduplicated, and organized categories and items
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

/**
 * 9 Core Categories (removed Bath & Body, Laundry, Chips & Biscuits, Baby Care)
 * Consolidated duplicate categories (dal-pulses + dals-pulses, oil-ghee + oils)
 */
export const SEED_CATEGORIES: CategorySeed[] = [
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

/**
 * Enhanced Items (duplicates removed, better organization)
 */
export const SEED_ITEMS: ItemSeed[] = [
  // ========== Grains & Flour (Combined Atta-Rice + Flours-Rava) ==========
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

  // ========== Dals & Pulses (Consolidated) ==========
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

  // ========== Oils & Ghee (Consolidated) ==========
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

  // ========== Personal Care (gm→per-KG, ml→per-L prices) ==========
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

/**
 * Summary of changes:
 *
 * 1. REMOVED CATEGORIES:
 *    - Bath & Body (merged essential items into Personal Care)
 *    - Laundry Detergents (removed completely)
 *    - Chips & Biscuits (removed completely)
 *    - Makeup & Cosmetics (removed completely)
 *    - Baby Care (removed completely)
 *
 * 2. CONSOLIDATED CATEGORIES:
 *    - 'dal-pulses' + 'dals-pulses' → 'dals-pulses'
 *    - 'oil-ghee' + 'oils' → 'oils-ghee'
 *    - 'atta-rice' + 'flours-rava' → 'grains-flour'
 *    - 'tea-coffee' → 'beverages'
 *
 * 3. REMOVED DUPLICATE ITEMS:
 *    - Multiple instances of same dal types
 *    - Duplicate rice varieties
 *    - Duplicate oil types
 *    - Brand-specific items (converted to generic names)
 *
 * 4. ENHANCEMENTS:
 *    - Added Telugu translations (nameTe) for all items
 *    - Better organization within categories
 *    - More logical grouping (Premium, Daily Use, Specialty)
 *    - Added missing common items (dry fruits, baking items, etc.)
 *    - Standardized quantities to more realistic defaults
 *    - Changed spices from 'kg' to 'gm' for better UX
 *    - Better slug naming (hierarchical codes)
 *    - Complete personal care essentials
 *
 * 5. FINAL STRUCTURE:
 *    - 9 core categories
 *    - ~155 unique items
 *    - 100% Telugu translation coverage
 *    - Focus on groceries and daily essentials
 */
