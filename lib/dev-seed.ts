import 'server-only'
import { createClient } from '@/lib/supabase/server'

export async function seedDevEateries() {
  const supabase = await createClient()
  const { error } = await supabase.rpc('seed_dev_eateries')
  if (error) {
    console.error('[dev-seed] Failed to seed:', error)
  }
}
