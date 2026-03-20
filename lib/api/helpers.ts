import { NextResponse } from 'next/server'
import { SupabaseClient } from '@supabase/supabase-js'

export function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export function apiSuccess(data: unknown, status = 200) {
  return NextResponse.json(data, { status })
}

export async function getAuthenticatedUser(supabase: SupabaseClient) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}
