import { AppHeader } from '@/components/app-header'
import { getCurrentProfile, requireUser } from '@/lib/dal'
import { createClient } from '@/lib/supabase/server'

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireUser()
  const profile = await getCurrentProfile()

  const supabase = await createClient()

  const [{ count: boardCount }, { data: myListings }] = await Promise.all([
    supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('listings')
      .select('course_id')
      .eq('user_id', user.id)
      .eq('status', 'active'),
  ])

  const assignedCount = (profile?.assigned_course_ids ?? []).length
  const myCourseIds = new Set<string>(profile?.assigned_course_ids ?? [])
  for (const l of myListings ?? []) myCourseIds.add(l.course_id)
  const calendarCount = myCourseIds.size

  return (
    <div className="flex flex-col gap-5">
      <AppHeader
        name={profile?.name ?? null}
        email={profile?.email ?? user.email ?? ''}
        boardCount={boardCount ?? 0}
        calendarCount={calendarCount}
        profileCompleteCount={assignedCount}
      />
      {children}
    </div>
  )
}
