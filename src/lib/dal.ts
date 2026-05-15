import 'server-only'

import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { UserProfile } from '@/lib/types'

/** Verify the active session and return the auth user. Redirects to /login if unauthenticated. */
export const requireUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return user
})

/** Read the current app-level profile from public.users (created by the auth trigger). */
export const getCurrentProfile = cache(async (): Promise<UserProfile | null> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('users')
    .select('id, email, name, whatsapp_number, assigned_course_ids')
    .eq('id', user.id)
    .maybeSingle()

  return (data as UserProfile | null) ?? null
})

/** True when the user has completed onboarding (saved their name). */
export function isProfileComplete(profile: UserProfile | null): boolean {
  return Boolean(profile?.name?.trim())
}
