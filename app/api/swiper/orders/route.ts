import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, getAuthenticatedUser } from '@/lib/api/helpers'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)
  if (!user) return apiError('Unauthorized', 401)

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_swiper')
    .eq('id', user.id)
    .single()
  if (!profile?.is_swiper) return apiError('Forbidden', 403)

  const { searchParams } = request.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
  const offset = (page - 1) * limit

  const { data: orders, count, error } = await supabase
    .from('orders')
    .select(
      'id, status, total_cents, tip_cents, items, created_at, eateries!orders_eatery_id_fkey(name)',
      { count: 'exact' }
    )
    .eq('swiper_id', user.id)
    .in('status', ['completed', 'paid'])
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return apiError('Failed to fetch orders', 500)

  return apiSuccess({ orders: orders ?? [], page, limit, total: count ?? 0 })
}
