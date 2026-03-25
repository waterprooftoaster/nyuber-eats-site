import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/api/helpers'
import { SwiperRegistrationForm } from './swiper-registration-form'

export default async function SwiperRegistrationPage() {
  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)
  if (!user) redirect('/auth/login')

  const [profileResult, schoolsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('school_id, is_swiper')
      .eq('id', user.id)
      .single(),
    supabase.from('schools').select('id, name').order('name'),
  ])

  if (profileResult.error) {
    throw new Error(`Failed to load profile: ${profileResult.error.message}`)
  }
  if (schoolsResult.error) {
    throw new Error(`Failed to load schools: ${schoolsResult.error.message}`)
  }

  const profile = profileResult.data
  if (profile.is_swiper) redirect('/account')

  const schools = schoolsResult.data
  const currentSchool = profile?.school_id
    ? schools.find((s) => s.id === profile.school_id) ?? null
    : null

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-md p-8">
        <SwiperRegistrationForm
          schoolId={profile?.school_id ?? null}
          schoolName={currentSchool?.name ?? null}
          schools={schools}
        />
      </div>
    </main>
  )
}
