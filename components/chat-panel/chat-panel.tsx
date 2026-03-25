'use client'

import { useChatPanel } from './chat-panel-context'
import { ChatView } from '@/components/chat/chat-view'
import { ChevronUp, ChevronDown, X } from 'lucide-react'

interface Props {
  currentUserId: string | null
}

export function ChatPanel({ currentUserId }: Props) {
  const {
    activeOrderId,
    isExpanded,
    orderStatus,
    closePanel,
    toggleMinimize,
  } = useChatPanel()

  if (!activeOrderId || !currentUserId || !orderStatus) return null

  const shortId = activeOrderId.slice(0, 8)

  // Minimized: clickable bar
  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={toggleMinimize}
          className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:bg-gray-800"
        >
          <span>Order #{shortId}</span>
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>
    )
  }

  // Expanded: header chrome + ChatView
  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex w-[360px] max-sm:inset-x-0 max-sm:bottom-0 max-sm:right-0 max-sm:w-full flex-col rounded-lg max-sm:rounded-none border border-gray-200 bg-white shadow-xl"
      style={{ height: '28rem' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2.5">
        <span className="text-sm font-semibold">Order #{shortId}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleMinimize}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Minimize chat"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            onClick={closePanel}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Chat body */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <ChatView
          orderId={activeOrderId}
          currentUserId={currentUserId}
          orderStatus={orderStatus}
        />
      </div>
    </div>
  )
}
