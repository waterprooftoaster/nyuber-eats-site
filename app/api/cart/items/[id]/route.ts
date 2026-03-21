import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { apiError, apiSuccess, getAuthenticatedUser, CART_SESSION_COOKIE } from '@/lib/api/helpers'

const uuidSchema = z.string().uuid()

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!uuidSchema.safeParse(id).success) {
    return apiError('Invalid item id', 400)
  }

  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)
  const cookieStore = await cookies()
  const service = createServiceClient()

  // Find cart for this identity
  let cart: { id: string } | null = null
  if (user) {
    const { data } = await service
      .from('carts')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    cart = data
  } else {
    const sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value
    if (!sessionId) return apiError('Cart not found', 404)
    const { data } = await service
      .from('carts')
      .select('id')
      .eq('session_id', sessionId)
      .maybeSingle()
    cart = data
  }

  if (!cart) return apiError('Cart not found', 404)

  // Verify item belongs to this cart
  const { data: cartItem } = await service
    .from('cart_items')
    .select('id, cart_id')
    .eq('id', id)
    .maybeSingle()

  if (!cartItem) return apiError('Item not found', 404)
  if (cartItem.cart_id !== cart.id) return apiError('Forbidden', 403)

  // Delete the item
  const { error } = await service.from('cart_items').delete().eq('id', id)
  if (error) return apiError('Failed to remove item', 500)

  return apiSuccess({ success: true })
}
