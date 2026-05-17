'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { signOut } from '@/lib/auth'
import { useFeedback } from '@/components/feedback-modal'

interface Props {
  name: string | null
  email: string
}

const TABS = [
  { href: '/profile', label: 'Profile' },
  { href: '/board', label: 'Board' },
  { href: '/calendar', label: 'Calendar' },
]

function initialFor(name: string | null, email: string): string {
  const source = (name?.trim() || email).trim()
  return (source[0] ?? '?').toUpperCase()
}

export function AppHeader({ name, email }: Props) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const { open: openFeedback } = useFeedback()
  const initial = initialFor(name, email)
  const displayName = name?.trim() || email.split('@')[0]

  useEffect(() => {
    if (!menuOpen) return
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  return (
    <header className="sticky top-0 z-20 -mx-4 mb-5 border-b border-midnight/10 bg-white/95 backdrop-blur sm:-mx-6">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2.5 sm:px-6">
        <Link
          href="/board"
          className="font-serif text-[18px] leading-none text-midnight sm:text-[20px]"
        >
          co27.electives
        </Link>

        <nav className="flex items-center gap-0.5 rounded-full border border-midnight/15 bg-white p-0.5">
          {TABS.map((t) => {
            const isActive = pathname === t.href || pathname.startsWith(`${t.href}/`)
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={isActive ? 'page' : undefined}
                className={`rounded-full px-3 py-1 text-xs font-medium transition sm:text-sm ${
                  isActive
                    ? 'bg-midnight text-white shadow-sm'
                    : 'text-ink hover:text-midnight'
                }`}
              >
                {t.label}
              </Link>
            )
          })}
        </nav>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-midnight text-xs font-medium text-white shadow-sm transition hover:bg-[#001d52] sm:text-sm"
          >
            {initial}
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-1.5 w-56 overflow-hidden rounded-xl border border-midnight/15 bg-white text-sm shadow-lg"
            >
              <div className="px-3 py-2">
                <p className="truncate font-medium text-midnight">{displayName}</p>
                <p className="truncate text-[11px] text-ink/60">{email}</p>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  openFeedback()
                }}
                className="block w-full border-t border-midnight/10 px-3 py-2 text-left text-midnight hover:bg-jordy/15"
              >
                Send feedback
              </button>
              <form action={signOut} role="menuitem" className="border-t border-midnight/10">
                <button
                  type="submit"
                  className="block w-full px-3 py-2 text-left text-robroy-deep hover:bg-robroy/15"
                >
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
