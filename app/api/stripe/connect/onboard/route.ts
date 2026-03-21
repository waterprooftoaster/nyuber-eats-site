import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createOnboardingLink } from '@/lib/stripe/connect'
import { apiError, apiSuccess, getAuthenticatedUser } from '@/lib/api/helpers'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)
  if (!user) return apiError('Unauthorized', 401)

  const { data: stripeAccount } = await supabase
    .from('stripe_accounts')
    .select('stripe_account_id')
    .eq('user_id', user.id)
    .single()

  if (!stripeAccount) {
    return apiError('No Stripe account found. Create one first.', 404)
  }

  // H-3: Use env var, not request origin — Host header is attacker-controlled
  const appUrl = process.env.NEXT_PUBLIC_URL
  if (!appUrl) return apiError('Server configuration error', 500)
  const link = await createOnboardingLink(
    stripeAccount.stripe_account_id,
    `${appUrl}/stripe/onboard/complete`,
    `${appUrl}/stripe/onboard/refresh`
  )

  return apiSuccess({ url: link.url })
}
