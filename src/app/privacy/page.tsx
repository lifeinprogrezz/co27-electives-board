import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="flex flex-col gap-5">
      <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-700">
        ← Home
      </Link>
      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Privacy</h1>

      <section className="flex flex-col gap-3 text-sm leading-relaxed text-zinc-700">
        <h2 className="text-base font-medium text-zinc-900">What we store</h2>
        <p>
          Your ESADE email, your display name, your WhatsApp number (only if you choose to
          share it), the electives you were assigned, and the courses you list as
          want-to-drop or want-to-add.
        </p>

        <h2 className="mt-3 text-base font-medium text-zinc-900">Why</h2>
        <p>
          To help cohort members find each other for elective trades during Add/Drop.
          Nothing else.
        </p>

        <h2 className="mt-3 text-base font-medium text-zinc-900">Who sees it</h2>
        <p>
          Other authenticated Co27 students. Your data is never shared with third parties.
          The site is not affiliated with ESADE and ESADE doesn&apos;t receive your data
          from it.
        </p>

        <h2 className="mt-3 text-base font-medium text-zinc-900">How long</h2>
        <p>
          Deleted on request, or auto-deleted 60 days after the Add/Drop window closes.
          You can delete your account at any time from the profile page.
        </p>

        <h2 className="mt-3 text-base font-medium text-zinc-900">Contact</h2>
        <p>
          Questions or deletion requests: WhatsApp Rober Quintero (Co27) or email{' '}
          <span className="font-mono">hello@lifeinprogrezz.com</span>.
        </p>
      </section>
    </div>
  )
}
