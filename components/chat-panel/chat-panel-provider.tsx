'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChatPanelContext } from './chat-panel-context'
import type { OrderStatus } from '@/lib/types/database'

const TERMINAL_STATUSES: OrderStatus[] = ['paid', 'cancelled']

interface Props {
  userId: string | null
  children: React.ReactNode
}

export function ChatPanelProvider({ userId, children }: Props) {
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null)
  const activeOrderIdRef = useRef<string | null>(null)

  // Keep ref in sync so the Realtime callback always sees the latest value
  useEffect(() => {
    activeOrderIdRef.current = activeOrderId
  }, [activeOrderId])

  const openPanel = useCallback((orderId: string, status: OrderStatus = 'accepted') => {
    setActiveOrderId(orderId)
    setIsExpanded(true)
    setOrderStatus(status)
  }, [])

  const closePanel = useCallback(() => {
    setActiveOrderId(null)
    setIsExpanded(false)
    setOrderStatus(null)
  }, [])

  const toggleMinimize = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  // Orderer trigger: listen for any of the user's orders transitioning to 'accepted'
  useEffect(() => {
    if (!userId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`orders:orderer:${userId}`)
      .on<{ id: string; status: OrderStatus }>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `orderer_id=eq.${userId}`,
        },
        (payload) => {
          if (
            payload.new.status === 'accepted' &&
            activeOrderIdRef.current === null
          ) {
            openPanel(payload.new.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, openPanel])

  // Order lifecycle tracking: watch for terminal status on the active order
  useEffect(() => {
    if (!activeOrderId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`orders:active:${activeOrderId}`)
      .on<{ id: string; status: OrderStatus }>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${activeOrderId}`,
        },
        (payload) => {
          const newStatus = payload.new.status
          setOrderStatus(newStatus)
          if (TERMINAL_STATUSES.includes(newStatus)) {
            closePanel()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeOrderId, closePanel])

  return (
    <ChatPanelContext.Provider
      value={{
        activeOrderId,
        isExpanded,
        orderStatus,
        openPanel,
        closePanel,
        toggleMinimize,
      }}
    >
      {children}
    </ChatPanelContext.Provider>
  )
}
