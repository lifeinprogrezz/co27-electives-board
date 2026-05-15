import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile, isProfileComplete } from '@/lib/dal'
import { signOut } from '@/lib/auth'
import {
  BoardClient,
  type BoardCourse,
  type BoardListing,
} from '@/components/board-client'

export const dynamic = 'force-dynamic'

export default async function BoardPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')
  if (!isProfileComplete(profile)) redirect('/profile')

  const supabase = await createClient()

  const [coursesResult, listingsResult] = await Promise.all([
    supabase
      .from('courses')
      .select('id, class_code, name, ects, professor, term, schedule_text')
      .order('term')
      .order('schedule_text'),
    supabase
      .from('listings')
      .select(
        `id, type, course_id,
         user:users!inner(id, name, email, whatsapp_number)`,
      )
      .eq('status', 'active'),
  ])

  const courses = (coursesResult.data ?? []) as BoardCourse[]
  // Supabase typing of the embedded relation is loose — coerce to our shape.
  const listings = ((listingsResult.data ?? []) as unknown) as BoardListing[]

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">The Board</h1>
          <p className="text-sm text-zinc-600">
            Drops in red, adds in green. Tap a name to show contact.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Link
            href="/calendar"
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Calendar →
          </Link>
          <Link
            href="/profile"
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            My listings
          </Link>
        </div>
      </header>

      <BoardClient
        currentUserId={profile.id}
        courses={courses}
        listings={listings}
      />

      <form action={signOut} className="mt-2 self-start">
        <button
          type="submit"
          className="text-xs text-zinc-500 underline hover:text-red-600"
        >
          Sign out
        </button>
      </form>
    </div>
  )
}
