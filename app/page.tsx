import { createClient } from '@/lib/supabase/server'
import { RestaurantCard } from '@/components/restaurant-card'
import { Header } from '@/components/header'

export default async function Home() {
  const supabase = await createClient()

  const { data: eateries } = await supabase
    .from('eateries')
    .select('id, name, image_url')
    .eq('is_active', true)

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <div className="mx-auto grid max-w-5xl grid-cols-4 gap-5 p-8">
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
