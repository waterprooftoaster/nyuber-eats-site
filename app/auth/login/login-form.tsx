'use client'

import { useActionState, useEffect, useState } from 'react'
import { authenticate, signInWithGoogle, completeOnboarding } from '@/app/auth/actions'
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from '@/components/ui/combobox'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface School {
  id: string
  name: string
}

export function LoginForm({
  callbackError,
  schools,
  initialOnboarding,
  userEmail,
}: {
  callbackError?: string
  schools: School[]
  initialOnboarding?: boolean
  userEmail?: string
}) {
  const [step, setStep] = useState<'email' | 'password' | 'onboarding'>(
    initialOnboarding ? 'onboarding' : 'email',
  )
  const [email, setEmail] = useState(userEmail ?? '')
  const [emailError, setEmailError] = useState('')
  const [selectedSchool, setSelectedSchool] = useState<{ value: string; label: string } | null>(null)

  const [authState, formAction, authPending] = useActionState(authenticate, null)
  const [onboardingState, onboardingAction, onboardingPending] = useActionState(
    completeOnboarding,
    null,
  )

  // Transition to onboarding when authenticate signals it
  useEffect(() => {
    if (authState && 'needsOnboarding' in authState) {
      setEmail(authState.email)
      setStep('onboarding')
    }
  }, [authState])

  const inputStyle =
    'block w-full h-12 rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-1 focus:ring-black'

  function handleContinue() {
    if (!email || !EMAIL_REGEX.test(email)) {
      setEmailError('Please enter a valid email address.')
      return
    }
    setEmailError('')
    setStep('password')
  }

  const error =
    (authState && 'error' in authState ? authState.error : null) ?? callbackError

  return (
    <main className="flex min-h-screen items-center justify-center bg-white pb-24">
      <div className="w-full max-w-sm space-y-4 p-8">
        {step === 'email' && (
          <>
            {callbackError && (
              <p className="text-sm text-red-600 text-center">{callbackError}</p>
            )}

            <div>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleContinue()
                  }
                }}
                className={inputStyle}
              />
              {emailError && (
                <p className="mt-1 text-sm text-red-600">{emailError}</p>
              )}
            </div>

            <button
              type="button"
              onClick={handleContinue}
              className="w-full h-12 rounded-md bg-black text-white hover:bg-gray-800"
            >
              Continue
            </button>

            <form action={signInWithGoogle}>
              <button
                type="submit"
                className="w-full h-12 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Continue with Google
              </button>
            </form>
          </>
        )}

        {step === 'password' && (
          <>
            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <button
              type="button"
              onClick={() => setStep('email')}
              className="text-sm text-gray-500 hover:text-black"
            >
              &larr; Back
            </button>

            <form action={formAction} className="space-y-4">
              <input type="hidden" name="email" value={email} />

              <input
                name="password"
                type="password"
                placeholder="Password"
                required
                minLength={6}
                className={inputStyle}
              />

              <div>
                <input
                  name="confirm_password"
                  type="password"
                  placeholder="Confirm Password"
                  className={inputStyle}
                />
                <p className="mt-1 text-xs text-gray-400">
                  Leave empty to sign in to an existing account
                </p>
              </div>

              <button
                type="submit"
                disabled={authPending}
                className="w-full h-12 rounded-md bg-black text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {authPending ? '...' : 'Submit'}
              </button>
            </form>
          </>
        )}

        {step === 'onboarding' && (
          <>
            {onboardingState && 'error' in onboardingState && (
              <p className="text-sm text-red-600 text-center">
                {onboardingState.error}
              </p>
            )}

            <form action={onboardingAction} className="space-y-6">
              <div className="space-y-2">
                <p className="text-base font-medium text-gray-900">
                  What should we call you?
                </p>
                <input
                  name="username"
                  type="text"
                  placeholder="Username"
                  required
                  maxLength={50}
                  pattern="[a-zA-Z0-9_.\-]+"
                  title="Letters, numbers, underscores, hyphens, and periods only"
                  className={inputStyle}
                />
              </div>

              <div className="space-y-2">
                <p className="text-base font-medium text-gray-900">
                  What school do you go to?
                </p>
                <p className="text-sm text-gray-400">
                  don't worry, you can leave this blank
                </p>
                <Combobox
                  value={selectedSchool}
                  onValueChange={(value) =>
                    setSelectedSchool(value as { value: string; label: string } | null)
                  }
                  isItemEqualToValue={(a, b) => a.value === b.value}
                >
                  <ComboboxInput
                    placeholder="Search schools..."
                    className="h-12 rounded-md border-gray-300 focus:border-black focus:ring-1 focus:ring-black"
                  />
                  <ComboboxContent>
                    <ComboboxList>
                      {schools.map((school) => (
                        <ComboboxItem
                          key={school.id}
                          value={{ value: school.id, label: school.name }}
                        >
                          {school.name}
                        </ComboboxItem>
                      ))}
                      <ComboboxEmpty>No schools found</ComboboxEmpty>
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                <input type="hidden" name="school_id" value={selectedSchool?.value ?? ''} />
              </div>

              <button
                type="submit"
                disabled={onboardingPending}
                className="w-full h-12 rounded-md bg-black text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {onboardingPending ? '...' : 'Get Started'}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  )
}
