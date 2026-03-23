import 'server-only'

import { getStripe } from './client'

export async function createPaymentIntent({
  amountCents,
  tipCents,
  platformFeeCents,
  stripeConnectedAccountId,
  orderId,
  payerEmail,
  paymentMethodId,
}: {
  amountCents: number
  tipCents: number
  platformFeeCents: number
  stripeConnectedAccountId: string
  orderId: string
  payerEmail?: string
  paymentMethodId?: string
}) {
  const totalAmount = amountCents + tipCents

  return getStripe().paymentIntents.create(
    {
      amount: totalAmount,
      currency: 'usd',
      application_fee_amount: platformFeeCents,
      transfer_data: {
        destination: stripeConnectedAccountId,
      },
      metadata: { order_id: orderId },
      ...(payerEmail && { receipt_email: payerEmail }),
      ...(paymentMethodId && {
        payment_method: paymentMethodId,
        confirm: true,
        off_session: true,
      }),
    },
    // C-3: Idempotency key prevents duplicate PIs on network retries
    { idempotencyKey: `pi-${orderId}` }
  )
}
