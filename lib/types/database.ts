export interface Profile {
  id: string
  username: string
  email: string
  school_id: string | null
  avatar_url: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'paid'
  | 'cancelled'

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded'

export interface OrderItem {
  menu_item_id: string
  name: string
  price_cents: number
  quantity: number
}

export interface Order {
  id: string
  orderer_id: string | null
  swiper_id: string | null
  eatery_id: string
  status: OrderStatus
  items: OrderItem[]
  total_cents: number
  tip_cents: number
  special_instructions: string | null
  guest_name: string | null
  guest_phone: string | null
  guest_stripe_pm_id: string | null
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  order_id: string
  stripe_payment_intent_id: string
  amount_cents: number
  platform_fee_cents: number
  status: PaymentStatus
  payer_id: string | null
  payee_id: string
  created_at: string
}

export interface StripeAccount {
  id: string
  user_id: string
  stripe_account_id: string
  onboarding_complete: boolean
  created_at: string
}
