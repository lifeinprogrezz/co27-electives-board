import Link from 'next/link'

const linkClass =
  'inline-flex h-7 w-7 items-center justify-center rounded-full text-midnight/70 transition hover:bg-jordy/20 hover:text-midnight'

function LinkedinIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3v9zM6.5 8.7A1.7 1.7 0 116.51 5.3a1.7 1.7 0 010 3.4zM19 19h-3v-4.7c0-1.1-.4-1.9-1.4-1.9-1 0-1.6.7-1.8 1.3-.1.2-.1.5-.1.8V19h-3v-9h3v1.3c.4-.6 1.1-1.5 2.7-1.5 2 0 3.5 1.3 3.5 4.1V19z" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9.5" />
      <path d="M2.5 12h19" />
      <path d="M12 2.5c2.6 3 4 6.2 4 9.5s-1.4 6.5-4 9.5c-2.6-3-4-6.2-4-9.5s1.4-6.5 4-9.5z" />
    </svg>
  )
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-midnight/10 py-6">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 px-4 text-center text-xs text-ink/70 sm:px-6">
        <div className="flex items-center gap-1.5">
          <span>Built by Roberto Quintero</span>
          <a
            href="https://www.linkedin.com/in/robertoquinterodelaiglesia"
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
            className={linkClass}
          >
            <LinkedinIcon />
          </a>
          <a
            href="https://x.com/lifeinprogrezz"
            target="_blank"
            rel="noreferrer"
            aria-label="X (Twitter)"
            className={linkClass}
          >
            <XIcon />
          </a>
          <a
            href="https://www.lifeinprogrezz.com/"
            target="_blank"
            rel="noreferrer"
            aria-label="Portfolio"
            className={linkClass}
          >
            <GlobeIcon />
          </a>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-ink/60">
          <span>Not affiliated with ESADE.</span>
          <Link
            href="/about"
            className="underline decoration-midnight/30 underline-offset-2 transition hover:text-midnight hover:decoration-midnight"
          >
            About
          </Link>
          <span>·</span>
          <Link
            href="/privacy"
            className="underline decoration-midnight/30 underline-offset-2 transition hover:text-midnight hover:decoration-midnight"
          >
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  )
}
