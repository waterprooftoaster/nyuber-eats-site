import 'server-only'

import { getStripe } from './client'

export const PLATFORM_FEE_RATE = 0.1

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
  const platformFee = Math.round(amountCents * PLATFORM_FEE_RATE)

  return getStripe().paymentIntents.create({
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
  })
}
