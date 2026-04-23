/**
 * Predefined grocery categories for seeding
 */

export interface CategorySeed {
  name: string;
  nameTe: string;
  slug: string;
  description?: string;
  descriptionTe?: string;
  subcategories?: CategorySeed[];
}

export const GROCERY_CATEGORIES: CategorySeed[] = [
  {
    name: 'Dal & Pulses',
    nameTe: 'పప్పులు & కాయధాన్యాలు',
    slug: 'dal-pulses',
    description: 'Protein-rich lentils and pulses',
    descriptionTe: 'ప్రోటీన్ అధికంగా ఉన్న పప్పులు మరియు కాయధాన్యాలు',
    subcategories: [
      {
        name: 'Toor Dal',
        nameTe: 'కందిపప్పు',
        slug: 'toor-dal',
      },
      {
        name: 'Chana Dal',
        nameTe: 'శనగపప్పు',
        slug: 'chana-dal',
      },
      {
        name: 'Moong Dal',
        nameTe: 'పెసరపప్పు',
        slug: 'moong-dal',
      },
      {
        name: 'Urad Dal',
        nameTe: 'మినపప్పు',
        slug: 'urad-dal',
      },
      {
        name: 'Masoor Dal',
        nameTe: 'మసూర్ పప్పు',
        slug: 'masoor-dal',
      },
      {
        name: 'Rajma',
        nameTe: 'రాజ్మా',
        slug: 'rajma',
      },
      {
        name: 'Kabuli Chana',
        nameTe: 'కాబులీ చనా',
        slug: 'kabuli-chana',
      },
      {
        name: 'Soya',
        nameTe: 'సోయా',
        slug: 'soya',
      },
    ],
  },
  {
    name: 'Rice & Grains',
    nameTe: 'బియ్యం & ధాన్యాలు',
    slug: 'rice-grains',
    description: 'Premium rice varieties and grains',
    descriptionTe: 'ప్రీమియం బియ్యం రకాలు మరియు ధాన్యాలు',
    subcategories: [
      {
        name: 'Basmati Rice',
        nameTe: 'బాస్మతి బియ్యం',
        slug: 'basmati-rice',
      },
      {
        name: 'Sona Masoori',
        nameTe: 'సోనా మసూరి',
        slug: 'sona-masoori',
      },
      {
        name: 'Wheat',
        nameTe: 'గోధుమలు',
        slug: 'wheat',
      },
      {
        name: 'Millets',
        nameTe: 'చిరుధాన్యాలు',
        slug: 'millets',
      },
      {
        name: 'Poha',
        nameTe: 'అటుకులు',
        slug: 'poha',
      },
    ],
  },
  {
    name: 'Cooking Oil & Ghee',
    nameTe: 'వంట నూనె & నెయ్యి',
    slug: 'cooking-oil-ghee',
    description: 'Pure cooking oils and ghee',
    descriptionTe: 'స్వచ్ఛమైన వంట నూనెలు మరియు నెయ్యి',
    subcategories: [
      {
        name: 'Sunflower Oil',
        nameTe: 'సన్‌ఫ్లవర్ నూనె',
        slug: 'sunflower-oil',
      },
      {
        name: 'Groundnut Oil',
        nameTe: 'వేరుశెనగ నూనె',
        slug: 'groundnut-oil',
      },
      {
        name: 'Coconut Oil',
        nameTe: 'కొబ్బరి నూనె',
        slug: 'coconut-oil',
      },
      {
        name: 'Mustard Oil',
        nameTe: 'ఆవ నూనె',
        slug: 'mustard-oil',
      },
      {
        name: 'Ghee',
        nameTe: 'నెయ్యి',
        slug: 'ghee',
      },
    ],
  },
  {
    name: 'Flours & Atta',
    nameTe: 'పిండి & ఆటా',
    slug: 'flours-atta',
    description: 'Fresh flours for daily cooking',
    descriptionTe: 'రోజువారీ వంటకు తాజా పిండి',
    subcategories: [
      {
        name: 'Wheat Flour (Atta)',
        nameTe: 'గోధుమ పిండి (ఆటా)',
        slug: 'wheat-flour',
      },
      {
        name: 'Rice Flour',
        nameTe: 'బియ్యం పిండి',
        slug: 'rice-flour',
      },
      {
        name: 'Besan',
        nameTe: 'శనగ పిండి',
        slug: 'besan',
      },
      {
        name: 'Rawa/Sooji',
        nameTe: 'రవ్వ',
        slug: 'rawa-sooji',
      },
      {
        name: 'Maida',
        nameTe: 'మైదా',
        slug: 'maida',
      },
    ],
  },
  {
    name: 'Snacks & Namkeen',
    nameTe: 'స్నాక్స్ & నంకీన్',
    slug: 'snacks-namkeen',
    description: 'Tasty snacks and namkeen',
    descriptionTe: 'రుచికరమైన స్నాక్స్ మరియు నంకీన్',
    subcategories: [
      {
        name: 'Chips',
        nameTe: 'చిప్స్',
        slug: 'chips',
      },
      {
        name: 'Namkeen',
        nameTe: 'నంకీన్',
        slug: 'namkeen',
      },
      {
        name: 'Biscuits',
        nameTe: 'బిస్కెట్లు',
        slug: 'biscuits',
      },
      {
        name: 'Cookies',
        nameTe: 'కుకీస్',
        slug: 'cookies',
      },
    ],
  },
  {
    name: 'Dairy & Eggs',
    nameTe: 'పాల ఉత్పత్తులు & గుడ్లు',
    slug: 'dairy-eggs',
    description: 'Fresh dairy products and eggs',
    descriptionTe: 'తాజా పాల ఉత్పత్తులు మరియు గుడ్లు',
    subcategories: [
      {
        name: 'Milk',
        nameTe: 'పాలు',
        slug: 'milk',
      },
      {
        name: 'Curd & Yogurt',
        nameTe: 'పెరుగు',
        slug: 'curd-yogurt',
      },
      {
        name: 'Paneer',
        nameTe: 'పన్నీర్',
        slug: 'paneer',
      },
      {
        name: 'Cheese',
        nameTe: 'చీజ్',
        slug: 'cheese',
      },
      {
        name: 'Eggs',
        nameTe: 'గుడ్లు',
        slug: 'eggs',
      },
      {
        name: 'Butter',
        nameTe: 'వెన్న',
        slug: 'butter',
      },
    ],
  },
  {
    name: 'Fruits & Vegetables',
    nameTe: 'పండ్లు & కూరగాయలు',
    slug: 'fruits-vegetables',
    description: 'Farm fresh fruits and vegetables',
    descriptionTe: 'తాజా పండ్లు మరియు కూరగాయలు',
    subcategories: [
      {
        name: 'Fresh Vegetables',
        nameTe: 'తాజా కూరగాయలు',
        slug: 'fresh-vegetables',
      },
      {
        name: 'Fresh Fruits',
        nameTe: 'తాజా పండ్లు',
        slug: 'fresh-fruits',
      },
      {
        name: 'Leafy Greens',
        nameTe: 'ఆకుకూరలు',
        slug: 'leafy-greens',
      },
      {
        name: 'Exotic Vegetables',
        nameTe: 'అరుదైన కూరగాయలు',
        slug: 'exotic-vegetables',
      },
      {
        name: 'Exotic Fruits',
        nameTe: 'అరుదైన పండ్లు',
        slug: 'exotic-fruits',
      },
    ],
  },
  {
    name: 'Beverages',
    nameTe: 'పానీయాలు',
    slug: 'beverages',
    description: 'Refreshing beverages for every taste',
    descriptionTe: 'ప్రతి రుచికి తాజా పానీయాలు',
    subcategories: [
      {
        name: 'Tea',
        nameTe: 'టీ',
        slug: 'tea',
      },
      {
        name: 'Coffee',
        nameTe: 'కాఫీ',
        slug: 'coffee',
      },
      {
        name: 'Soft Drinks',
        nameTe: 'సాఫ్ట్ డ్రింక్స్',
        slug: 'soft-drinks',
      },
      {
        name: 'Juices',
        nameTe: 'జ్యూస్‌లు',
        slug: 'juices',
      },
      {
        name: 'Health Drinks',
        nameTe: 'ఆరోగ్య పానీయాలు',
        slug: 'health-drinks',
      },
    ],
  },
  {
    name: 'Personal Care',
    nameTe: 'వ్యక్తిగత సంరక్షణ',
    slug: 'personal-care',
    description: 'Personal care and hygiene products',
    descriptionTe: 'వ్యక్తిగత సంరక్షణ మరియు పరిశుభ్రత ఉత్పత్తులు',
    subcategories: [
      {
        name: 'Soaps & Body Wash',
        nameTe: 'సబ్బులు & బాడీ వాష్',
        slug: 'soaps-body-wash',
      },
      {
        name: 'Hair Care',
        nameTe: 'జుట్టు సంరక్షణ',
        slug: 'hair-care',
      },
      {
        name: 'Oral Care',
        nameTe: 'నోటి సంరక్షణ',
        slug: 'oral-care',
      },
      {
        name: 'Skin Care',
        nameTe: 'చర్మ సంరక్షణ',
        slug: 'skin-care',
      },
    ],
  },
  {
    name: 'Household',
    nameTe: 'గృహ అవసరాలు',
    slug: 'household',
    description: 'Household cleaning and essentials',
    descriptionTe: 'గృహ శుభ్రపరచడం మరియు అవసరాలు',
    subcategories: [
      {
        name: 'Cleaning Supplies',
        nameTe: 'శుభ్రపరచే సామాగ్రి',
        slug: 'cleaning-supplies',
      },
      {
        name: 'Laundry Detergents',
        nameTe: 'బట్టలు ఉతికే సబ్బులు',
        slug: 'laundry-detergents',
      },
      {
        name: 'Kitchen Essentials',
        nameTe: 'వంటగది అవసరాలు',
        slug: 'kitchen-essentials',
      },
      {
        name: 'Fresheners',
        nameTe: 'ఫ్రెషనర్లు',
        slug: 'fresheners',
      },
    ],
  },
  {
    name: 'Baby Care',
    nameTe: 'బేబీ కేర్',
    slug: 'baby-care',
    description: 'Baby care essentials',
    descriptionTe: 'బేబీ కేర్ అవసరాలు',
    subcategories: [
      {
        name: 'Diapers',
        nameTe: 'డైపర్లు',
        slug: 'diapers',
      },
      {
        name: 'Baby Food',
        nameTe: 'బేబీ ఫుడ్',
        slug: 'baby-food',
      },
      {
        name: 'Baby Skin Care',
        nameTe: 'బేబీ స్కిన్ కేర్',
        slug: 'baby-skin-care',
      },
    ],
  },
];

export const SPECIAL_CATEGORIES = [
  {
    name: 'Past Purchases',
    nameTe: 'గత కొనుగోళ్లు',
    slug: 'past-purchases',
    description: 'Your previously purchased items',
    descriptionTe: 'మీరు గతంలో కొన్న వస్తువులు',
  },
  {
    name: 'Deals',
    nameTe: 'ఆఫర్లు',
    slug: 'deals',
    description: 'Best deals and discounts',
    descriptionTe: 'అత్యుత్తమ డీల్స్ మరియు తగ్గింపులు',
  },
];
