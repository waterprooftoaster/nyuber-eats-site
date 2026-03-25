import Link from 'next/link'

export default function StripeOnboardRefreshPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-md p-8">
        <h1 className="text-2xl font-bold mb-4">Session expired</h1>
        <p className="text-gray-600 mb-8">
          Your Stripe onboarding session has expired. Return to your account
          settings to start a new session.
        </p>
        <Link
          href="/swiper-registration"
          className="inline-block rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
        >
          Return to swiper registration
        </Link>
      </div>
    </main>
  )
}
