import 'server-only'

import { getStripe } from './client'

export async function createExpressAccount(userId: string, email: string) {
  return getStripe().accounts.create({
    type: 'express',
    email,
    metadata: { user_id: userId },
  })
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
