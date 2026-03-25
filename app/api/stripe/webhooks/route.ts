import { NextRequest } from 'next/server'
import { getStripe } from '@/lib/stripe/client'
import { createServiceClient } from '@/lib/supabase/service'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import type Stripe from 'stripe'

// M-3: Validate metadata order_id values before trusting them in DB queries
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // H-6: Fail clearly on misconfiguration rather than silently accepting any signature
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return apiError('Server configuration error', 500)
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  if (!signature) return apiError('Missing stripe-signature header', 400)

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret)
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
      // M-3: Validate order_id is a real UUID before touching the DB
      if (!orderId || !piId || !UUID_RE.test(orderId)) break

      // Fetch payee_id (swiper) — required NOT NULL field on payments table
      const { data: orderRow } = await supabase
        .from('orders')
        .select('swiper_id, orderer_id')
        .eq('id', orderId)
        .single()
      if (!orderRow?.swiper_id) break

      const amountTotal = session.amount_total ?? 0
      // Read fee stored in session metadata; fall back to 20% of charge (10% of original)
      const feeCents = session.metadata?.platform_fee_cents
        ? parseInt(session.metadata.platform_fee_cents, 10)
        : Math.round(amountTotal * 0.2)

      // Insert as pending so payment_intent.succeeded can advance it to succeeded
      const { error: upsertError } = await supabase.from('payments').upsert(
        {
          order_id: orderId,
          stripe_payment_intent_id: piId,
          amount_cents: amountTotal,
          platform_fee_cents: feeCents,
          status: 'pending',
          payee_id: orderRow.swiper_id,
          payer_id: orderRow.orderer_id ?? null,
        },
        { onConflict: 'stripe_payment_intent_id', ignoreDuplicates: true }
      )
      if (upsertError) {
        console.error('checkout.session.completed: failed to upsert payment', upsertError)
        return apiError('Failed to record payment', 500)
      }
      break
    }

    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent
      const orderId = pi.metadata.order_id
      // M-3: Validate order_id UUID
      if (!orderId || !UUID_RE.test(orderId)) break

      // Idempotent: only update if still pending
      await supabase
        .from('payments')
        .update({ status: 'succeeded' })
        .eq('stripe_payment_intent_id', pi.id)
        .eq('status', 'pending')

      // H-5: Allow all pre-paid statuses — checkout-session orders are 'pending'
      // at payment time, not 'completed' (which is only for the post-completion flow)
      await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', orderId)
        .in('status', ['pending', 'accepted', 'in_progress', 'completed'])

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
        // H-4: Verify the account belongs to this platform before updating
        const { data: existing } = await supabase
          .from('stripe_accounts')
          .select('id, user_id')
          .eq('stripe_account_id', account.id)
          .maybeSingle()
        if (!existing) break

        await supabase
          .from('stripe_accounts')
          .update({ onboarding_complete: true })
          .eq('stripe_account_id', account.id)

        // Auto-activate swiper status if school is set
        const { data: profile } = await supabase
          .from('profiles')
          .select('school_id')
          .eq('id', existing.user_id)
          .single()

        if (profile?.school_id) {
          await supabase
            .from('profiles')
            .update({ is_swiper: true })
            .eq('id', existing.user_id)
            .eq('is_swiper', false)
        } else {
          console.warn(
            `account.updated: skipping is_swiper activation for user ${existing.user_id} — no school_id set`
          )
        }
      }
      break
    }
  }

  return apiSuccess({ received: true })
}
