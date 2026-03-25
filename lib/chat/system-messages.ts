import { createServiceClient } from '@/lib/supabase/service'

export async function sendSystemMessage(orderId: string, text: string): Promise<void> {
  const service = createServiceClient()

  const { data: conversation } = await service
    .from('conversations')
    .select('id')
    .eq('order_id', orderId)
    .single()

  if (!conversation) return

  await service.from('messages').insert({
    conversation_id: conversation.id,
    sender_id: null,
    body: text,
    message_type: 'system',
  })
}

