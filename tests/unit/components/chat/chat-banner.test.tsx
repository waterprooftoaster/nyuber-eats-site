import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChatBanner } from '@/components/chat/chat-banner'

describe('ChatBanner', () => {
  it('shows the order status badge', () => {
    render(<ChatBanner status="pending" />)
    expect(screen.getByText(/pending/i)).toBeInTheDocument()
  })

  it('formats in_progress as "In Progress"', () => {
    render(<ChatBanner status="in_progress" />)
    expect(screen.getByText('In Progress')).toBeInTheDocument()
  })

  it('does not show closed banner for pending', () => {
    render(<ChatBanner status="pending" />)
    expect(screen.queryByText(/conversation is closed/i)).not.toBeInTheDocument()
  })

  it('does not show closed banner for accepted', () => {
    render(<ChatBanner status="accepted" />)
    expect(screen.queryByText(/conversation is closed/i)).not.toBeInTheDocument()
  })

  it('does not show closed banner for in_progress', () => {
    render(<ChatBanner status="in_progress" />)
    expect(screen.queryByText(/conversation is closed/i)).not.toBeInTheDocument()
  })

  it('shows closed banner for completed', () => {
    render(<ChatBanner status="completed" />)
    expect(screen.getByText(/conversation is closed/i)).toBeInTheDocument()
  })

  it('shows closed banner for paid', () => {
    render(<ChatBanner status="paid" />)
    expect(screen.getByText(/conversation is closed/i)).toBeInTheDocument()
  })

  it('shows closed banner for cancelled', () => {
    render(<ChatBanner status="cancelled" />)
    expect(screen.getByText(/conversation is closed/i)).toBeInTheDocument()
  })
})
