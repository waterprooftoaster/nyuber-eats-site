import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/api/helpers'
import { redirect } from 'next/navigation'

export default async function SwiperLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_swiper')
    .eq('id', user.id)
    .single()

  if (!profile?.is_swiper) redirect('/swiper-registration')

  return <>{children}</>
}
