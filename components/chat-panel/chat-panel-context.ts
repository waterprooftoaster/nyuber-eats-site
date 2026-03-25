'use client'

import { createContext, useContext } from 'react'
import type { OrderStatus } from '@/lib/types/database'

export interface ChatPanelState {
  activeOrderId: string | null
  isExpanded: boolean
  orderStatus: OrderStatus | null
  openPanel: (orderId: string, status?: OrderStatus) => void
  closePanel: () => void
  toggleMinimize: () => void
}

export const ChatPanelContext = createContext<ChatPanelState | null>(null)

export function useChatPanel(): ChatPanelState {
  const ctx = useContext(ChatPanelContext)
  if (!ctx) throw new Error('useChatPanel must be used inside ChatPanelProvider')
  return ctx
}
