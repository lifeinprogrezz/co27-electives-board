'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const ProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required.')
    .max(80, 'Keep your name under 80 characters.'),
  whatsapp: z.string().trim().max(20).optional().or(z.literal('')),
})

export type SaveProfileState =
  | { ok: true }
  | { ok: false; error: string }
  | undefined

/** Strip everything except digits; reject anything left if shorter than 6 or longer than 15. */
function normalizeWhatsapp(input: string): string | null {
  const digits = input.replace(/\D+/g, '')
  if (!digits) return null
  if (digits.length < 6 || digits.length > 15) return null
  return digits
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function uniqueUuids(values: FormDataEntryValue[]): string[] {
  const out = new Set<string>()
  for (const v of values) {
    const s = v.toString().trim()
    if (UUID_RE.test(s)) out.add(s)
  }
  return [...out]
}

export async function saveProfile(
  _prev: SaveProfileState,
  formData: FormData,
): Promise<SaveProfileState> {
  const parsed = ProfileSchema.safeParse({
    name: formData.get('name') ?? '',
    whatsapp: formData.get('whatsapp') ?? '',
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: 'Your session expired. Sign in again.' }
  }

  let whatsapp: string | null = null
  if (parsed.data.whatsapp && parsed.data.whatsapp.length > 0) {
    whatsapp = normalizeWhatsapp(parsed.data.whatsapp)
    if (!whatsapp) {
      return {
        ok: false,
        error: 'WhatsApp number looks invalid. Use international format, e.g. +34666123456.',
      }
    }
  }

  const assignedIds = uniqueUuids(formData.getAll('assigned_ids'))
  const dropIds = uniqueUuids(formData.getAll('drop_ids'))
  const addIds = uniqueUuids(formData.getAll('add_ids'))

  // Drops must be a subset of assigned.
  const assignedSet = new Set(assignedIds)
  const invalidDrops = dropIds.filter((id) => !assignedSet.has(id))
  if (invalidDrops.length > 0) {
    return {
      ok: false,
      error: 'You can only drop courses you marked as assigned.',
    }
  }

  // Adds must NOT be in assigned (can't add what you already have).
  const invalidAdds = addIds.filter((id) => assignedSet.has(id))
  if (invalidAdds.length > 0) {
    return {
      ok: false,
      error: "You can't add a course you're already assigned to.",
    }
  }

  // 1. Update user profile.
  const { error: profileError } = await supabase
    .from('users')
    .update({
      name: parsed.data.name,
      whatsapp_number: whatsapp,
      assigned_course_ids: assignedIds,
    })
    .eq('id', user.id)

  if (profileError) {
    return { ok: false, error: `Couldn't save profile: ${profileError.message}` }
  }

  // 2. Replace listings: delete all for this user, then insert.
  const { error: deleteError } = await supabase
    .from('listings')
    .delete()
    .eq('user_id', user.id)
  if (deleteError) {
    return { ok: false, error: `Couldn't clear old listings: ${deleteError.message}` }
  }

  const rows = [
    ...dropIds.map((cid) => ({
      user_id: user.id,
      course_id: cid,
      type: 'have_want_drop' as const,
    })),
    ...addIds.map((cid) => ({
      user_id: user.id,
      course_id: cid,
      type: 'want_add' as const,
    })),
  ]

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from('listings').insert(rows)
    if (insertError) {
      return { ok: false, error: `Couldn't save listings: ${insertError.message}` }
    }
  }

  revalidatePath('/board')
  redirect('/board')
}
