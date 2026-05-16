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
  const listings = ((listingsResult.data ?? []) as unknown) as BoardListing[]

  const myCourseIds = new Set<string>(profile.assigned_course_ids ?? [])
  for (const l of listings) {
    if (l.user.id === profile.id) myCourseIds.add(l.course_id)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-[36px] leading-[0.95] tracking-[-0.02em] text-midnight sm:text-[44px]">
          the <em className="not-italic font-serif italic text-robroy-deep">board</em>.
        </h1>
        <p className="text-sm leading-relaxed text-ink">
          Drops in gold, adds in midnight. Tap a name to reveal contact.
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
