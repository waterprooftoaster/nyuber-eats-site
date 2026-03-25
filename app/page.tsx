import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { RestaurantCard } from '@/components/restaurant-card'
import { seedDevEateries } from '@/lib/dev-seed'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>
}) {
  const [{ notice }, supabase] = await Promise.all([
    searchParams,
    createClient(),
  ])

  let { data: eateries } = await supabase
    .from('eateries')
    .select('id, name, image_url, schools(name)')
    .eq('is_active', true)
    .order('name')

  if (process.env.NODE_ENV === 'development' && (!eateries || eateries.length === 0)) {
    await seedDevEateries()
    const { data: seeded } = await supabase
      .from('eateries')
      .select('id, name, image_url, schools(name)')
      .eq('is_active', true)
    eateries = seeded
  }

  const grouped = new Map<string, NonNullable<typeof eateries>>()
  for (const eatery of eateries ?? []) {
    const school = ((eatery.schools as unknown) as { name: string } | null)?.name ?? 'Other'
    if (!grouped.has(school)) grouped.set(school, [])
    grouped.get(school)!.push(eatery)
  }

  return (
    <main className="min-h-screen bg-white space-y-8 p-4">
      {notice === 'swiper_activated' && (
        <div className="mx-auto max-w-2xl rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          You&apos;re now a swiper! Head to{' '}
          <Link href="/swiper/orders" className="font-medium underline">
            Pending Orders
          </Link>{' '}
          to start fulfilling orders.
        </div>
      )}
      {[...grouped.entries()].map(([schoolName, schoolEateries]) => (
        <section key={schoolName}>
          <h2 className="text-lg font-bold text-gray-900 mb-3">{schoolName}</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {schoolEateries.map((eatery) => (
              <RestaurantCard
                key={eatery.id}
                id={eatery.id}
                name={eatery.name}
                imageUrl={eatery.image_url}
              />
            ))}
          </div>
        </section>
      ))}
    </main>
  )
}
