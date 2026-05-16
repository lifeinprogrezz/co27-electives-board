import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TiltCard } from '@/components/tilt-card'

export default async function LandingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) redirect('/board')

  return (
    <div className="relative isolate flex flex-col gap-10 overflow-hidden">
      {/* Ambient Jordy Blue blob — atmosphere only, never focal */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-32 -z-10 h-80 w-80 rounded-full bg-jordy opacity-35 blur-3xl sm:-right-16 sm:h-96 sm:w-96"
      />

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <span className="font-serif text-[20px] italic leading-none text-midnight">
          co27.exchange
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-midnight px-2.5 py-1 text-[11px] font-medium text-white">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-white" />
          live
        </span>
      </div>

      {/* Hero */}
      <header className="flex flex-col gap-5 pt-4 sm:pt-8">
        <h1 className="font-serif text-[48px] leading-[0.92] tracking-[-0.02em] text-midnight sm:text-[64px]">
          trade <em className="not-italic font-serif italic text-robroy-deep">your</em> electives.
        </h1>
        <p className="max-w-prose text-sm leading-relaxed text-ink">
          Co27 only. Post what you&rsquo;re dropping, see who wants it, settle the
          trade on WhatsApp. No more refreshing eOffice at 8 AM.
        </p>
      </header>

      {/* Cards demo */}
      <div className="grid grid-cols-2 gap-4 sm:max-w-md">
        <TiltCard variant="drop" label="Drop" title="Branding" />
        <TiltCard variant="want" label="Want" title="Neg. II" />
      </div>

      {/* CTA */}
      <Link
        href="/login"
        className="inline-flex w-full items-center justify-center rounded-full bg-midnight px-6 py-3.5 font-serif text-lg italic text-white transition hover:bg-[#001d52] sm:w-auto sm:self-start"
      >
        get started &rarr;
      </Link>

      {/* Quiet privacy line */}
      <p className="max-w-prose pt-2 text-xs leading-relaxed text-ink/70">
        Peer-built for Co27. We store your ESADE email, name, WhatsApp number
        (if you share it), your assigned electives, and what you want to
        drop or add. Never shared with third parties. Delete your account
        anytime from your profile.
      </p>
    </div>
  )
}
