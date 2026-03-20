import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/header'
import { AccountActions } from './account-actions'

export default async function AccountPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <div className="mx-auto max-w-md p-8">
        <h1 className="text-2xl font-bold mb-4">Account</h1>
        <p className="text-gray-600 mb-8">{user.email}</p>
        <AccountActions />
      </div>
    </main>
  )
}
