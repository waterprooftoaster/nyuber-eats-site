import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AccountActions } from './account-actions'
import { SwiperSection } from './swiper-section'

export default async function AccountPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const [profileResult, stripeResult, schoolsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('is_swiper, school_id')
      .eq('id', user.id)
      .single(),
    supabase
      .from('stripe_accounts')
      .select('onboarding_complete')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase.from('schools').select('id, name').order('name'),
  ])

  const profile = profileResult.data ?? { is_swiper: false, school_id: null }
  const stripeAccount = stripeResult.data ?? null
  const schools = schoolsResult.data ?? []

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-md p-8">
        <h1 className="text-2xl font-bold mb-4">Account</h1>
        <p className="text-gray-600 mb-8">{user.email}</p>
        <AccountActions />
        <SwiperSection
          profile={profile}
          stripeAccount={stripeAccount}
          schools={schools}
        />
      </div>
    </main>
  )
}
