import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/api/helpers'
import { platformFeeCents } from '@/lib/pricing'

type OrderItem = {
  name: string
  quantity: number
  price_cents: number
}

type EateryJoin = { name: string } | null

type SwipeOrder = {
  id: string
  status: string
  total_cents: number
  tip_cents: number
  items: OrderItem[]
  created_at: string
  eateries: EateryJoin
}

function formatDollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function itemsSummary(items: OrderItem[]) {
  return items
    .map((i) => (i.quantity > 1 ? `${i.name} ×${i.quantity}` : i.name))
    .join(', ')
}

export default async function SwiperDashboardPage() {
  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)
  // Layout guard already redirects non-swipers, but defend against direct renders
  if (!user) redirect('/auth/login')

  const [earningsResult, ordersResult] = await Promise.all([
    supabase
      .from('payments')
      .select('amount_cents, platform_fee_cents')
      .eq('payee_id', user.id)
      .eq('status', 'succeeded'),
    supabase
      .from('orders')
      .select(
        'id, status, total_cents, tip_cents, items, created_at, eateries!orders_eatery_id_fkey(name)'
      )
      .eq('swiper_id', user.id)
      .in('status', ['completed', 'paid'])
      .order('created_at', { ascending: false })
      .range(0, 19),
  ])

  const payments = earningsResult.data ?? []
  const orders = ((ordersResult.data ?? []) as unknown) as SwipeOrder[]

  const total_earned_cents = payments.reduce(
    (sum, p) => sum + p.amount_cents - p.platform_fee_cents,
    0
  )
  const completed_order_count = payments.length

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl p-8">
        <h1 className="text-2xl font-bold mb-8">Swiper Dashboard</h1>

        {/* Earnings Summary */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4">Earnings</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-1">Total earned</p>
              <p className="text-3xl font-bold">{formatDollars(total_earned_cents)}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-1">Orders completed</p>
              <p className="text-3xl font-bold">{completed_order_count}</p>
            </div>
          </div>
        </section>

        {/* Completed Orders */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Order History</h2>
          {orders.length === 0 ? (
            <p className="text-sm text-gray-500">No completed orders yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {orders.map((order) => {
                // Swiper earnings = user payment minus 10% platform fee (on items only)
                const itemsCents = order.total_cents - order.tip_cents
                const earned = order.total_cents - platformFeeCents(itemsCents)
                return (
                  <li key={order.id} className="py-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {order.eateries?.name ?? '—'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {itemsSummary(order.items)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">{formatDollars(earned)}</p>
                      <p className="text-xs text-gray-400 capitalize">{order.status}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
