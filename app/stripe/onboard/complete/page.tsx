import Link from 'next/link'

export default function StripeOnboardCompletePage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-md p-8">
        <h1 className="text-2xl font-bold mb-4">Payment account linked!</h1>
        <p className="text-gray-600 mb-8">
          Your Stripe account is connected. Return to your account settings to
          activate your swiper status.
        </p>
        <Link
          href="/account"
          className="inline-block rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
        >
          Return to account settings
        </Link>
      </div>
    </main>
  )
}
