'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const EmailSchema = z.email()

const ALLOWED_DOMAINS = ['@alumni.esade.edu', '@esade.edu'] as const

export type SignInState =
  | { ok: true; email: string }
  | { ok: false; error: string; lastEmail?: string }
  | undefined

export async function signInWithMagicLink(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const raw = (formData.get('email') ?? '').toString().trim().toLowerCase()

  const valid = EmailSchema.safeParse(raw)
  if (!valid.success) {
    return { ok: false, error: 'Please enter a valid email address.', lastEmail: raw }
  }
  if (!ALLOWED_DOMAINS.some((d) => raw.endsWith(d))) {
    return {
      ok: false,
      error: 'Use your ESADE email to sign in (@alumni.esade.edu or @esade.edu).',
      lastEmail: raw,
    }
  }

  const supabase = await createClient()
  const hdrs = await headers()
  const origin =
    hdrs.get('origin') ??
    hdrs.get('referer')?.replace(/\/[^/]*$/, '') ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'http://localhost:3000'

  const { error } = await supabase.auth.signInWithOtp({
    email: raw,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      shouldCreateUser: true,
    },
  })

  if (error) {
    return { ok: false, error: error.message, lastEmail: raw }
  }
  return { ok: true, email: raw }
}

export type VerifyOtpState =
  | { ok: false; error: string }
  | undefined

export async function verifyEmailOtp(
  _prev: VerifyOtpState,
  formData: FormData,
): Promise<VerifyOtpState> {
  const email = (formData.get('email') ?? '').toString().trim().toLowerCase()
  const token = (formData.get('token') ?? '').toString().replace(/\D+/g, '')

  if (!email || token.length !== 6) {
    return { ok: false, error: 'Enter the 6-digit code from the email.' }
  }

  const supabase = await createClient()

  // signInWithOtp stores the OTP under one of two token types depending on whether
  // the user is new or existing: 'email' (confirmation_token) or 'magiclink'
  // (recovery_token). verifyOtp requires the matching type, so try both.
  let { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
  if (error) {
    const retry = await supabase.auth.verifyOtp({ email, token, type: 'magiclink' })
    error = retry.error
  }

  if (error) {
    return { ok: false, error: error.message }
  }

  // Determine landing based on whether profile is complete.
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('cohort_section')
      .eq('id', user.id)
      .maybeSingle()
    redirect(profile?.cohort_section ? '/board' : '/profile')
  }
  redirect('/profile')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
