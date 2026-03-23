import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getStripe } from '@/lib/stripe/client'
import { loadCart } from '@/lib/cart/load'
import { apiError, apiSuccess, getAuthenticatedUser, CART_SESSION_COOKIE } from '@/lib/api/helpers'
import type Stripe from 'stripe'

const checkoutBodySchema = z.object({
  // M-2: Tip validated further server-side against order total (see below)
  tip_cents: z.number().int().min(0).max(10000).optional(),
  special_instructions: z.string().trim().max(500).optional(),
  guest_name: z.string().trim().min(1).max(100).optional(),
  guest_phone: z
    .string()
    .regex(/^\+?[0-9\s\-().]{7,20}$/)
    .optional(),
})

// M-1: Guest session cookie must be a v4 UUID
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = checkoutBodySchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 400)
  }
  const { tip_cents, special_instructions, guest_name, guest_phone } = parsed.data

  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)
  const cookieStore = await cookies()
  const service = createServiceClient()

  // Find the user's cart
  let cart: { id: string; eatery_id: string } | null = null
  if (user) {
    const { data } = await service
      .from('carts')
      .select('id, eatery_id')
      .eq('user_id', user.id)
      .maybeSingle()
    cart = data
  } else {
    const sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value
    if (!sessionId) return apiError('No cart found', 400)
    // M-1: Reject malformed session cookies before hitting the DB
    if (!UUID_RE.test(sessionId)) return apiError('Invalid session', 400)
    const { data } = await service
      .from('carts')
      .select('id, eatery_id')
      .eq('session_id', sessionId)
      .maybeSingle()
    cart = data
  }

  if (!cart) return apiError('No cart found', 400)

  const loaded = await loadCart(service, cart)
  if (loaded.items.length === 0) return apiError('Cart is empty', 400)

  // Guest path: name + phone required
  if (!user) {
    if (!guest_name || !guest_phone) {
      return apiError('Guest checkout requires name and phone number', 400)
    }
  }

  // User pays 50% of original price (already computed in loadCart)
  const totalItemCents = loaded.items.reduce(
    (sum, item) => sum + item.quantity * item.price_cents,
    0
  )
  // M-2: Cap tip to order subtotal
  const tipCents = Math.min(tip_cents ?? 0, totalItemCents)
  const totalCents = totalItemCents + tipCents
  // Platform fee = 10% of original = 20% of what user pays
  const feeCents = Math.round(totalItemCents * 0.2)

  const orderItems = loaded.items.map((item) => ({
    menu_item_id: item.menu_item_id,
    name: item.name,
    price_cents: item.price_cents,
    quantity: item.quantity,
  }))

  // Create order row (pending, unpaid)
  const { data: order, error: orderError } = await service
    .from('orders')
    .insert({
      orderer_id: user?.id ?? null,
      eatery_id: loaded.eatery_id,
      items: orderItems,
      total_cents: totalCents,
      tip_cents: tipCents,
      special_instructions: special_instructions ?? null,
      guest_name: user ? null : guest_name!,
      guest_phone: user ? null : guest_phone!,
      guest_stripe_pm_id: null,
    })
    .select('id')
    .single()

  if (orderError || !order) {
    return apiError('Failed to create order', 500)
  }

  // Create Stripe Checkout Session (embedded mode)
  // If Stripe fails, clean up the orphaned order row
  // H-1: Validate NEXT_PUBLIC_URL is set and looks like a real URL
  const appUrl = process.env.NEXT_PUBLIC_URL
  if (!appUrl || !appUrl.startsWith('http')) {
    await service.from('orders').delete().eq('id', order.id)
    return apiError('Server configuration error', 500)
  }
  const returnUrl = `${appUrl}/checkout/return?session_id={CHECKOUT_SESSION_ID}`

  let session: Stripe.Checkout.Session
  try {
    session = await getStripe().checkout.sessions.create({
      ui_mode: 'embedded',
      mode: 'payment',
      return_url: returnUrl,
      // Top-level metadata read by checkout.session.completed webhook
      metadata: { order_id: order.id, platform_fee_cents: String(feeCents) },
      line_items: loaded.items.map((item) => ({
        price_data: {
          currency: 'usd',
          unit_amount: item.price_cents,
          product_data: { name: item.name },
        },
        quantity: item.quantity,
      })),
      // Payment intent metadata read by payment_intent.succeeded webhook
      payment_intent_data: {
        metadata: { order_id: order.id },
      },
      ...(user?.email && { customer_email: user.email }),
    })
  } catch (err) {
    // Delete the order so it doesn't become orphaned
    await service.from('orders').delete().eq('id', order.id)
    const message = err instanceof Error ? err.message : 'Stripe error'
    console.error(`Failed to create Stripe checkout session: ${message}`)
    return apiError('Failed to create checkout session', 500)
  }

  if (!session.client_secret) {
    await service.from('orders').delete().eq('id', order.id)
    return apiError('Failed to create checkout session', 500)
  }

  return apiSuccess({ clientSecret: session.client_secret, orderId: order.id })
}
