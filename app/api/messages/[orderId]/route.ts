import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, getAuthenticatedUser } from '@/lib/api/helpers'

const uuidSchema = z.string().uuid()

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params
  if (!uuidSchema.safeParse(orderId).success) {
    return apiError('Invalid order ID', 400)
  }

  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)
  if (!user) return apiError('Unauthorized', 401)

  // RLS filters to conversations where user is a participant
  const { data: conversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('order_id', orderId)
    .single()

  if (!conversation) {
    return apiError('Conversation not found', 404)
  }

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversation.id)
    .order('sent_at', { ascending: true })

  return apiSuccess({ conversation, messages: messages ?? [] })
}
