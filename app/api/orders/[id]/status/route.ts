import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateOrderStatusSchema } from '@/lib/types/api'
import { canTransition } from '@/lib/orders/state-machine'
import { apiError, apiSuccess, getAuthenticatedUser } from '@/lib/api/helpers'
import { transferToSwiper } from '@/lib/stripe/transfer'
import { sendSystemMessage } from '@/lib/chat/system-messages'
import type { OrderStatus } from '@/lib/types/database'

const STATUS_MESSAGES: Partial<Record<string, string>> = {
  in_progress: 'Swiper is preparing your order',
  completed: 'Order completed — check delivery photo',
  cancelled: 'Order was cancelled',
}

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

  // Completion guards: payment must exist + delivery photo required
  if (newStatus === 'completed') {
    const { data: payment } = await supabase
      .from('payments')
      .select('id')
      .eq('order_id', id)
      .eq('status', 'succeeded')
      .maybeSingle()

    if (!payment) {
      return apiError('Order cannot be completed: payment not confirmed', 400)
    }

    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('order_id', id)
      .single()

    if (conv) {
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .eq('message_type', 'delivery_photo')

      if (!count || count === 0) {
        return apiError('A delivery photo is required to complete the order', 400)
      }
    }
  }

  // Atomic: only update if status still matches what we read (prevents race)
  const { data: updated, error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', id)
    .eq('status', order.status)
    .select(
      'id, orderer_id, swiper_id, eatery_id, status, items, total_cents, tip_cents, special_instructions, guest_name, guest_phone, created_at, updated_at'
    )
    .single()

  if (error || !updated) {
    return apiError('Order status was changed by another request', 409)
  }

  // Transfer funds to swiper (payment captured at checkout for both guest and auth)
  if (newStatus === 'completed' && updated.swiper_id) {
    await transferToSwiper(updated.id, updated.swiper_id, updated.total_cents, updated.tip_cents)
  }

  if (STATUS_MESSAGES[newStatus]) {
    await sendSystemMessage(id, STATUS_MESSAGES[newStatus]!)
  }

  return apiSuccess(updated)
}
