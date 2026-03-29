'use client'

import { useEffect, useRef } from 'react'
import { useMessages } from '@/hooks/use-messages'
import { ChatThread } from '@/components/chat/chat-thread'
import { ChatInput } from '@/components/chat/chat-input'
import { CompletionBanner } from '@/components/chat/completion-banner'
import { OrderCompletionNotice } from '@/components/chat/order-completion-notice'
import type { OrderStatus } from '@/lib/types/database'

const CLOSED_STATUSES: OrderStatus[] = ['completed', 'cancelled']

interface Props {
  orderId: string
  currentUserId: string
  orderStatus: OrderStatus
}

export function ChatView({ orderId, currentUserId, orderStatus }: Props) {
  const { messages, conversation, isLoading, error, sendMessage } =
    useMessages(orderId)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isClosed = CLOSED_STATUSES.includes(orderStatus)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {conversation ? (
        <>
          <p className="px-4 py-2 text-xs text-gray-500 italic border-b border-gray-100">
            {currentUserId === conversation.orderer_id
              ? 'Type here to contact your swiper.'
              : 'Contact the orderer in this chat.'}
          </p>
          <ChatThread
            messages={messages}
            conversation={conversation}
            currentUserId={currentUserId}
            messagesEndRef={messagesEndRef}
          />
        </>
      ) : (
        <div className="flex-1" />
      )}
      {currentUserId === conversation?.swiper_id &&
        orderStatus === 'in_progress' && (
          <CompletionBanner orderId={orderId} />
        )}
      {orderStatus === 'completed' && currentUserId !== conversation?.swiper_id && (
        <OrderCompletionNotice />
      )}
      <ChatInput orderId={orderId} onSend={sendMessage} disabled={isClosed || !conversation} />
    </div>
  )
}
