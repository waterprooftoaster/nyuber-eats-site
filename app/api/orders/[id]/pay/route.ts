import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getStripe } from '@/lib/stripe/client'
import { createPaymentIntent } from '@/lib/stripe/checkout'
import { platformFeeCents } from '@/lib/pricing'
import { apiError, apiSuccess, getAuthenticatedUser } from '@/lib/api/helpers'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)
  if (!user) return apiError('Unauthorized', 401)
  if (!user.email) return apiError('Account must have an email address', 400)

  // Fetch order — must be completed and belong to this orderer
  const { data: order } = await supabase
    .from('orders')
    .select('id, orderer_id, swiper_id, status, total_cents, tip_cents')
    .eq('id', id)
    .single()

  if (!order) return apiError('Order not found', 404)
  if (order.orderer_id !== user.id) {
    return apiError('Not authorized', 403)
  }
  if (order.status !== 'completed') {
    return apiError('Order must be completed before payment', 400)
  }
  if (!order.swiper_id) {
    return apiError('Order has no swiper', 400)
  }

  const serviceClient = createServiceClient()

  // Idempotency: if a payment record already exists, return the existing PI
  const { data: existingPayment } = await serviceClient
    .from('payments')
    .select('stripe_payment_intent_id')
    .eq('order_id', order.id)
    .maybeSingle()

  if (existingPayment) {
    // L-3: Wrap retrieve in try/catch — uncaught exception would leak a stack trace
    try {
      const pi = await getStripe().paymentIntents.retrieve(
        existingPayment.stripe_payment_intent_id
      )
      return apiSuccess({
        clientSecret: pi.client_secret,
        paymentIntentId: pi.id,
      })
    } catch {
      return apiError('Failed to retrieve existing payment', 500)
    }
  }

  // Get swiper's Stripe account — verify onboarding is complete
  const { data: stripeAccount } = await supabase
    .from('stripe_accounts')
    .select('stripe_account_id, onboarding_complete')
    .eq('user_id', order.swiper_id)
    .single()

  if (!stripeAccount) {
    return apiError('Swiper has no Stripe account', 400)
  }
  if (!stripeAccount.onboarding_complete) {
    return apiError(
      'Swiper Stripe account is not ready to receive payments',
      400
    )
  }

  const itemsCents = order.total_cents - order.tip_cents
  const fee = platformFeeCents(itemsCents)

  const paymentIntent = await createPaymentIntent({
    amountCents: order.total_cents,
    tipCents: order.tip_cents,
    platformFeeCents: fee,
    stripeConnectedAccountId: stripeAccount.stripe_account_id,
    orderId: order.id,
    payerEmail: user.email,
  })

  const { error: paymentError } = await serviceClient
    .from('payments')
    .insert({
      order_id: order.id,
      stripe_payment_intent_id: paymentIntent.id,
      amount_cents: order.total_cents + order.tip_cents,
      platform_fee_cents: fee,
      payer_id: user.id,
      payee_id: order.swiper_id,
    })

  if (paymentError) return apiError('Failed to create payment record', 500)

  return apiSuccess({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  })
}
