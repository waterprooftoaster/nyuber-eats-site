export interface Conversation {
  id: string
  order_id: string
  orderer_id: string | null
  swiper_id: string
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string | null
  body: string
  sent_at: string
  read_at: string | null
}
