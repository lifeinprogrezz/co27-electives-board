import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile, isProfileComplete } from '@/lib/dal'
import {
  CalendarClient,
  type CalendarRow,
  type CalendarStatus,
  type CourseSlot,
} from '@/components/calendar-client'

export const dynamic = 'force-dynamic'

interface DbCourse {
  id: string
  name: string
  ects: number
  professor: string | null
  schedule_text: string | null
  slot: CourseSlot | null
  start_date: string | null
  end_date: string | null
  session_dates: string[] | null
}

interface DbListing {
  course_id: string
  type: 'have_want_drop' | 'want_add'
}

export default async function CalendarPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')
  if (!isProfileComplete(profile)) redirect('/profile')

  const supabase = await createClient()
  const assigned = profile.assigned_course_ids ?? []

  const [coursesResult, listingsResult] = await Promise.all([
    supabase
      .from('courses')
      .select(
        'id, name, ects, professor, schedule_text, slot, start_date, end_date, session_dates',
      ),
    supabase
      .from('listings')
      .select('course_id, type')
      .eq('user_id', profile.id)
      .eq('status', 'active'),
  ])

  const allCourses = (coursesResult.data ?? []) as DbCourse[]
  const myListings = (listingsResult.data ?? []) as DbListing[]

  const dropSet = new Set(
    myListings.filter((l) => l.type === 'have_want_drop').map((l) => l.course_id),
  )
  const addSet = new Set(
    myListings.filter((l) => l.type === 'want_add').map((l) => l.course_id),
  )
  const assignedSet = new Set(assigned)

  const rows: CalendarRow[] = allCourses
    .filter(
      (c) => assignedSet.has(c.id) || dropSet.has(c.id) || addSet.has(c.id),
    )
    .filter((c) => c.start_date && c.end_date) // skip courses without parsed dates
    .map((c) => {
      let status: CalendarStatus
      if (dropSet.has(c.id)) status = 'dropping'
      else if (addSet.has(c.id)) status = 'adding'
      else status = 'kept'
      return {
        id: c.id,
        name: c.name,
        ects: Number(c.ects),
        professor: c.professor,
        schedule_text: c.schedule_text,
        slot: c.slot,
        start_date: c.start_date!,
        end_date: c.end_date!,
        session_dates: c.session_dates ?? [],
        status,
      }
    })

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Your calendar
        </h1>
        <p className="text-sm text-zinc-600">
          Jun – Dec 2026. Pending drops in rose, adds in emerald, kept in sky.
        </p>
      </div>

      <CalendarClient rows={rows} />
    </div>
  )
}
