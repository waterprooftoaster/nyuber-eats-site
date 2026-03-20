import { createClient } from '@/lib/supabase/server'
import { RestaurantCard } from '@/components/restaurant-card'
import { Header } from '@/components/header'

export default async function Home() {
  const supabase = await createClient()

  const { data: eateries } = await supabase
    .from('eateries')
    .select('id, name')
    .eq('is_active', true)

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <div className="mx-auto grid max-w-5xl grid-cols-4 gap-5 p-8">
        {(eateries ?? []).map((eatery) => (
          <RestaurantCard key={eatery.id} name={eatery.name} />
        ))}
      </div>
    </main>
  )
}
