import { NextRequest } from 'next/server'
import { getStripe } from '@/lib/stripe/client'
import { createServiceClient } from '@/lib/supabase/service'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import type Stripe from 'stripe'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  if (!signature) return apiError('Missing stripe-signature header', 400)

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return apiError('Invalid webhook signature', 400)
  }

  const supabase = createServiceClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const orderId = session.metadata?.order_id
      const piId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id
      if (!orderId || !piId) break

      // Insert as pending so payment_intent.succeeded can advance it to succeeded
      await supabase.from('payments').upsert(
        {
          order_id: orderId,
          stripe_payment_intent_id: piId,
          amount_cents: session.amount_total ?? 0,
          platform_fee_cents: 100,
          status: 'pending',
        },
        { onConflict: 'stripe_payment_intent_id', ignoreDuplicates: true }
      )
      break
    }

    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent
      const orderId = pi.metadata.order_id
      if (!orderId) break

      // Idempotent: only update if still pending
      await supabase
        .from('payments')
        .update({ status: 'succeeded' })
        .eq('stripe_payment_intent_id', pi.id)
        .eq('status', 'pending')

      await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', orderId)
        .eq('status', 'completed')

      break
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent

      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('stripe_payment_intent_id', pi.id)
        .eq('status', 'pending')

      break
    }

    case 'account.updated': {
      const account = event.data.object as Stripe.Account
      if (account.details_submitted && account.charges_enabled) {
        await supabase
          .from('stripe_accounts')
          .update({ onboarding_complete: true })
          .eq('stripe_account_id', account.id)
      }
      break
    }
  }

  return apiSuccess({ received: true })
}
