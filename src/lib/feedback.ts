'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const FeedbackSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Add a message before sending.')
    .max(5000, 'Keep it under 5000 characters.'),
})

export type FeedbackState =
  | { ok: true }
  | { ok: false; error: string }
  | undefined

const TO = 'hello@lifeinprogrezz.com'
const FROM = 'Co27 Board <noreply@lifeinprogrezz.com>'

export async function sendFeedback(
  _prev: FeedbackState,
  formData: FormData,
): Promise<FeedbackState> {
  const parsed = FeedbackSchema.safeParse({
    message: formData.get('message') ?? '',
  })
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input.',
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: 'Your session expired. Sign in again.' }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .maybeSingle()
  const displayName =
    profile?.name?.trim() || user.email?.split('@')[0] || 'unknown'
  const userEmail = user.email ?? 'unknown@unknown'

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[feedback] missing RESEND_API_KEY')
    return { ok: false, error: 'Email is not configured. DM Rober instead.' }
  }

  const subject = `[Co27 board] Feedback from ${displayName}`
  const text = [
    parsed.data.message,
    '',
    '---',
    `From: ${displayName} <${userEmail}>`,
    `Sent at: ${new Date().toISOString()}`,
  ].join('\n')

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: userEmail,
        subject,
        text,
      }),
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      console.error('[feedback] Resend API error', res.status, errText)
      return { ok: false, error: 'Could not send right now. Try again in a sec.' }
    }
  } catch (err) {
    console.error('[feedback] fetch failed', err)
    return { ok: false, error: 'Could not send right now. Try again in a sec.' }
  }

  return { ok: true }
}
