import { createClient } from '@/lib/supabase/server'
import { requireUser, getCurrentProfile } from '@/lib/dal'
import { ProfileForm } from '@/components/profile-form'
import type { Course } from '@/lib/types'

function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? ''
  return local
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ')
}

export default async function ProfilePage() {
  const authUser = await requireUser()
  const supabase = await createClient()

  const [profile, coursesResult, listingsResult] = await Promise.all([
    getCurrentProfile(),
    supabase
      .from('courses')
      .select('id, class_code, name, ects, professor, term, schedule_text, slot, notes')
      .order('term')
      .order('schedule_text'),
    supabase.from('listings').select('course_id, type, status').eq('user_id', authUser.id),
  ])

  const courses = (coursesResult.data ?? []) as Course[]
  const listings = listingsResult.data ?? []
  const hasArchived = listings.some((l) => l.status === 'closed')
  const dropIds = listings
    .filter((l) => l.type === 'have_want_drop')
    .map((l) => l.course_id)
  const addIds = listings.filter((l) => l.type === 'want_add').map((l) => l.course_id)
  const assignedIds = profile?.assigned_course_ids ?? []

  const initialName =
    profile?.name?.trim() || nameFromEmail(profile?.email ?? authUser.email ?? '')

  const isOnboarded = Boolean(profile?.name?.trim())

  return (
    <>
      {hasArchived && (
        <p className="mb-4 rounded-xl border border-robroy-deep/50 bg-robroy/25 px-3 py-2 text-sm text-midnight">
          Your spring listings were archived for the new trading window — they're
          hidden from the board. Your marks below are untouched: untick anything
          that no longer applies, then hit Save to repost the rest.
        </p>
      )}
      <ProfileForm
      isReturning={isOnboarded}
      initialName={initialName}
      initialWhatsapp={profile?.whatsapp_number ?? ''}
      initialAssignedIds={assignedIds}
      initialDropIds={dropIds}
      initialAddIds={addIds}
      courses={courses}
    />
    </>
  )
}
