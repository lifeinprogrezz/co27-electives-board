import Link from 'next/link'

export function Footer() {
  return (
    <footer className="mt-16 border-t border-midnight/10 py-6 text-center text-xs text-ink/60">
      <p>
        Built by Rober Quintero, Co27. Not affiliated with ESADE.{' '}
        <Link
          href="/about"
          className="underline decoration-midnight/30 underline-offset-2 hover:text-midnight hover:decoration-midnight"
        >
          About
        </Link>{' '}
        ·{' '}
        <Link
          href="/privacy"
          className="underline decoration-midnight/30 underline-offset-2 hover:text-midnight hover:decoration-midnight"
        >
          Privacy
        </Link>
      </p>
    </footer>
  )
}
