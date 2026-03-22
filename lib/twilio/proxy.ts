import 'server-only'

import { createServiceClient } from '@/lib/supabase/service'

export type ProxyRole = 'orderer' | 'swiper'

export type ProxyLookupResult = {
  conversationId: string
  senderId: string | null
  recipientPhone: string
  role: ProxyRole
  sessionId: string
}

export async function createProxySession(params: {
  orderId: string
  conversationId: string
  ordererPhone: string
  ordererId: string | null
  swiperPhone: string
  swiperId: string
}): Promise<void> {
  const supabase = createServiceClient()
  await supabase.from('proxy_sessions').insert({
    order_id: params.orderId,
    conversation_id: params.conversationId,
    orderer_phone: params.ordererPhone,
    orderer_id: params.ordererId,
    swiper_phone: params.swiperPhone,
    swiper_id: params.swiperId,
  })
}

export async function findActiveProxySession(
  fromPhone: string
): Promise<ProxyLookupResult | null> {
  const supabase = createServiceClient()

  // Check if this phone belongs to the orderer side of an active session
  const { data: asOrderer } = await supabase
    .from('proxy_sessions')
    .select('id, conversation_id, orderer_id, swiper_phone')
    .eq('orderer_phone', fromPhone)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (asOrderer) {
    return {
      conversationId: asOrderer.conversation_id,
      senderId: asOrderer.orderer_id,
      recipientPhone: asOrderer.swiper_phone,
      role: 'orderer',
      sessionId: asOrderer.id,
    }
  }

  // Check if this phone belongs to the swiper side of an active session
  const { data: asSwiper } = await supabase
    .from('proxy_sessions')
    .select('id, conversation_id, swiper_id, orderer_phone')
    .eq('swiper_phone', fromPhone)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (asSwiper) {
    return {
      conversationId: asSwiper.conversation_id,
      senderId: asSwiper.swiper_id,
      recipientPhone: asSwiper.orderer_phone,
      role: 'swiper',
      sessionId: asSwiper.id,
    }
  }

  return null
}

export async function deactivateProxySession(orderId: string): Promise<void> {
  const supabase = createServiceClient()
  await supabase
    .from('proxy_sessions')
    .update({ is_active: false })
    .eq('order_id', orderId)
    .eq('is_active', true)
}
