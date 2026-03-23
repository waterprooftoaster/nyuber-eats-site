import { NextRequest } from 'next/server'
import { validateRequest } from 'twilio'
import { createServiceClient } from '@/lib/supabase/service'
import { notifyNewMessage } from '@/lib/twilio/notify'
import { findActiveProxySession } from '@/lib/twilio/proxy'
import { sendSMS } from '@/lib/twilio/sms'

export async function POST(request: NextRequest) {
  // Validate Twilio signature
  const signature = request.headers.get('x-twilio-signature')
  if (!signature) {
    return new Response('Missing signature', { status: 403 })
  }

  const formData = await request.formData()
  const params: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    params[key] = value as string
  }

  const url = process.env.TWILIO_WEBHOOK_BASE_URL
    ? `${process.env.TWILIO_WEBHOOK_BASE_URL}/api/sms/webhook`
    : request.url
  const isValid = validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    signature,
    url,
    params
  )

  if (!isValid) {
    return new Response('Invalid signature', { status: 403 })
  }

  const from = params.From
  const body = params.Body
  if (!from || !body) {
    return new Response('<Response/>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  const supabase = createServiceClient()

  // Proxy routing: check for an active proxy session before falling back to
  // the web-messaging flow. This handles the anonymous SMS relay between
  // orderers and swipers without exposing real phone numbers.
  const proxyResult = await findActiveProxySession(from)
  if (proxyResult) {
    await supabase.from('messages').insert({
      conversation_id: proxyResult.conversationId,
      sender_id: proxyResult.senderId,
      body: body.slice(0, 1000),
    })
    // Forward full message body to the other party — no dedupeKey so every
    // text is forwarded regardless of timing
    void sendSMS(proxyResult.recipientPhone, body.slice(0, 1000))
    return new Response('<Response/>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  // Non-proxy path: look up sender by phone, find their conversation, and
  // send a notification preview to the other party
  let senderId: string | null = null
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('phone', from)
    .single()

  if (profile) {
    senderId = profile.id
  }

  // Find most recent active conversation for this user
  let conversation = null

  if (senderId) {
    // Authenticated user — find conversation where they are orderer or swiper
    const { data } = await supabase
      .from('conversations')
      .select('id, order_id')
      .or(`orderer_id.eq.${senderId},swiper_id.eq.${senderId}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    conversation = data
  }

  if (!conversation) {
    // Check guest orders by phone
    const { data: guestOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('guest_phone', from)
      .not('status', 'in', '("paid","cancelled")')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (guestOrder) {
      const { data } = await supabase
        .from('conversations')
        .select('id, order_id')
        .eq('order_id', guestOrder.id)
        .single()
      conversation = data
    }
  }

  if (!conversation) {
    return new Response('<Response/>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  // Insert message via service client
  await supabase.from('messages').insert({
    conversation_id: conversation.id,
    sender_id: senderId,
    body: body.slice(0, 1000),
  })

  void notifyNewMessage(conversation.order_id, senderId, body.slice(0, 1000))

  return new Response('<Response/>', {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  })
}
