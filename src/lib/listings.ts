'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ListingActionState =
  | { ok: true }
  | { ok: false; error: string }
  | undefined

async function getUserId(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

/** Hide a listing from the board without deleting it. RLS limits to the owner. */
export async function closeListing(
  listingId: string,
): Promise<ListingActionState> {
  const userId = await getUserId()
  if (!userId) return { ok: false, error: 'Sign in again.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('listings')
    .update({ status: 'closed' })
    .eq('id', listingId)
    .eq('user_id', userId)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/board')
  return { ok: true }
}

/** Permanently delete a listing. RLS limits to the owner. */
export async function deleteListing(
  listingId: string,
): Promise<ListingActionState> {
  const userId = await getUserId()
  if (!userId) return { ok: false, error: 'Sign in again.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', listingId)
    .eq('user_id', userId)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/board')
  return { ok: true }
}
