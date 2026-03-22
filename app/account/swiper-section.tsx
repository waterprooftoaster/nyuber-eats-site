'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type School = { id: string; name: string }

type Props = {
  profile: { is_swiper: boolean; school_id: string | null }
  stripeAccount: { onboarding_complete: boolean } | null
  schools: School[]
}

export function SwiperSection({ profile, stripeAccount, schools }: Props) {
  const router = useRouter()

  const [schoolId, setSchoolId] = useState<string>(profile.school_id ?? '')
  const [schoolSaved, setSchoolSaved] = useState(profile.school_id !== null)
  const [saving, setSaving] = useState(false)
  const [linking, setLinking] = useState(false)
  const [activating, setActivating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [schoolSavedMsg, setSchoolSavedMsg] = useState(false)

  const stripeConnected = stripeAccount?.onboarding_complete === true

  async function handleSaveSchool() {
    if (!schoolId) return
    setSaving(true)
    setError(null)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ school_id: schoolId }),
    })
    setSaving(false)
    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Failed to save school')
      return
    }
    setSchoolSaved(true)
    setSchoolSavedMsg(true)
    setTimeout(() => setSchoolSavedMsg(false), 3000)
    router.refresh()
  }

  async function handleLinkPayment() {
    setLinking(true)
    setError(null)
    // Create Stripe account if not exists
    const createRes = await fetch('/api/stripe/connect/create', { method: 'POST' })
    if (!createRes.ok && createRes.status !== 409) {
      const body = await createRes.json()
      setError(body.error ?? 'Failed to create payment account')
      setLinking(false)
      return
    }
    // Get onboarding link
    const onboardRes = await fetch('/api/stripe/connect/onboard')
    if (!onboardRes.ok) {
      const body = await onboardRes.json()
      setError(body.error ?? 'Failed to get onboarding link')
      setLinking(false)
      return
    }
    const { url } = await onboardRes.json()
    window.location.href = url
  }

  async function handleActivate() {
    setActivating(true)
    setError(null)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_swiper: true }),
    })
    setActivating(false)
    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Failed to activate swiper status')
      return
    }
    router.refresh()
  }

  if (profile.is_swiper) {
    return <SwiperStatus
      profile={profile}
      stripeConnected={stripeConnected}
      schools={schools}
    />
  }

  return (
    <div className="space-y-6">
      <hr className="border-gray-200" />
      <div>
        <h2 className="text-lg font-semibold mb-1">Become a Swiper</h2>
        <p className="text-sm text-gray-500 mb-4">
          Fulfill orders using your meal plan and earn $6 per item.
        </p>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {/* Step 1: School */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            {schoolSaved ? '✓' : '○'} Step 1 — Select your school
          </p>
          <div className="flex gap-2">
            <select
              name="school_id"
              value={schoolId}
              onChange={(e) => {
                setSchoolId(e.target.value)
                setSchoolSaved(false)
              }}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">Select a school…</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleSaveSchool}
              disabled={saving || !schoolId || schoolId === profile.school_id}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save School'}
            </button>
          </div>
          {schoolSavedMsg && (
            <p className="text-sm text-green-600 mt-1">School saved</p>
          )}
        </div>

        {/* Step 2: Payment */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-2">
            {stripeConnected ? '✓' : '○'} Step 2 — Link your payment account
          </p>
          {stripeConnected ? (
            <p className="text-sm text-green-600">Payment account connected.</p>
          ) : (
            <button
              onClick={handleLinkPayment}
              disabled={linking || !schoolSaved}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {linking ? 'Opening Stripe…' : 'Link Payment Account'}
            </button>
          )}
        </div>

        {/* Activate */}
        {schoolSaved && stripeConnected && (
          <button
            onClick={handleActivate}
            disabled={activating}
            className="w-full rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {activating ? 'Activating…' : 'Activate Swiper Status'}
          </button>
        )}
      </div>
    </div>
  )
}

type SwiperStatusProps = {
  profile: { school_id: string | null }
  stripeConnected: boolean
  schools: School[]
}

function SwiperStatus({ profile, stripeConnected, schools }: SwiperStatusProps) {
  const [changingSchool, setChangingSchool] = useState(false)
  const [schoolId, setSchoolId] = useState(profile.school_id ?? '')
  const [saving, setSaving] = useState(false)
  const [linking, setLinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [schoolSavedMsg, setSchoolSavedMsg] = useState(false)
  const router = useRouter()

  const currentSchool = schools.find((s) => s.id === profile.school_id)

  async function handleSaveSchool() {
    if (!schoolId) return
    setSaving(true)
    setError(null)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ school_id: schoolId }),
    })
    setSaving(false)
    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Failed to save school')
      return
    }
    setChangingSchool(false)
    setSchoolSavedMsg(true)
    setTimeout(() => setSchoolSavedMsg(false), 3000)
    router.refresh()
  }

  async function handleRelinkPayment() {
    setLinking(true)
    setError(null)
    const onboardRes = await fetch('/api/stripe/connect/onboard')
    if (!onboardRes.ok) {
      const body = await onboardRes.json()
      setError(body.error ?? 'Failed to get onboarding link')
      setLinking(false)
      return
    }
    const { url } = await onboardRes.json()
    window.location.href = url
  }

  return (
    <div className="space-y-6">
      <hr className="border-gray-200" />
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold">Swiper</h2>
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            Active
          </span>
        </div>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        {schoolSavedMsg && <p className="text-sm text-green-600 mb-3">School saved</p>}

        {/* School */}
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-1">School</p>
          {!changingSchool ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{currentSchool?.name ?? '—'}</span>
              <button
                onClick={() => setChangingSchool(true)}
                className="text-sm text-gray-500 underline hover:text-gray-700"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <select
                name="school_id"
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">Select a school…</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleSaveSchool}
                disabled={saving || !schoolId}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save School'}
              </button>
              <button
                onClick={() => setChangingSchool(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Stripe status */}
        <div>
          <p className="text-sm text-gray-500 mb-1">Payment account</p>
          {stripeConnected ? (
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Connected
              </span>
              <button
                onClick={handleRelinkPayment}
                disabled={linking}
                className="text-sm text-gray-500 underline hover:text-gray-700 disabled:opacity-50"
              >
                {linking ? 'Opening Stripe…' : 'Update payment info'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                Pending
              </span>
              <button
                onClick={handleRelinkPayment}
                disabled={linking}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {linking ? 'Opening Stripe…' : 'Complete Payment Setup'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
