import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LandingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) redirect('/board')

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Co27 Electives Board
        </h1>
        <p className="text-base text-zinc-600">
          Trade Co27 electives with your cohort. No more refreshing eOffice.
        </p>
      </header>

      <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-700 sm:p-5">
        <p className="font-medium text-zinc-900">How it works</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Sign in with your ESADE email.</li>
          <li>Post which electives you want to drop, and which you want to add.</li>
          <li>See who else is looking for what — and DM them on WhatsApp.</li>
        </ol>
      </section>

      <Link
        href="/login"
        className="w-full rounded-md bg-zinc-900 px-4 py-3 text-center text-base font-medium text-white transition hover:bg-zinc-800"
      >
        Sign in with ESADE email
      </Link>

      <p className="text-xs leading-relaxed text-zinc-500">
        This is a peer-built tool to help Co27 students coordinate elective trades during
        Add/Drop. We store your ESADE email, name, WhatsApp number (if you choose to share
        it), your assigned electives, and the courses you want to drop or add. We never
        share data with third parties. You can delete your account anytime from your
        profile page.
      </p>
    </div>
  )
}
