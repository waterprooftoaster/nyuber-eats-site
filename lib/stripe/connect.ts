import 'server-only'

import { getStripe } from './client'

export async function createExpressAccount(userId: string, email: string) {
  return await getStripe().accounts.create({
    country: 'US',
    email: email,
    business_type: 'individual',
    business_profile: {
      mcc: '7372',
      url: 'https://goobereats.net',
      product_description: "Peer-to-peer student meal swipe sharing app"
    },
    controller: {
      fees: {
        payer: 'application',
      },
      losses: {
        payments: 'application',
      },
      stripe_dashboard: {
        type: 'express',
      },
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    settings: {
      payments: {
        statement_descriptor: "WWW.GOOBEREATS.NET"
      }
    },
    metadata: { user_id: userId },
  });
}

export async function createOnboardingLink(
  stripeAccountId: string,
  returnUrl: string,
  refreshUrl: string
) {
  return getStripe().accountLinks.create({
    account: stripeAccountId,
    return_url: returnUrl,
    refresh_url: refreshUrl,
    type: 'account_onboarding',
  })
}

export async function createLoginLink(stripeAccountId: string) {
  return getStripe().accounts.createLoginLink(stripeAccountId)
}
