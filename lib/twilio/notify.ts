import 'server-only'

import { createServiceClient } from '@/lib/supabase/service'
import { sendSMS } from './sms'
import * as templates from './templates'
import { createProxySession, deactivateProxySession } from './proxy'
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
    .select('username')
    .eq('id', userId)
    .single()
  return data?.username ?? 'Someone'
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

  if (newStatus === 'accepted') {
    await notifyProxyAccepted(order)
    return
  }

  const phone = await getOrdererPhone(order)
  if (!phone) return

  let body: string
  switch (newStatus) {
    case 'in_progress':
      body = templates.orderInProgress()
      break
    case 'completed':
      body = templates.orderCompleted()
      void deactivateProxySession(order.id)
      break
    default:
      return
  }

  await sendSMS(phone, body, `order:${order.id}:${newStatus}`)
}

async function notifyProxyAccepted(order: Order): Promise<void> {
  if (!order.swiper_id) return

  const supabase = createServiceClient()

  const [ordererPhone, swiperPhone, swiperName, convResult] = await Promise.all([
    getOrdererPhone(order),
    getSwiperPhone(order.swiper_id),
    getDisplayName(order.swiper_id),
    supabase.from('conversations').select('id').eq('order_id', order.id).single(),
  ])

  const conv = convResult.data

  if (!ordererPhone || !swiperPhone || !conv) {
    // Graceful fallback: notify orderer only with basic message
    if (ordererPhone) {
      await sendSMS(
        ordererPhone,
        templates.orderAccepted(swiperName),
        `order:${order.id}:accepted`
      )
    }
    return
  }

  await createProxySession({
    orderId: order.id,
    conversationId: conv.id,
    ordererPhone,
    ordererId: order.orderer_id ?? null,
    swiperPhone,
    swiperId: order.swiper_id,
  })

  await Promise.all([
    sendSMS(
      ordererPhone,
      templates.proxyAcceptedOrderer(swiperName),
      `proxy:orderer:${order.id}`
    ),
    sendSMS(
      swiperPhone,
      templates.proxyAcceptedSwiper(),
      `proxy:swiper:${order.id}`
    ),
  ])
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
