import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/login"
        className="text-xs text-ink/60 underline decoration-midnight/30 underline-offset-2 transition hover:text-midnight"
      >
        ← Back
      </Link>
      <h1 className="font-serif text-[40px] leading-[0.95] tracking-[-0.02em] text-midnight sm:text-[48px]">
        <em className="not-italic font-serif italic text-robroy-deep">about</em>.
      </h1>
      <div className="flex max-w-prose flex-col gap-3 text-sm leading-relaxed text-ink">
        <p>
          Add/Drop is a refresh-and-hope game on eOffice. The cohort is already trading
          electives over WhatsApp DMs &mdash; there&rsquo;s just no central place to see who
          wants what.
        </p>
        <p>
          This site is that central place. Nothing more. Post what you want to drop, post
          what you want to add, and DM the people you match with. No matching algorithm,
          no notifications, no chat. Just signal.
        </p>
        <p>
          Built by{' '}
          <a
            href="https://lifeinprogrezz.com"
            target="_blank"
            rel="noreferrer"
            className="text-midnight underline decoration-midnight/40 underline-offset-2 hover:decoration-midnight"
          >
            Rober Quintero
          </a>{' '}
          (Co27). Not affiliated with ESADE. Open feedback welcome.
        </p>
      </div>
    </div>
  )
}
