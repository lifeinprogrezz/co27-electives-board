import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-5">
      <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-700">
        ← Home
      </Link>
      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">About</h1>
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-zinc-700">
        <p>
          Add/Drop is a refresh-and-hope game on eOffice. The cohort is already trading
          electives over WhatsApp DMs — there&apos;s just no central place to see who
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
            className="underline"
          >
            Rober Quintero
          </a>{' '}
          (Co27). Not affiliated with ESADE. Open feedback welcome.
        </p>
      </div>
    </div>
  )
}
