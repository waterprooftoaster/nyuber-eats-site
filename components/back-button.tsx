'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export function BackButton() {
  const router = useRouter()
  return (
    <button
      type="button"
      aria-label="Go back"
      onClick={() => router.back()}
      className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
    >
      <ArrowLeft className="h-4 w-4 text-gray-700" />
    </button>
  )
}
