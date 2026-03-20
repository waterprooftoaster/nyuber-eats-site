import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendMessageSchema } from '@/lib/types/api'
import { apiError, apiSuccess, getAuthenticatedUser } from '@/lib/api/helpers'
import { notifyNewMessage } from '@/lib/twilio/notify'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)
  if (!user) return apiError('Unauthorized', 401)

  const body = await request.json()
  const parsed = sendMessageSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 400)
  }
  const { order_id, body: messageBody } = parsed.data

  // Look up conversation by order_id (RLS filters to participant)
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('order_id', order_id)
    .single()

  if (!conversation) {
    return apiError('Conversation not found', 404)
  }

  // Insert message (RLS verifies participant + sender)
  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversation.id,
      sender_id: user.id,
      body: messageBody,
    })
    .select()
    .single()

  if (error) {
    return apiError('Failed to send message', 500)
  }

  void notifyNewMessage(order_id, user.id, messageBody)

  return apiSuccess(message, 201)
}
