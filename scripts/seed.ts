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

const SCHOOL = { name: 'NYU', slug: 'nyu' }

const EATERY_NAMES = [
  { name: "Joe's Pizza", address: '7 Carmine St, New York, NY 10014' },
  { name: 'Sushi Palace', address: '100 W 4th St, New York, NY 10012' },
  { name: 'Burger Barn', address: '55 W 8th St, New York, NY 10011' },
  { name: 'Taco Fiesta', address: '200 Mercer St, New York, NY 10012' },
]

async function seed() {
  // Upsert school (idempotent on slug)
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

  // Check which eateries already exist for this school
  const { data: existing, error: fetchError } = await supabase
    .from('eateries')
    .select('name')
    .eq('school_id', school.id)

  if (fetchError) {
    console.error('Error fetching existing eateries:', fetchError)
    process.exit(1)
  }

  const existingNames = new Set((existing ?? []).map((e) => e.name))

  const toInsert = EATERY_NAMES
    .filter(({ name }) => !existingNames.has(name))
    .map(({ name, address }) => ({
      name,
      address,
      school_id: school.id,
      is_active: true,
    }))

  if (toInsert.length === 0) {
    console.log('All eateries already exist — nothing to insert.')
    return
  }

  const { error: insertError } = await supabase.from('eateries').insert(toInsert)

  if (insertError) {
    console.error('Error inserting eateries:', insertError)
    process.exit(1)
  }

  console.log(`Inserted ${toInsert.length} eaterie(s): ${toInsert.map((e) => e.name).join(', ')}`)
}

seed()
