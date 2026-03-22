import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateOrderStatusSchema } from '@/lib/types/api'
import { canTransition } from '@/lib/orders/state-machine'
import { apiError, apiSuccess, getAuthenticatedUser } from '@/lib/api/helpers'
import { autoChargeGuestOrder } from '@/lib/orders/auto-charge'
import { notifyOrderStatusChange } from '@/lib/twilio/notify'
import type { Order, OrderStatus } from '@/lib/types/database'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)
  if (!user) return apiError('Unauthorized', 401)

  const body = await request.json()
  const parsed = updateOrderStatusSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 400)
  }
  const { status: newStatus } = parsed.data

  const { data: order } = await supabase
    .from('orders')
    .select('id, orderer_id, swiper_id, status')
    .eq('id', id)
    .single()

  if (!order) return apiError('Order not found', 404)

  if (!canTransition(order.status as OrderStatus, newStatus)) {
    return apiError(
      `Cannot transition from ${order.status} to ${newStatus}`,
      400
    )
  }

  // Authorization: orderer can cancel pending; swiper drives the rest
  const isOrderer = order.orderer_id === user.id
  const isSwiper = order.swiper_id === user.id

  if (newStatus === 'cancelled') {
    if (isOrderer && order.status !== 'pending') {
      return apiError('Orderer can only cancel pending orders', 403)
    }
    if (!isOrderer && !isSwiper) {
      return apiError('Not authorized to cancel this order', 403)
    }
  } else {
    // accepted, in_progress, completed — swiper only
    if (!isSwiper) {
      return apiError('Only the swiper can update this status', 403)
    }
  }

  // Atomic: only update if status still matches what we read (prevents race)
  const { data: updated, error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', id)
    .eq('status', order.status)
    .select(
      'id, orderer_id, swiper_id, eatery_id, status, items, total_cents, tip_cents, special_instructions, guest_name, guest_phone, guest_stripe_pm_id, created_at, updated_at'
    )
    .single()

  if (error || !updated) {
    return apiError('Order status was changed by another request', 409)
  }

  // Auto-charge guest orders on completion
  if (newStatus === 'completed' && updated.guest_stripe_pm_id) {
    await autoChargeGuestOrder(updated as Order)
  }

  void notifyOrderStatusChange(updated as Order, newStatus as OrderStatus)

  // Strip guest payment method from response
  const { guest_stripe_pm_id: _, ...responseData } = updated
  return apiSuccess(responseData)
}
