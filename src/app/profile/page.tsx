import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireUser, getCurrentProfile } from '@/lib/dal'
import { ProfileForm } from '@/components/profile-form'
import { signOut } from '@/lib/auth'
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
    supabase.from('listings').select('course_id, type').eq('user_id', authUser.id),
  ])

  const courses = (coursesResult.data ?? []) as Course[]
  const listings = listingsResult.data ?? []
  const dropIds = listings
    .filter((l) => l.type === 'have_want_drop')
    .map((l) => l.course_id)
  const addIds = listings.filter((l) => l.type === 'want_add').map((l) => l.course_id)

  const initialName =
    profile?.name?.trim() || nameFromEmail(profile?.email ?? authUser.email ?? '')

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {profile?.cohort_section ? 'Edit your profile' : 'Welcome — set up your profile'}
          </h1>
          <p className="text-sm text-zinc-600">
            Signed in as <span className="font-mono">{profile?.email ?? authUser.email}</span>
          </p>
        </div>
        {profile?.cohort_section && (
          <Link
            href="/board"
            className="text-xs text-zinc-500 underline hover:text-zinc-700"
          >
            Board →
          </Link>
        )}
      </header>

      <ProfileForm
        initialName={initialName}
        initialWhatsapp={profile?.whatsapp_number ?? ''}
        initialCohortSection={profile?.cohort_section ?? null}
        initialDropIds={dropIds}
        initialAddIds={addIds}
        courses={courses}
      />

      <form action={signOut} className="self-start">
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
