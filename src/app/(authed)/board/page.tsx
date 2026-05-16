import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile, isProfileComplete } from '@/lib/dal'
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

  // Build "my courses" set for the quick filter:
  // assigned ∪ my own drop listings ∪ my own add listings.
  const myCourseIds = new Set<string>(profile.assigned_course_ids ?? [])
  for (const l of listings) {
    if (l.user.id === profile.id) myCourseIds.add(l.course_id)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">The Board</h1>
        <p className="text-sm text-zinc-600">
          Drops in red, adds in green. Tap a name to show contact.
        </p>
      </div>

      <BoardClient
        currentUserId={profile.id}
        courses={courses}
        listings={listings}
        myCourseIds={[...myCourseIds]}
      />
    </div>
  )
}
