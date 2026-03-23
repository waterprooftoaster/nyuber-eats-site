import { createClient } from '@/lib/supabase/server'
import { createExpressAccount, createOnboardingLink } from '@/lib/stripe/connect'
import { apiError, apiSuccess, getAuthenticatedUser } from '@/lib/api/helpers'

export async function POST() {
  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)
  if (!user) return apiError('Unauthorized', 401)
  if (!user.email) return apiError('Account must have an email address', 400)

  const appUrl = process.env.NEXT_PUBLIC_URL
  if (!appUrl) return apiError('Server configuration error', 500)

  // Get or create Stripe Connected Account
  let stripeAccountId: string

  const { data: existing } = await supabase
    .from('stripe_accounts')
    .select('stripe_account_id')
    .eq('user_id', user.id)
    .single()

  if (existing) {
    stripeAccountId = existing.stripe_account_id
  } else {
    let account
    try {
      account = await createExpressAccount(user.id, user.email)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create Stripe account'
      return apiError(message, 500)
    }

    const { data: inserted, error } = await supabase
      .from('stripe_accounts')
      .insert({ user_id: user.id, stripe_account_id: account.id })
      .select('stripe_account_id')
      .single()

    if (error?.code === '23505') {
      // Race condition: another request won the insert, fetch theirs
      const { data: raceWinner } = await supabase
        .from('stripe_accounts')
        .select('stripe_account_id')
        .eq('user_id', user.id)
        .single()
      if (!raceWinner) return apiError('Failed to create Stripe account record', 500)
      stripeAccountId = raceWinner.stripe_account_id
    } else if (error) {
      return apiError('Failed to create Stripe account record', 500)
    } else {
      stripeAccountId = inserted.stripe_account_id
    }
  }

  let link
  try {
    link = await createOnboardingLink(
      stripeAccountId,
      `${appUrl}/stripe/onboard/complete`,
      `${appUrl}/stripe/onboard/refresh`
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create onboarding link'
    return apiError(message, 500)
  }

  return apiSuccess({ url: link.url })
}