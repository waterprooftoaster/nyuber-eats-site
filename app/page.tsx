import { createClient } from '@/lib/supabase/server'
import { RestaurantCard } from '@/components/restaurant-card'
import { seedDevEateries } from '@/lib/dev-seed'

export default async function Home() {
  const supabase = await createClient()

  let { data: eateries } = await supabase
    .from('eateries')
    .select('id, name, image_url')
    .eq('is_active', true)
    .order('name')

  if (process.env.NODE_ENV === 'development' && (!eateries || eateries.length === 0)) {
    await seedDevEateries()
    const { data: seeded } = await supabase
      .from('eateries')
      .select('id, name, image_url')
      .eq('is_active', true)
    eateries = seeded
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5 p-8">
        {(eateries ?? []).map((eatery) => (
          <RestaurantCard
            key={eatery.id}
            id={eatery.id}
            name={eatery.name}
            imageUrl={eatery.image_url}
          />
        ))}
      </div>
    </main>
  )
}
