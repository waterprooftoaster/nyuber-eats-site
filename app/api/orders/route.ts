import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createOrderSchema } from '@/lib/types/api'
import { apiError, apiSuccess, getAuthenticatedUser } from '@/lib/api/helpers'
import type { OrderItem } from '@/lib/types/database'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = createOrderSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 400)
  }
  const {
    eatery_id,
    items,
    special_instructions,
    tip_cents,
    guest_name,
    guest_phone,
    guest_stripe_pm_id,
  } = parsed.data

  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)

  // Guest path: all three guest fields required
  if (!user) {
    if (!guest_name || !guest_phone || !guest_stripe_pm_id) {
      return apiError(
        'Guest orders require guest_name, guest_phone, and guest_stripe_pm_id',
        400
      )
    }
  }

  // Use service client for guest inserts (anon role has no grants on orders)
  const dbClient = user ? supabase : createServiceClient()

  // Verify eatery exists
  const { data: eatery } = await dbClient
    .from('eateries')
    .select('id')
    .eq('id', eatery_id)
    .eq('is_active', true)
    .single()
  if (!eatery) return apiError('Eatery not found', 404)

  // Look up menu items and compute total server-side
  const menuItemIds = items.map((i) => i.menu_item_id)
  const { data: menuItems } = await dbClient
    .from('menu_items')
    .select('id, name, original_price_cents, market_price_cents')
    .in('id', menuItemIds)
    .eq('restaurant_id', eatery_id)
    .eq('is_available', true)

  if (!menuItems || menuItems.length !== items.length) {
    return apiError('One or more menu items not found or unavailable', 400)
  }

  const menuItemMap = new Map(menuItems.map((mi) => [mi.id, mi]))
  const orderItems: OrderItem[] = []
  let totalCents = 0

  for (const item of items) {
    const mi = menuItemMap.get(item.menu_item_id)
    if (!mi) return apiError('Menu item not found', 400)
    const effectivePrice = mi.market_price_cents ?? mi.original_price_cents
    orderItems.push({
      menu_item_id: mi.id,
      name: mi.name,
      price_cents: effectivePrice,
      quantity: item.quantity,
    })
    totalCents += effectivePrice * item.quantity
  }

  const insertPayload = {
    orderer_id: user?.id ?? null,
    eatery_id,
    items: orderItems,
    total_cents: totalCents,
    tip_cents: tip_cents ?? 0,
    special_instructions: special_instructions ?? null,
    guest_name: user ? null : guest_name!,
    guest_phone: user ? null : guest_phone!,
    guest_stripe_pm_id: user ? null : guest_stripe_pm_id!,
  }

  const { data: order, error } = await dbClient
    .from('orders')
    .insert(insertPayload)
    .select()
    .single()

  if (error) return apiError('Failed to create order', 500)
  return apiSuccess(order, 201)
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)
  if (!user) return apiError('Unauthorized', 401)

  const { searchParams } = request.nextUrl
  const role = searchParams.get('role')
  const status = searchParams.get('status')

  // guest_stripe_pm_id intentionally excluded — it is a sensitive payment token
  let query = supabase.from('orders').select(
    'id, orderer_id, swiper_id, eatery_id, status, items, total_cents, tip_cents, special_instructions, guest_name, guest_phone, created_at, updated_at'
  )

  if (role === 'orderer') {
    query = query.eq('orderer_id', user.id)
  } else if (role === 'swiper') {
    query = query.eq('swiper_id', user.id)
  }

  if (status) {
    query = query.eq('status', status)
  }

  const { data: orders, error } = await query.order('created_at', {
    ascending: false,
  })

  if (error) return apiError('Failed to fetch orders', 500)
  return apiSuccess(orders)
}
