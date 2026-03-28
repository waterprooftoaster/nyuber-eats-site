'use client'

import { useChatPanel } from './chat-panel-context'
import type { OrderEntry } from './chat-panel-context'
import { ChatView } from '@/components/chat/chat-view'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const PANEL_WIDTH = 360
const PANEL_GAP = 16
const PANEL_MARGIN = 16

// Pre-computed right-offset classes for up to 4 concurrent panels.
// Tailwind JIT requires these to appear as static strings in source.
const PANEL_RIGHT_CLASSES = [
  'right-4',        // index 0: 16px  (rightmost = newest)
  'right-[392px]',  // index 1: 16 + 360 + 16
  'right-[768px]',  // index 2: 16 + 2*(360+16)
  'right-[1144px]', // index 3: 16 + 3*(360+16)
]

interface PanelProps {
  entry: OrderEntry
  /** 0 = newest/rightmost; also the one shown on mobile */
  index: number
  currentUserId: string
  onToggle: (orderId: string) => void
}

function ChatPanelItem({ entry, index, currentUserId, onToggle }: PanelProps) {
  const { orderId, status, isExpanded } = entry
  const shortId = orderId.slice(0, 8)
  const rightClass = PANEL_RIGHT_CLASSES[index] ?? `right-[${PANEL_MARGIN + index * (PANEL_WIDTH + PANEL_GAP)}px]`
  // Only the first (newest) panel is visible on mobile; all others are hidden
  const mobileClass = index === 0
    ? 'max-sm:inset-x-0 max-sm:bottom-0 max-sm:right-0'
    : 'max-sm:hidden'

  if (!isExpanded) {
    return (
      <div className={cn('fixed z-50 bottom-4', rightClass, mobileClass)}>
        <button
          onClick={() => onToggle(orderId)}
          className={cn(
            'flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:bg-gray-800',
            index === 0 && 'max-sm:w-full max-sm:justify-between max-sm:rounded-none max-sm:shadow-none'
          )}
        >
          <span>Order #{shortId}</span>
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'fixed z-50 bottom-4 flex flex-col rounded-lg border border-gray-200 bg-white shadow-xl',
        'w-[360px] h-[28rem]',
        rightClass,
        mobileClass,
        index === 0 && 'max-sm:bottom-0 max-sm:w-full max-sm:rounded-none max-sm:border-x-0 max-sm:border-b-0 max-sm:border-t'
      )}
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2.5">
        <span className="text-sm font-semibold">Order #{shortId}</span>
        <button
          onClick={() => onToggle(orderId)}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Minimize chat"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <ChatView orderId={orderId} currentUserId={currentUserId} orderStatus={status} />
      </div>
    </div>
  )
}

interface Props {
  currentUserId: string | null
}

export function ChatPanel({ currentUserId }: Props) {
  const { orders, toggleMinimize } = useChatPanel()

  if (!currentUserId) return null

  const panelList = Object.values(orders)
  if (panelList.length === 0) return null

  // Reverse so newest order is at index 0 (rightmost on desktop, shown on mobile)
  const reversed = [...panelList].reverse()

  return (
    <>
      {reversed.map((entry, index) => (
        <ChatPanelItem
          key={entry.orderId}
          entry={entry}
          index={index}
          currentUserId={currentUserId}
          onToggle={toggleMinimize}
        />
      ))}
    </>
  )
}
