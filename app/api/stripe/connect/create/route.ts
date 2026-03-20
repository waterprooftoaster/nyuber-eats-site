import { createClient } from '@/lib/supabase/server'
import { createExpressAccount } from '@/lib/stripe/connect'
import { apiError, apiSuccess, getAuthenticatedUser } from '@/lib/api/helpers'

export async function POST() {
  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)
  if (!user) return apiError('Unauthorized', 401)
  if (!user.email) return apiError('Account must have an email address', 400)

  // Check for existing account
  const { data: existing } = await supabase
    .from('stripe_accounts')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (existing) return apiSuccess(existing)

  const account = await createExpressAccount(user.id, user.email)

  const { data: stripeAccount, error } = await supabase
    .from('stripe_accounts')
    .insert({
      user_id: user.id,
      stripe_account_id: account.id,
    })
    .select()
    .single()

  // Handle race condition: another request may have won the insert
  if (error?.code === '23505') {
    const { data: raceWinner } = await supabase
      .from('stripe_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single()
    if (raceWinner) return apiSuccess(raceWinner)
  }

  if (error) return apiError('Failed to create Stripe account record', 500)
  return apiSuccess(stripeAccount, 201)
}
