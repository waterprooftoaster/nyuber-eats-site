'use client'

import { useActionState, useState } from 'react'
import { authenticate, signInWithGoogle } from '@/app/auth/actions'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function LoginForm({ callbackError }: { callbackError?: string }) {
  const [step, setStep] = useState<'email' | 'password'>('email')
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [state, formAction, pending] = useActionState(authenticate, null)

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

  const error = state?.error ?? callbackError

  return (
    <main className="flex min-h-screen items-center justify-center bg-white pb-24">
      <div className="w-full max-w-sm space-y-4 p-8">
        {error && (step === 'password' || callbackError) && (
          <p className="text-sm text-red-600 text-center">{error}</p>
        )}

        {step === 'email' ? (
          <>
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
        ) : (
          <>
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
                disabled={pending}
                className="w-full h-12 rounded-md bg-black text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {pending ? '...' : 'Submit'}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  )
}
