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

  const origin = request.nextUrl.origin
  const link = await createOnboardingLink(
    stripeAccount.stripe_account_id,
    `${origin}/stripe/onboard/complete`,
    `${origin}/stripe/onboard/refresh`
  )

  return apiSuccess({ url: link.url })
}
