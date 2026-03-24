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
    groups: ['Pizzas', 'Sides', 'Desserts'],
    menu_items: [
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
              { name: 'Small', additional_price_cents: 0, is_default: true, sort_order: 0 },
              { name: 'Medium', additional_price_cents: 200, is_default: false, sort_order: 1 },
              { name: 'Large', additional_price_cents: 400, is_default: false, sort_order: 2 },
            ],
          },
          {
            name: 'Toppings',
            selection_type: 'multiple',
            is_required: false,
            sort_order: 1,
            options: [
              { name: 'Extra Cheese', additional_price_cents: 150, is_default: false, sort_order: 0 },
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
              { name: 'Small', additional_price_cents: 0, is_default: true, sort_order: 0 },
              { name: 'Medium', additional_price_cents: 200, is_default: false, sort_order: 1 },
              { name: 'Large', additional_price_cents: 400, is_default: false, sort_order: 2 },
            ],
          },
        ],
      },
      {
        name: 'Caesar Salad',
        group: 'Sides',
        original_price_cents: 800,
        market_price_cents: 650,
        image_url: 'https://picsum.photos/seed/caesar-salad/400/400',
        option_groups: [],
      },
      {
        name: 'Garlic Bread',
        group: 'Sides',
        original_price_cents: 400,
        market_price_cents: null,
        image_url: 'https://picsum.photos/seed/garlic-bread/400/400',
        option_groups: [],
      },
      {
        name: 'Tiramisu',
        group: 'Desserts',
        original_price_cents: 700,
        market_price_cents: 550,
        image_url: 'https://picsum.photos/seed/tiramisu/400/400',
        option_groups: [],
      },
    ],
  },
  {
    name: 'Sushi Palace',
    address: '100 W 4th St, New York, NY 10012',
    image_url: 'https://picsum.photos/seed/sushi-palace/1200/500',
    groups: ['Rolls', 'Sashimi', 'Noodles', 'Appetizers'],
    menu_items: [
      {
        name: 'California Roll',
        group: 'Rolls',
        original_price_cents: 900,
        market_price_cents: null,
        image_url: 'https://picsum.photos/seed/california-roll/400/400',
        option_groups: [],
      },
      {
        name: 'Salmon Sashimi',
        group: 'Sashimi',
        original_price_cents: 1500,
        market_price_cents: 1200,
        image_url: 'https://picsum.photos/seed/salmon-sashimi/400/400',
        option_groups: [],
      },
      {
        name: 'Ramen',
        group: 'Noodles',
        original_price_cents: 1300,
        market_price_cents: null,
        image_url: 'https://picsum.photos/seed/ramen/400/400',
        option_groups: [
          {
            name: 'Broth',
            selection_type: 'single',
            is_required: true,
            sort_order: 0,
            options: [
              { name: 'Tonkotsu', additional_price_cents: 0, is_default: true, sort_order: 0 },
              { name: 'Shoyu', additional_price_cents: 0, is_default: false, sort_order: 1 },
              { name: 'Miso', additional_price_cents: 0, is_default: false, sort_order: 2 },
            ],
          },
          {
            name: 'Add-ons',
            selection_type: 'multiple',
            is_required: false,
            sort_order: 1,
            options: [
              { name: 'Soft Boiled Egg', additional_price_cents: 100, is_default: false, sort_order: 0 },
              { name: 'Bamboo Shoots', additional_price_cents: 75, is_default: false, sort_order: 1 },
              { name: 'Extra Noodles', additional_price_cents: 150, is_default: false, sort_order: 2 },
            ],
          },
        ],
      },
      {
        name: 'Edamame',
        group: 'Appetizers',
        original_price_cents: 500,
        market_price_cents: 350,
        image_url: 'https://picsum.photos/seed/edamame/400/400',
        option_groups: [],
      },
      {
        name: 'Miso Soup',
        group: 'Appetizers',
        original_price_cents: 300,
        market_price_cents: null,
        image_url: 'https://picsum.photos/seed/miso-soup/400/400',
        option_groups: [],
      },
    ],
  },
  {
    name: 'Burger Barn',
    address: '55 W 8th St, New York, NY 10011',
    image_url: 'https://picsum.photos/seed/burger-barn/1200/500',
    groups: ['Burgers', 'Sides', 'Drinks'],
    menu_items: [
      {
        name: 'Classic Burger',
        group: 'Burgers',
        original_price_cents: 1100,
        market_price_cents: 900,
        image_url: 'https://picsum.photos/seed/classic-burger/400/400',
        option_groups: [
          {
            name: 'Patty',
            selection_type: 'single',
            is_required: true,
            sort_order: 0,
            options: [
              { name: 'Single', additional_price_cents: 0, is_default: true, sort_order: 0 },
              { name: 'Double', additional_price_cents: 300, is_default: false, sort_order: 1 },
            ],
          },
          {
            name: 'Toppings',
            selection_type: 'multiple',
            is_required: false,
            sort_order: 1,
            options: [
              { name: 'Bacon', additional_price_cents: 200, is_default: false, sort_order: 0 },
              { name: 'Avocado', additional_price_cents: 150, is_default: false, sort_order: 1 },
              { name: 'Fried Egg', additional_price_cents: 100, is_default: false, sort_order: 2 },
            ],
          },
        ],
      },
      {
        name: 'Veggie Burger',
        group: 'Burgers',
        original_price_cents: 1000,
        market_price_cents: null,
        image_url: 'https://picsum.photos/seed/veggie-burger/400/400',
        option_groups: [],
      },
      {
        name: 'Fries',
        group: 'Sides',
        original_price_cents: 400,
        market_price_cents: null,
        image_url: 'https://picsum.photos/seed/fries/400/400',
        option_groups: [
          {
            name: 'Size',
            selection_type: 'single',
            is_required: true,
            sort_order: 0,
            options: [
              { name: 'Small', additional_price_cents: 0, is_default: true, sort_order: 0 },
              { name: 'Large', additional_price_cents: 150, is_default: false, sort_order: 1 },
            ],
          },
        ],
      },
      {
        name: 'Milkshake',
        group: 'Drinks',
        original_price_cents: 600,
        market_price_cents: 500,
        image_url: 'https://picsum.photos/seed/milkshake/400/400',
        option_groups: [
          {
            name: 'Flavor',
            selection_type: 'single',
            is_required: true,
            sort_order: 0,
            options: [
              { name: 'Vanilla', additional_price_cents: 0, is_default: true, sort_order: 0 },
              { name: 'Chocolate', additional_price_cents: 0, is_default: false, sort_order: 1 },
              { name: 'Strawberry', additional_price_cents: 0, is_default: false, sort_order: 2 },
            ],
          },
        ],
      },
      {
        name: 'Onion Rings',
        group: 'Sides',
        original_price_cents: 450,
        market_price_cents: null,
        image_url: 'https://picsum.photos/seed/onion-rings/400/400',
        option_groups: [],
      },
    ],
  },
  {
    name: 'Taco Fiesta',
    address: '200 Mercer St, New York, NY 10012',
    image_url: 'https://picsum.photos/seed/taco-fiesta/1200/500',
    groups: ['Tacos', 'Burritos & Wraps', 'Sides'],
    menu_items: [
      {
        name: 'Chicken Taco',
        group: 'Tacos',
        original_price_cents: 400,
        market_price_cents: null,
        image_url: 'https://picsum.photos/seed/chicken-taco/400/400',
        option_groups: [
          {
            name: 'Salsa',
            selection_type: 'single',
            is_required: false,
            sort_order: 0,
            options: [
              { name: 'Mild', additional_price_cents: 0, is_default: true, sort_order: 0 },
              { name: 'Medium', additional_price_cents: 0, is_default: false, sort_order: 1 },
              { name: 'Hot', additional_price_cents: 0, is_default: false, sort_order: 2 },
            ],
          },
        ],
      },
      {
        name: 'Beef Burrito',
        group: 'Burritos & Wraps',
        original_price_cents: 1000,
        market_price_cents: 800,
        image_url: 'https://picsum.photos/seed/beef-burrito/400/400',
        option_groups: [
          {
            name: 'Add-ons',
            selection_type: 'multiple',
            is_required: false,
            sort_order: 0,
            options: [
              { name: 'Guacamole', additional_price_cents: 150, is_default: false, sort_order: 0 },
              { name: 'Sour Cream', additional_price_cents: 75, is_default: false, sort_order: 1 },
              { name: 'Jalapeños', additional_price_cents: 0, is_default: false, sort_order: 2 },
            ],
          },
        ],
      },
      {
        name: 'Quesadilla',
        group: 'Burritos & Wraps',
        original_price_cents: 800,
        market_price_cents: null,
        image_url: 'https://picsum.photos/seed/quesadilla/400/400',
        option_groups: [
          {
            name: 'Protein',
            selection_type: 'single',
            is_required: true,
            sort_order: 0,
            options: [
              { name: 'Chicken', additional_price_cents: 0, is_default: true, sort_order: 0 },
              { name: 'Beef', additional_price_cents: 100, is_default: false, sort_order: 1 },
              { name: 'Veggie', additional_price_cents: 0, is_default: false, sort_order: 2 },
            ],
          },
        ],
      },
      {
        name: 'Nachos',
        group: 'Sides',
        original_price_cents: 900,
        market_price_cents: 750,
        image_url: 'https://picsum.photos/seed/nachos/400/400',
        option_groups: [],
      },
      {
        name: 'Churros',
        group: 'Sides',
        original_price_cents: 500,
        market_price_cents: null,
        image_url: 'https://picsum.photos/seed/churros/400/400',
        option_groups: [],
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
