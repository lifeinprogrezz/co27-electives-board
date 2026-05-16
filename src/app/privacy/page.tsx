import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/login"
        className="text-xs text-ink/60 underline decoration-midnight/30 underline-offset-2 transition hover:text-midnight"
      >
        ← Back
      </Link>
      <h1 className="font-serif text-[40px] leading-[0.95] tracking-[-0.02em] text-midnight sm:text-[48px]">
        privacy.
      </h1>

      <section className="flex max-w-prose flex-col gap-4 text-sm leading-relaxed text-ink">
        <div>
          <h2 className="font-serif text-lg text-midnight">What we store</h2>
          <p className="mt-1">
            Your ESADE email, your display name, your WhatsApp number (only if
            you choose to share it), the electives you were assigned, and the
            courses you list as want-to-drop or want-to-add.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-lg text-midnight">Why</h2>
          <p className="mt-1">
            To help cohort members find each other for elective trades during
            Add/Drop. Nothing else.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-lg text-midnight">Who sees it</h2>
          <p className="mt-1">
            Other authenticated Co27 students. Your data is never shared with
            third parties. The site is not affiliated with ESADE and ESADE
            doesn&rsquo;t receive your data from it.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-lg text-midnight">How long</h2>
          <p className="mt-1">
            Deleted on request, or auto-deleted 60 days after the Add/Drop
            window closes. You can delete your account at any time from the
            profile page.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-lg text-midnight">Contact</h2>
          <p className="mt-1">
            Questions or deletion requests: WhatsApp Roberto Quintero (Co27) or email{' '}
            <span className="font-mono text-midnight">
              hello@lifeinprogrezz.com
            </span>
            .
          </p>
        </div>
      </section>
    </div>
  )
}
