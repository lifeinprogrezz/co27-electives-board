import Link from 'next/link'

export function Footer() {
  return (
    <footer className="mt-16 border-t border-zinc-200 py-6 text-center text-xs text-zinc-500">
      <p>
        Built by Rober Quintero, Co27. Not affiliated with ESADE.{' '}
        <Link href="/about" className="underline hover:text-zinc-700">
          About
        </Link>{' '}
        ·{' '}
        <Link href="/privacy" className="underline hover:text-zinc-700">
          Privacy
        </Link>
      </p>
    </footer>
  )
}
