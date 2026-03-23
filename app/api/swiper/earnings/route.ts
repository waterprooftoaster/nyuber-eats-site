import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, getAuthenticatedUser } from '@/lib/api/helpers'

export async function GET() {
  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)
  if (!user) return apiError('Unauthorized', 401)

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_swiper')
    .eq('id', user.id)
    .single()
  if (!profile?.is_swiper) return apiError('Forbidden', 403)

  const { data: payments, error } = await supabase
    .from('payments')
    .select('amount_cents, platform_fee_cents')
    .eq('payee_id', user.id)
    .eq('status', 'succeeded')

  if (error) return apiError('Failed to fetch earnings', 500)

  const total_earned_cents = (payments ?? []).reduce(
    (sum, p) => sum + p.amount_cents - p.platform_fee_cents,
    0
  )
  const completed_order_count = (payments ?? []).length

  return apiSuccess({ total_earned_cents, completed_order_count })
}
