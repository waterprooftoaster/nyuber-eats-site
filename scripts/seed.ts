import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env.local without requiring dotenv
try {
  const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
} catch {
  // .env.local not found — assume env vars are already exported
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const SCHOOL = { name: 'New York University', slug: 'nyu' }

interface OptionData {
  name: string
  additional_price_cents: number
  is_default: boolean
  sort_order: number
}

interface OptionGroupData {
  name: string
  selection_type: 'single' | 'multiple'
  is_required: boolean
  sort_order: number
  options: OptionData[]
}

interface MenuItemData {
  name: string
  group: string
  original_price_cents: number
  market_price_cents: number | null
  image_url: string
  option_groups: OptionGroupData[]
}

interface EateryData {
  name: string
  address: string
  image_url: string
  groups: string[]
  menu_items: MenuItemData[]
}

const EATERIES: EateryData[] = [
  {
    name: "Joe's Pizza",
    address: '7 Carmine St, New York, NY 10014',
    image_url: 'https://picsum.photos/seed/joes-pizza/1200/500',
    groups: ['Pizzas', 'Calzones & Rolls', 'Pasta', 'Sides', 'Salads', 'Drinks', 'Desserts'],
    menu_items: [
      // ── Pizzas ──────────────────────────────────────────────
      {
        name: 'Cheese Pizza',
        group: 'Pizzas',
        original_price_cents: 1100,
        market_price_cents: 900,
        image_url: 'https://picsum.photos/seed/cheese-pizza/400/400',
        option_groups: [
          {
            name: 'Size',
            selection_type: 'single',
            is_required: true,
            sort_order: 0,
            options: [
              { name: 'Slice', additional_price_cents: 0, is_default: true, sort_order: 0 },
              { name: 'Whole Pie (18")', additional_price_cents: 1400, is_default: false, sort_order: 1 },
            ],
          },
          {
            name: 'Extra Toppings',
            selection_type: 'multiple',
            is_required: false,
            sort_order: 1,
            options: [
              { name: 'Extra Cheese', additional_price_cents: 150, is_default: false, sort_order: 0 },
              { name: 'Garlic', additional_price_cents: 50, is_default: false, sort_order: 1 },
              { name: 'Oregano', additional_price_cents: 0, is_default: false, sort_order: 2 },
              { name: 'Chili Flakes', additional_price_cents: 0, is_default: false, sort_order: 3 },
            ],
          },
        ],
      },
      {
        name: 'Margherita Pizza',
        group: 'Pizzas',
        original_price_cents: 1200,
        market_price_cents: 1000,
        image_url: 'https://picsum.photos/seed/margherita/400/400',
        option_groups: [
          {
            name: 'Size',
            selection_type: 'single',
            is_required: true,
            sort_order: 0,
            options: [
              { name: 'Slice', additional_price_cents: 0, is_default: true, sort_order: 0 },
              { name: 'Whole Pie (18")', additional_price_cents: 1500, is_default: false, sort_order: 1 },
            ],
          },
          {
            name: 'Extra Toppings',
            selection_type: 'multiple',
            is_required: false,
            sort_order: 1,
            options: [
              { name: 'Extra Mozzarella', additional_price_cents: 200, is_default: false, sort_order: 0 },
              { name: 'Fresh Basil', additional_price_cents: 50, is_default: false, sort_order: 1 },
              { name: 'Chili Flakes', additional_price_cents: 0, is_default: false, sort_order: 2 },
            ],
          },
        ],
      },
      {
        name: 'Pepperoni Pizza',
        group: 'Pizzas',
        original_price_cents: 1400,
        market_price_cents: null,
        image_url: 'https://picsum.photos/seed/pepperoni/400/400',
        option_groups: [
          {
            name: 'Size',
            selection_type: 'single',
            is_required: true,
            sort_order: 0,
            options: [
              { name: 'Slice', additional_price_cents: 0, is_default: true, sort_order: 0 },
              { name: 'Whole Pie (18")', additional_price_cents: 1600, is_default: false, sort_order: 1 },
            ],
          },
        ],
      },
      {
        name: 'Sausage Pizza',
        group: 'Pizzas',
        original_price_cents: 1400,
        market_price_cents: 1150,
        image_url: 'https://picsum.photos/seed/sausage-pizza/400/400',
        option_groups: [
          {
            name: 'Size',
            selection_type: 'single',
            is_required: true,
            sort_order: 0,
            options: [
              { name: 'Slice', additional_price_cents: 0, is_default: true, sort_order: 0 },
              { name: 'Whole Pie (18")', additional_price_cents: 1600, is_default: false, sort_order: 1 },
            ],
          },
        ],
      },
      {
        name: 'White Pizza',
        group: 'Pizzas',
        original_price_cents: 1300,
        market_price_cents: 1050,
        image_url: 'https://picsum.photos/seed/white-pizza/400/400',
        option_groups: [
          {
            name: 'Size',
            selection_type: 'single',
            is_required: true,
            sort_order: 0,
            options: [
              { name: 'Slice', additional_price_cents: 0, is_default: true, sort_order: 0 },
              { name: 'Whole Pie (18")', additional_price_cents: 1500, is_default: false, sort_order: 1 },
            ],
          },
          {
            name: 'Extra Toppings',
            selection_type: 'multiple',
            is_required: false,
            sort_order: 1,
            options: [
              { name: 'Spinach', additional_price_cents: 100, is_default: false, sort_order: 0 },
              { name: 'Roasted Garlic', additional_price_cents: 75, is_default: false, sort_order: 1 },
              { name: 'Sun-Dried Tomato', additional_price_cents: 100, is_default: false, sort_order: 2 },
            ],
          },
        ],
      },
      {
        name: 'Veggie Pizza',
        group: 'Pizzas',
        original_price_cents: 1350,
        market_price_cents: null,
        image_url: 'https://picsum.photos/seed/veggie-pizza/400/400',
        option_groups: [
          {
            name: 'Size',
            selection_type: 'single',
            is_required: true,
            sort_order: 0,
            options: [
              { name: 'Slice', additional_price_cents: 0, is_default: true, sort_order: 0 },
              { name: 'Whole Pie (18")', additional_price_cents: 1550, is_default: false, sort_order: 1 },
            ],
          },
        ],
      },
      {
        name: 'Sicilian Pizza',
        group: 'Pizzas',
        original_price_cents: 1500,
        market_price_cents: 1250,
        image_url: 'https://picsum.photos/seed/sicilian-pizza/400/400',
        option_groups: [
          {
            name: 'Size',
            selection_type: 'single',
            is_required: true,
            sort_order: 0,
            options: [
              { name: 'Slice', additional_price_cents: 0, is_default: true, sort_order: 0 },
              { name: 'Whole Pie', additional_price_cents: 1800, is_default: false, sort_order: 1 },
            ],
          },
        ],
      },
      {
        name: 'Hawaiian Pizza',
        group: 'Pizzas',
        original_price_cents: 1400,
        market_price_cents: null,
        image_url: 'https://picsum.photos/seed/hawaiian-pizza/400/400',
        option_groups: [
          {
            name: 'Size',
            selection_type: 'single',
            is_required: true,
            sort_order: 0,
            options: [
              { name: 'Slice', additional_price_cents: 0, is_default: true, sort_order: 0 },
              { name: 'Whole Pie (18")', additional_price_cents: 1600, is_default: false, sort_order: 1 },
            ],
          },
        ],
      },
      {
        name: 'BBQ Chicken Pizza',
        group: 'Pizzas',
        original_price_cents: 1500,
        market_price_cents: 1250,
        image_url: 'https://picsum.photos/seed/bbq-chicken-pizza/400/400',
        option_groups: [
          {
            name: 'Size',
            selection_type: 'single',
            is_required: true,
            sort_order: 0,
            options: [
              { name: 'Slice', additional_price_cents: 0, is_default: true, sort_order: 0 },
              { name: 'Whole Pie (18")', additional_price_cents: 1700, is_default: false, sort_order: 1 },
            ],
          },
        ],
      },
      {
        name: 'Buffalo Chicken Pizza',
        group: 'Pizzas',
        original_price_cents: 1500,
        market_price_cents: null,
        image_url: 'https://picsum.photos/seed/buffalo-chicken-pizza/400/400',
        option_groups: [
          {
            name: 'Size',
            selection_type: 'single',
            is_required: true,
            sort_order: 0,
            options: [
              { name: 'Slice', additional_price_cents: 0, is_default: true, sort_order: 0 },
              { name: 'Whole Pie (18")', additional_price_cents: 1700, is_default: false, sort_order: 1 },
            ],
          },
        ],
      },
      {
        name: 'Meat Lovers Pizza',
        group: 'Pizzas',
        original_price_cents: 1600,
        market_price_cents: 1350,
        image_url: 'https://picsum.photos/seed/meat-lovers-pizza/400/400',
        option_groups: [
          {
            name: 'Size',
            selection_type: 'single',
            is_required: true,
            sort_order: 0,
            options: [
              { name: 'Slice', additional_price_cents: 0, is_default: true, sort_order: 0 },
              { name: 'Whole Pie (18")', additional_price_cents: 1800, is_default: false, sort_order: 1 },
            ],
          },
        ],
      },
      {
        name: 'Fresh Mozzarella Pizza',
        group: 'Pizzas',
        original_price_cents: 1350,
        market_price_cents: 1100,
        image_url: 'https://picsum.photos/seed/fresh-mozz-pizza/400/400',
        option_groups: [
          {
            name: 'Size',
            selection_type: 'single',
            is_required: true,
            sort_order: 0,
            options: [
              { name: 'Slice', additional_price_cents: 0, is_default: true, sort_order: 0 },
              { name: 'Whole Pie (18")', additional_price_cents: 1500, is_default: false, sort_order: 1 },
            ],
          },
        ],
      },
      {
        name: 'Grandma Pizza',
        group: 'Pizzas',
        original_price_cents: 1450,
        market_price_cents: null,
        image_url: 'https://picsum.photos/seed/grandma-pizza/400/400',
        option_groups: [
          {
            name: 'Size',
            selection_type: 'single',
            is_required: true,
            sort_order: 0,
            options: [
              { name: 'Slice', additional_price_cents: 0, is_default: true, sort_order: 0 },
              { name: 'Whole Pie', additional_price_cents: 1700, is_default: false, sort_order: 1 },
            ],
          },
        ],
      },

      // ── Calzones & Rolls ───────────────────────────────────
      {
        name: 'Cheese Calzone',
        group: 'Calzones & Rolls',
        original_price_cents: 1000,
        market_price_cents: 800,
        image_url: 'https://picsum.photos/seed/cheese-calzone/400/400',
        option_groups: [
          {
            name: 'Add Fillings',
            selection_type: 'multiple',
            is_required: false,
            sort_order: 0,
            options: [
              { name: 'Pepperoni', additional_price_cents: 150, is_default: false, sort_order: 0 },
              { name: 'Sausage', additional_price_cents: 150, is_default: false, sort_order: 1 },
              { name: 'Mushroom', additional_price_cents: 100, is_default: false, sort_order: 2 },
              { name: 'Spinach', additional_price_cents: 100, is_default: false, sort_order: 3 },
              { name: 'Ham', additional_price_cents: 150, is_default: false, sort_order: 4 },
            ],
          },
        ],
      },
      {
        name: 'Pepperoni Roll',
        group: 'Calzones & Rolls',
        original_price_cents: 750,
        market_price_cents: null,
        image_url: 'https://picsum.photos/seed/pepperoni-roll/400/400',
        option_groups: [],
      },
      {
        name: 'Sausage Roll',
        group: 'Calzones & Rolls',
        original_price_cents: 750,
        market_price_cents: 600,
        image_url: 'https://picsum.photos/seed/sausage-roll/400/400',
        option_groups: [],
      },
      {
        name: 'Spinach & Cheese Roll',
        group: 'Calzones & Rolls',
        original_price_cents: 800,
        market_price_cents: null,
        image_url: 'https://picsum.photos/seed/spinach-roll/400/400',
        option_groups: [],
      },

      // ── Pasta ───────────────────────────────────────────────
      {
        name: 'Penne Vodka',
        group: 'Pasta',
        original_price_cents: 1200,
        market_price_cents: 1000,
        image_url: 'https://picsum.photos/seed/penne-vodka/400/400',
        option_groups: [
          {
            name: 'Add Protein',
            selection_type: 'single',
            is_required: false,
            sort_order: 0,
            options: [
              { name: 'Grilled Chicken', additional_price_cents: 300, is_default: false, sort_order: 0 },
              { name: 'Meatballs (2)', additional_price_cents: 350, is_default: false, sort_order: 1 },
              { name: 'Sausage', additional_price_cents: 300, is_default: false, sort_order: 2 },
            ],
          },
        ],
      },
      {
        name: 'Baked Ziti',
        group: 'Pasta',
        original_price_cents: 1200,
        market_price_cents: null,
        image_url: 'https://picsum.photos/seed/baked-ziti/400/400',
        option_groups: [
          {
            name: 'Add Protein',
            selection_type: 'single',
            is_required: false,
            sort_order: 0,
            options: [
              { name: 'Grilled Chicken', additional_price_cents: 300, is_default: false, sort_order: 0 },
              { name: 'Meatballs (2)', additional_price_cents: 350, is_default: false, sort_order: 1 },
            ],
          },
        ],
      },
      {
        name: 'Spaghetti & Meatballs',
        group: 'Pasta',
        original_price_cents: 1300,
        market_price_cents: 1100,
        image_url: 'https://picsum.photos/seed/spaghetti-meatballs/400/400',
        option_groups: [],
      },
      {
        name: 'Chicken Parm Hero',
        group: 'Pasta',
        original_price_cents: 1400,
        market_price_cents: null,
        image_url: 'https://picsum.photos/seed/chicken-parm/400/400',
        option_groups: [
          {
            name: 'Size',
            selection_type: 'single',
            is_required: true,
            sort_order: 0,
            options: [
              { name: 'Half', additional_price_cents: 0, is_default: true, sort_order: 0 },
              { name: 'Whole', additional_price_cents: 400, is_default: false, sort_order: 1 },
            ],
          },
        ],
      },

      // ── Sides ───────────────────────────────────────────────
      {
        name: 'Garlic Knots (6)',
        group: 'Sides',
        original_price_cents: 450,
        market_price_cents: 350,
        image_url: 'https://picsum.photos/seed/garlic-knots/400/400',
        option_groups: [],
      },
      {
        name: 'Garlic Bread',
        group: 'Sides',
        original_price_cents: 400,
        market_price_cents: null,
        image_url: 'https://picsum.photos/seed/garlic-bread/400/400',
        option_groups: [
          {
            name: 'Add Cheese',
            selection_type: 'single',
            is_required: false,
            sort_order: 0,
            options: [
              { name: 'With Mozzarella', additional_price_cents: 200, is_default: false, sort_order: 0 },
            ],
          },
        ],
      },
      {
        name: 'Mozzarella Sticks (6)',
        group: 'Sides',
        original_price_cents: 800,
        market_price_cents: 650,
        image_url: 'https://picsum.photos/seed/mozz-sticks/400/400',
        option_groups: [],
      },
      {
        name: 'Chicken Wings (10)',
        group: 'Sides',
        original_price_cents: 1200,
        market_price_cents: null,
        image_url: 'https://picsum.photos/seed/chicken-wings/400/400',
        option_groups: [
          {
            name: 'Sauce',
            selection_type: 'single',
            is_required: true,
            sort_order: 0,
            options: [
              { name: 'Plain', additional_price_cents: 0, is_default: true, sort_order: 0 },
              { name: 'Buffalo', additional_price_cents: 0, is_default: false, sort_order: 1 },
              { name: 'BBQ', additional_price_cents: 0, is_default: false, sort_order: 2 },
              { name: 'Honey Garlic', additional_price_cents: 0, is_default: false, sort_order: 3 },
            ],
          },
        ],
      },
      {
        name: 'French Fries',
        group: 'Sides',
        original_price_cents: 500,
        market_price_cents: 400,
        image_url: 'https://picsum.photos/seed/french-fries/400/400',
        option_groups: [
          {
            name: 'Size',
            selection_type: 'single',
            is_required: true,
            sort_order: 0,
            options: [
              { name: 'Regular', additional_price_cents: 0, is_default: true, sort_order: 0 },
              { name: 'Large', additional_price_cents: 200, is_default: false, sort_order: 1 },
            ],
          },
        ],
      },
      {
        name: 'Onion Rings',
        group: 'Sides',
        original_price_cents: 600,
        market_price_cents: null,
        image_url: 'https://picsum.photos/seed/onion-rings/400/400',
        option_groups: [],
      },
      {
        name: 'Fried Calamari',
        group: 'Sides',
        original_price_cents: 1100,
        market_price_cents: 900,
        image_url: 'https://picsum.photos/seed/fried-calamari/400/400',
        option_groups: [],
      },

      // ── Salads ──────────────────────────────────────────────
      {
        name: 'Caesar Salad',
        group: 'Salads',
        original_price_cents: 800,
        market_price_cents: 650,
        image_url: 'https://picsum.photos/seed/caesar-salad/400/400',
        option_groups: [
          {
            name: 'Add Protein',
            selection_type: 'single',
            is_required: false,
            sort_order: 0,
            options: [
              { name: 'Grilled Chicken', additional_price_cents: 300, is_default: false, sort_order: 0 },
              { name: 'Shrimp', additional_price_cents: 400, is_default: false, sort_order: 1 },
            ],
          },
        ],
      },
      {
        name: 'Garden Salad',
        group: 'Salads',
        original_price_cents: 700,
        market_price_cents: null,
        image_url: 'https://picsum.photos/seed/garden-salad/400/400',
        option_groups: [
          {
            name: 'Dressing',
            selection_type: 'single',
            is_required: true,
            sort_order: 0,
            options: [
              { name: 'Italian', additional_price_cents: 0, is_default: true, sort_order: 0 },
              { name: 'Ranch', additional_price_cents: 0, is_default: false, sort_order: 1 },
              { name: 'Balsamic Vinaigrette', additional_price_cents: 0, is_default: false, sort_order: 2 },
              { name: 'Blue Cheese', additional_price_cents: 0, is_default: false, sort_order: 3 },
            ],
          },
        ],
      },
      {
        name: 'Antipasto Salad',
        group: 'Salads',
        original_price_cents: 1100,
        market_price_cents: 900,
        image_url: 'https://picsum.photos/seed/antipasto-salad/400/400',
        option_groups: [],
      },

      // ── Drinks ──────────────────────────────────────────────
      {
        name: 'Fountain Soda',
        group: 'Drinks',
        original_price_cents: 250,
        market_price_cents: null,
        image_url: 'https://picsum.photos/seed/fountain-soda/400/400',
        option_groups: [
          {
            name: 'Flavor',
            selection_type: 'single',
            is_required: true,
            sort_order: 0,
            options: [
              { name: 'Coca-Cola', additional_price_cents: 0, is_default: true, sort_order: 0 },
              { name: 'Diet Coke', additional_price_cents: 0, is_default: false, sort_order: 1 },
              { name: 'Sprite', additional_price_cents: 0, is_default: false, sort_order: 2 },
              { name: 'Ginger Ale', additional_price_cents: 0, is_default: false, sort_order: 3 },
            ],
          },
          {
            name: 'Size',
            selection_type: 'single',
            is_required: true,
            sort_order: 1,
            options: [
              { name: 'Small', additional_price_cents: 0, is_default: true, sort_order: 0 },
              { name: 'Large', additional_price_cents: 100, is_default: false, sort_order: 1 },
            ],
          },
        ],
      },
      {
        name: 'Bottled Water',
        group: 'Drinks',
        original_price_cents: 200,
        market_price_cents: null,
        image_url: 'https://picsum.photos/seed/bottled-water/400/400',
        option_groups: [],
      },
      {
        name: 'Snapple',
        group: 'Drinks',
        original_price_cents: 300,
        market_price_cents: null,
        image_url: 'https://picsum.photos/seed/snapple/400/400',
        option_groups: [
          {
            name: 'Flavor',
            selection_type: 'single',
            is_required: true,
            sort_order: 0,
            options: [
              { name: 'Peach Tea', additional_price_cents: 0, is_default: true, sort_order: 0 },
              { name: 'Lemon Tea', additional_price_cents: 0, is_default: false, sort_order: 1 },
              { name: 'Apple', additional_price_cents: 0, is_default: false, sort_order: 2 },
              { name: 'Fruit Punch', additional_price_cents: 0, is_default: false, sort_order: 3 },
            ],
          },
        ],
      },
      {
        name: 'Italian Espresso',
        group: 'Drinks',
        original_price_cents: 350,
        market_price_cents: null,
        image_url: 'https://picsum.photos/seed/espresso/400/400',
        option_groups: [],
      },

      // ── Desserts ────────────────────────────────────────────
      {
        name: 'Tiramisu',
        group: 'Desserts',
        original_price_cents: 700,
        market_price_cents: 550,
        image_url: 'https://picsum.photos/seed/tiramisu/400/400',
        option_groups: [],
      },
      {
        name: 'Cannoli',
        group: 'Desserts',
        original_price_cents: 500,
        market_price_cents: 400,
        image_url: 'https://picsum.photos/seed/cannoli/400/400',
        option_groups: [
          {
            name: 'Type',
            selection_type: 'single',
            is_required: true,
            sort_order: 0,
            options: [
              { name: 'Classic Ricotta', additional_price_cents: 0, is_default: true, sort_order: 0 },
              { name: 'Chocolate Chip', additional_price_cents: 50, is_default: false, sort_order: 1 },
              { name: 'Pistachio', additional_price_cents: 75, is_default: false, sort_order: 2 },
            ],
          },
        ],
      },
      {
        name: 'New York Cheesecake',
        group: 'Desserts',
        original_price_cents: 650,
        market_price_cents: null,
        image_url: 'https://picsum.photos/seed/cheesecake/400/400',
        option_groups: [],
      },
      {
        name: 'Zeppole (6)',
        group: 'Desserts',
        original_price_cents: 600,
        market_price_cents: 500,
        image_url: 'https://picsum.photos/seed/zeppole/400/400',
        option_groups: [
          {
            name: 'Topping',
            selection_type: 'single',
            is_required: true,
            sort_order: 0,
            options: [
              { name: 'Powdered Sugar', additional_price_cents: 0, is_default: true, sort_order: 0 },
              { name: 'Cinnamon Sugar', additional_price_cents: 0, is_default: false, sort_order: 1 },
              { name: 'Nutella Drizzle', additional_price_cents: 100, is_default: false, sort_order: 2 },
            ],
          },
        ],
      },
    ],
  },
]

async function seed() {
  // Upsert school
  const { data: school, error: schoolError } = await supabase
    .from('schools')
    .upsert(SCHOOL, { onConflict: 'slug' })
    .select('id')
    .single()

  if (schoolError || !school) {
    console.error('Error upserting school:', schoolError)
    process.exit(1)
  }
  console.log(`School "${SCHOOL.name}" ready (id: ${school.id})`)

  for (const eateryData of EATERIES) {
    // Upsert eatery (by name + school_id, with image_url)
    const { data: existing } = await supabase
      .from('eateries')
      .select('id')
      .eq('school_id', school.id)
      .eq('name', eateryData.name)
      .maybeSingle()

    let eateryId: string

    if (existing) {
      // Update image_url on existing eatery
      const { error } = await supabase
        .from('eateries')
        .update({ image_url: eateryData.image_url })
        .eq('id', existing.id)
      if (error) {
        console.error(`Error updating eatery "${eateryData.name}":`, error)
        process.exit(1)
      }
      eateryId = existing.id
      console.log(`Eatery "${eateryData.name}" updated (id: ${eateryId})`)
    } else {
      const { data: inserted, error } = await supabase
        .from('eateries')
        .insert({
          name: eateryData.name,
          address: eateryData.address,
          image_url: eateryData.image_url,
          school_id: school.id,
          is_active: true,
        })
        .select('id')
        .single()
      if (error || !inserted) {
        console.error(`Error inserting eatery "${eateryData.name}":`, error)
        process.exit(1)
      }
      eateryId = inserted.id
      console.log(`Eatery "${eateryData.name}" inserted (id: ${eateryId})`)
    }

    // Delete all existing menu items for this eatery (cascades to option groups/options)
    const { error: deleteItemsError } = await supabase
      .from('menu_items')
      .delete()
      .eq('restaurant_id', eateryId)

    if (deleteItemsError) {
      console.error(`Error clearing menu items for "${eateryData.name}":`, deleteItemsError)
      process.exit(1)
    }

    // Delete all existing menu item groups for this eatery
    const { error: deleteGroupsError } = await supabase
      .from('menu_item_groups')
      .delete()
      .eq('eatery_id', eateryId)

    if (deleteGroupsError) {
      console.error(`Error clearing menu item groups for "${eateryData.name}":`, deleteGroupsError)
      process.exit(1)
    }

    // Insert groups and build a name → id map
    const groupIdByName = new Map<string, string>()

    for (const groupName of eateryData.groups) {
      const { data: group, error: groupError } = await supabase
        .from('menu_item_groups')
        .insert({ eatery_id: eateryId, name: groupName })
        .select('id')
        .single()

      if (groupError || !group) {
        console.error(`Error inserting group "${groupName}" for "${eateryData.name}":`, groupError)
        process.exit(1)
      }

      groupIdByName.set(groupName, group.id)
    }

    // Insert menu items
    for (const itemData of eateryData.menu_items) {
      const groupId = groupIdByName.get(itemData.group)
      if (!groupId) {
        console.error(`Unknown group "${itemData.group}" for item "${itemData.name}"`)
        process.exit(1)
      }

      const { data: menuItem, error: itemError } = await supabase
        .from('menu_items')
        .insert({
          restaurant_id: eateryId,
          group_id: groupId,
          name: itemData.name,
          original_price_cents: itemData.original_price_cents,
          market_price_cents: itemData.market_price_cents,
          image_url: itemData.image_url,
          is_available: true,
        })
        .select('id')
        .single()

      if (itemError || !menuItem) {
        console.error(`Error inserting menu item "${itemData.name}":`, itemError)
        process.exit(1)
      }

      // Insert option groups and their options
      for (const optGroupData of itemData.option_groups) {
        const { data: optGroup, error: optGroupError } = await supabase
          .from('menu_item_option_groups')
          .insert({
            menu_item_id: menuItem.id,
            name: optGroupData.name,
            selection_type: optGroupData.selection_type,
            is_required: optGroupData.is_required,
            sort_order: optGroupData.sort_order,
          })
          .select('id')
          .single()

        if (optGroupError || !optGroup) {
          console.error(`Error inserting option group "${optGroupData.name}":`, optGroupError)
          process.exit(1)
        }

        const optionsToInsert = optGroupData.options.map((opt) => ({
          option_group_id: optGroup.id,
          name: opt.name,
          additional_price_cents: opt.additional_price_cents,
          is_default: opt.is_default,
          sort_order: opt.sort_order,
        }))

        const { error: optionsError } = await supabase
          .from('menu_item_options')
          .insert(optionsToInsert)

        if (optionsError) {
          console.error(`Error inserting options for group "${optGroupData.name}":`, optionsError)
          process.exit(1)
        }
      }
    }

    console.log(`  Seeded ${eateryData.groups.length} groups, ${eateryData.menu_items.length} menu items for "${eateryData.name}"`)
  }

  console.log('Seed complete.')
}

seed()
