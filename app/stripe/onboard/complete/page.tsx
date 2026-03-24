import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getStripe } from '@/lib/stripe/client'

export default async function StripeOnboardCompletePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: stripeRow } = await supabase
    .from('stripe_accounts')
    .select('stripe_account_id, onboarding_complete')
    .eq('user_id', user.id)
    .maybeSingle()

  // Sync Stripe status directly to avoid webhook race condition:
  // the account.updated webhook may not have arrived yet when the user
  // is redirected back here, so we check Stripe directly and update the DB.
  if (stripeRow && !stripeRow.onboarding_complete) {
    try {
      const account = await getStripe().accounts.retrieve(stripeRow.stripe_account_id)
      if (account.details_submitted && account.charges_enabled) {
        await createServiceClient()
          .from('stripe_accounts')
          .update({ onboarding_complete: true })
          .eq('stripe_account_id', stripeRow.stripe_account_id)
      }
    } catch {
      // non-fatal: the webhook will update the DB if this call fails
    }
  }

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
