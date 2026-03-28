'use client'

import type { OrderStatus } from '@/lib/types/database'

const ORDERED_STATUSES: OrderStatus[] = ['pending', 'accepted', 'in_progress', 'completed', 'paid']

const STATUS_MESSAGES: Partial<Record<OrderStatus, string>> = {
  pending:     'Your order is confirmed!',
  accepted:    'A swiper has accepted your order!',
  in_progress: 'Your swiper is getting your food.',
  completed:   'Order complete!',
}

function getStatusMessages(status: string): string[] {
  if (status === 'cancelled') {
    return ['Your order is confirmed!', 'This order was cancelled.']
  }
  const messages: string[] = []
  for (const s of ORDERED_STATUSES) {
    const msg = STATUS_MESSAGES[s]
    if (msg) messages.push(msg)
    if (s === status) break
  }
  return messages
}

interface Props {
  status: string
}

export function ChatStatusMessages({ status }: Props) {
  const messages = getStatusMessages(status)
  return (
    <div className="px-4 pt-3">
      {messages.map((msg) => (
        <div key={msg} className="mb-2 ml-auto max-w-[75%]">
          <div className="rounded-2xl rounded-br-sm bg-black px-3 py-2 text-sm text-white">
            {msg}
          </div>
        </div>
      ))}
    </div>
  )
}
