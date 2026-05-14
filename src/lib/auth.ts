'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const EmailSchema = z.email()

export type SignInState =
  | { ok: true; email: string }
  | { ok: false; error: string }
  | undefined

export async function signInWithMagicLink(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const raw = (formData.get('email') ?? '').toString().trim().toLowerCase()

  const valid = EmailSchema.safeParse(raw)
  if (!valid.success) {
    return { ok: false, error: 'Please enter a valid email address.' }
  }
  if (!raw.endsWith('@esade.edu')) {
    return { ok: false, error: 'Use your @esade.edu email to sign in.' }
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
    return { ok: false, error: error.message }
  }
  return { ok: true, email: raw }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
