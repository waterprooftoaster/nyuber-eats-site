'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const FULL_NAME_REGEX = /^[\p{L} \-']+$/u

type ActionState =
  | { error: string }
  | { needsOnboarding: true; email: string }
  | null

export async function signIn(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !EMAIL_REGEX.test(email)) {
    return { error: 'Please enter a valid email address.' }
  }
  if (!password) {
    return { error: 'Password is required.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  redirect('/')
}

export async function signUp(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !EMAIL_REGEX.test(email)) {
    return { error: 'Please enter a valid email address.' }
  }
  if (!password || password.length < 6) {
    return { error: 'Password must be at least 6 characters.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    return { error: error.message }
  }

  redirect('/')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function signInWithGoogle() {
  const headersList = await headers()
  const origin =
    headersList.get('origin') ??
    `${headersList.get('x-forwarded-proto') ?? 'http'}://${headersList.get('host')}`

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error || !data.url) {
    redirect('/auth/login?error=Could+not+initiate+Google+sign-in')
  }

  redirect(data.url)
}

export async function authenticate(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const rawConfirm = formData.get('confirm_password')
  // Distinguish sign-up (field present in DOM) from sign-in (field absent).
  // formData.get returns null when the field isn't rendered at all.
  const isSignUp = rawConfirm !== null && rawConfirm !== undefined
  const confirmPassword = rawConfirm as string

  if (!email || !EMAIL_REGEX.test(email)) {
    return { error: 'Please enter a valid email address.' }
  }
  if (!password) {
    return { error: 'Password is required.' }
  }

  const supabase = await createClient()

  if (isSignUp) {
    // Sign-up flow
    if (password.length < 6) {
      return { error: 'Password must be at least 6 characters.' }
    }
    if (!confirmPassword || confirmPassword !== password) {
      return { error: 'Passwords do not match.' }
    }

    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      return { error: 'Could not create account. Please try again.' }
    }

    if (!data.session) {
      return { error: 'Account created. Please confirm your email before continuing.' }
    }

    // Explicitly persist the session — guards against SSR cookie adapter
    // timing issues when the action returns a value instead of redirecting.
    await supabase.auth.setSession(data.session)

    // New user always needs onboarding — no profile can exist yet
    return { needsOnboarding: true, email: data.user?.email ?? email }
  }

  // Sign-in flow
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return { error: 'Invalid email or password.' }
  }

  // Check if returning user has a profile
  if (data.user) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', data.user.id)
      .maybeSingle()

    if (profileError) {
      return { error: 'Could not verify account status. Please try again.' }
    }
    if (!profile) {
      return { needsOnboarding: true, email: data.user.email ?? email }
    }
  }

  redirect('/')
}

export async function completeOnboarding(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const fullName = (formData.get('full_name') as string)?.trim()
  const schoolId = formData.get('school_id') as string | null

  if (!fullName || fullName.length < 1 || fullName.length > 100) {
    return { error: 'Full name must be between 1 and 100 characters.' }
  }
  if (!FULL_NAME_REGEX.test(fullName)) {
    return { error: 'Full name may only contain letters, spaces, hyphens, and apostrophes.' }
  }
  if (!schoolId) {
    return { error: 'Please select your school.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated.' }
  }

  if (!user.email) {
    return { error: 'Your account does not have an email address.' }
  }

  const { error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      full_name: fullName,
      email: user.email,
      school_id: schoolId,
    })

  if (error) {
    return { error: 'Could not create profile. Please try again.' }
  }

  redirect('/')
}

export async function deleteAccount(): Promise<{ error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated.' }
  }

  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.deleteUser(user.id)

  if (error) {
    return { error: error.message }
  }

  await supabase.auth.signOut()
  redirect('/')
}
