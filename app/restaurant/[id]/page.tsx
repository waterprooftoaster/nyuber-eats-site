import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RestaurantHero } from '@/components/restaurant-hero'
import { MenuGrid } from '@/components/menu-grid'

interface Props {
  params: Promise<{ id: string }>
}

export default async function RestaurantPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: eatery }, { data: menuItems }] = await Promise.all([
    supabase
      .from('eateries')
      .select('id, name, image_url, address')
      .eq('id', id)
      .eq('is_active', true)
      .single(),
    supabase
      .from('menu_items')
      .select('id, name, original_price_cents, market_price_cents, image_url')
      .eq('restaurant_id', id)
      .eq('is_available', true),
  ])

  if (!eatery) notFound()

  return (
    <main className="min-h-screen bg-white pt-2">
      <div className="max-w-[60rem] mx-auto -translate-x-28 px-4">
        <RestaurantHero imageUrl={eatery.image_url} alt={eatery.name} />

        <div className="py-5">
          <h1 className="text-2xl font-bold text-gray-900">{eatery.name}</h1>
          <p data-testid="restaurant-address" className="mt-1 text-sm text-gray-500">
            {eatery.address}
          </p>
        </div>

        <MenuGrid items={menuItems ?? []} />
      </div>
    </main>
  )
}
