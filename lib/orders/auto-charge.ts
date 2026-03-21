import 'server-only'

import { createServiceClient } from '@/lib/supabase/service'
import { createPaymentIntent, PLATFORM_FEE_CENTS } from '@/lib/stripe/checkout'
import type { Order } from '@/lib/types/database'

export async function autoChargeGuestOrder(order: Order) {
  if (!order.guest_stripe_pm_id || !order.swiper_id) return

  const serviceClient = createServiceClient()

  try {
    // Idempotency: if a payment already exists for this order, skip
    const { data: existingPayment } = await serviceClient
      .from('payments')
      .select('id')
      .eq('order_id', order.id)
      .maybeSingle()

    if (existingPayment) return

    // Fetch swiper's Stripe connected account
    const { data: stripeAccount } = await serviceClient
      .from('stripe_accounts')
      .select('stripe_account_id')
      .eq('user_id', order.swiper_id)
      .single()

    if (!stripeAccount) {
      console.error(
        `Auto-charge failed: no Stripe account for swiper ${order.swiper_id}`
      )
      return
    }

    const paymentIntent = await createPaymentIntent({
      amountCents: order.total_cents,
      tipCents: order.tip_cents,
      stripeConnectedAccountId: stripeAccount.stripe_account_id,
      orderId: order.id,
      paymentMethodId: order.guest_stripe_pm_id,
    })

    const platformFee = PLATFORM_FEE_CENTS

    await serviceClient.from('payments').insert({
      order_id: order.id,
      stripe_payment_intent_id: paymentIntent.id,
      amount_cents: order.total_cents + order.tip_cents,
      platform_fee_cents: platformFee,
      payer_id: null,
      payee_id: order.swiper_id,
    })

    // Clear stored payment method — it's single-use for this order
    await serviceClient
      .from('orders')
      .update({ guest_stripe_pm_id: null })
      .eq('id', order.id)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Auto-charge failed for order ${order.id}: ${message}`)
  }
}
