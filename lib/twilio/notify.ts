import 'server-only'

import { createServiceClient } from '@/lib/supabase/service'
import { sendSMS } from './sms'
import * as templates from './templates'
import type { Order, OrderStatus } from '@/lib/types/database'

async function getOrdererPhone(order: Order): Promise<string | null> {
  if (order.orderer_id) {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', order.orderer_id)
      .single()
    if (data?.phone) return data.phone
  }
  return order.guest_phone ?? null
}

async function getSwiperPhone(swiperId: string): Promise<string | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('profiles')
    .select('phone')
    .eq('id', swiperId)
    .single()
  return data?.phone ?? null
}

async function getDisplayName(userId: string): Promise<string> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', userId)
    .single()
  return data?.display_name ?? 'Someone'
}

const NOTIFIABLE_STATUSES: Set<OrderStatus> = new Set([
  'accepted',
  'in_progress',
  'completed',
])

export async function notifyOrderStatusChange(
  order: Order,
  newStatus: OrderStatus
): Promise<void> {
  if (!NOTIFIABLE_STATUSES.has(newStatus)) return

  const phone = await getOrdererPhone(order)
  if (!phone) return

  let body: string
  switch (newStatus) {
    case 'accepted': {
      const name = order.swiper_id
        ? await getDisplayName(order.swiper_id)
        : 'A swiper'
      body = templates.orderAccepted(name)
      break
    }
    case 'in_progress':
      body = templates.orderInProgress()
      break
    case 'completed':
      body = templates.orderCompleted()
      break
    default:
      return
  }

  await sendSMS(phone, body, `order:${order.id}:${newStatus}`)
}

export async function notifyNewMessage(
  orderId: string,
  senderId: string | null,
  body: string
): Promise<void> {
  const supabase = createServiceClient()

  const { data: conversation } = await supabase
    .from('conversations')
    .select('orderer_id, swiper_id')
    .eq('order_id', orderId)
    .single()
  if (!conversation) return

  const { data: order } = await supabase
    .from('orders')
    .select('id, orderer_id, swiper_id, eatery_id, status, items, total_cents, tip_cents, special_instructions, guest_name, guest_phone, guest_stripe_pm_id, created_at, updated_at')
    .eq('id', orderId)
    .single()
  if (!order) return

  const isSenderSwiper = senderId === conversation.swiper_id
  const senderName = senderId ? await getDisplayName(senderId) : (order.guest_name ?? 'Guest')

  if (isSenderSwiper) {
    // Notify orderer
    const phone = await getOrdererPhone(order as Order)
    if (phone) {
      await sendSMS(phone, templates.newMessageFromSwiper(senderName, body), `msg:${orderId}:swiper`)
    }
  } else {
    // Notify swiper
    if (conversation.swiper_id) {
      const phone = await getSwiperPhone(conversation.swiper_id)
      if (phone) {
        await sendSMS(phone, templates.newMessageFromOrderer(senderName, body), `msg:${orderId}:orderer`)
      }
    }
  }
}
