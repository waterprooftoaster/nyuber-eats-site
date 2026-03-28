'use client'

import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  orderId: string
}

type Step = 'idle' | 'prompt'

export function CompletionBanner({ orderId }: Props) {
  const [step, setStep] = useState<Step>('idle')
  const [uploading, setUploading] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (done) return null

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const uploadRes = await fetch(`/api/messages/${orderId}/upload`, {
        method: 'POST',
        body: fd,
      })
      if (!uploadRes.ok) {
        const json = await uploadRes.json().catch(() => ({}))
        setError((json as { error?: string }).error ?? 'Upload failed')
        return
      }
    } catch {
      setError('Network error — upload failed')
      return
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }

    setCompleting(true)
    try {
      const patchRes = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      })
      if (patchRes.ok) {
        setDone(true)
      } else {
        const json = await patchRes.json().catch(() => ({}))
        setError((json as { error?: string }).error ?? 'Failed to complete order')
      }
    } catch {
      setError('Network error — could not complete order')
    } finally {
      setCompleting(false)
    }
  }

  const isBusy = uploading || completing

  return (
    <div className="border-t border-amber-200 bg-amber-50 px-4 py-3">
      {step === 'idle' ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-amber-800">Ready to complete this order?</p>
          <Button size="sm" onClick={() => setStep('prompt')}>
            Complete Order
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-amber-800">Upload a photo of where you left the food:</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileChange}
            disabled={isBusy}
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={isBusy}
              onClick={() => fileInputRef.current?.click()}
            >
              {isBusy ? (
                <>
                  <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {uploading ? 'Uploading…' : 'Completing…'}
                </>
              ) : (
                'Choose Photo'
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={isBusy}
              onClick={() => {
                setStep('idle')
                setError(null)
              }}
            >
              Cancel
            </Button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  )
}
