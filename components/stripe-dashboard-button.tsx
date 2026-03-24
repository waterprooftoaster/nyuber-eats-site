'use client'

import { ExternalLink } from 'lucide-react'
import { useState } from 'react'

const navBtnClass =
  'flex items-center gap-3 w-full rounded-lg px-4 py-3 text-black text-sm font-medium hover:bg-black/10 transition-colors'

export function StripeDashboardButton() {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/connect/dashboard', { method: 'POST' })
      const json = await res.json()
      if (json.url) window.open(json.url, '_blank', 'noopener,noreferrer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleClick} disabled={loading} className={navBtnClass}>
      <ExternalLink className="h-5 w-5" />
      {loading ? 'Loading…' : 'Stripe Dashboard'}
    </button>
  )
}
