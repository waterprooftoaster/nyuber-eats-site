import 'server-only'

import { getStripe } from './client'

export const PLATFORM_FEE_CENTS = 100

export async function createPaymentIntent({
  amountCents,
  tipCents,
  stripeConnectedAccountId,
  orderId,
  payerEmail,
  paymentMethodId,
}: {
  amountCents: number
  tipCents: number
  stripeConnectedAccountId: string
  orderId: string
  payerEmail?: string
  paymentMethodId?: string
}) {
  const totalAmount = amountCents + tipCents
  const platformFee = PLATFORM_FEE_CENTS

  return getStripe().paymentIntents.create(
    {
      amount: totalAmount,
      currency: 'usd',
      application_fee_amount: platformFee,
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
