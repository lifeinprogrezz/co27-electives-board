'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { signOut } from '@/lib/auth'

interface Props {
  name: string | null
  email: string
  boardCount?: number
  calendarCount?: number
  profileCompleteCount?: number
}

function initialFor(name: string | null, email: string): string {
  const source = (name?.trim() || email).trim()
  return (source[0] ?? '?').toUpperCase()
}

export function AppHeader({
  name,
  email,
  boardCount,
  calendarCount,
  profileCompleteCount,
}: Props) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const initial = initialFor(name, email)
  const displayName = name?.trim() || email.split('@')[0]

  const tabs: { href: string; label: string; count?: number }[] = [
    { href: '/board', label: 'Board', count: boardCount },
    { href: '/calendar', label: 'Calendar', count: calendarCount },
    { href: '/profile', label: 'Profile', count: profileCompleteCount },
  ]

  // Close the menu on outside click / Esc.
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
    <header className="sticky top-0 z-20 -mx-4 mb-5 border-b border-zinc-200 bg-white/95 backdrop-blur sm:-mx-6">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2.5 sm:px-6">
        <Link
          href="/board"
          className="text-sm font-semibold tracking-tight text-zinc-900 sm:text-base"
        >
          Co27 Board
        </Link>

        <nav className="flex items-center gap-0.5 rounded-full border border-zinc-200 bg-zinc-50 p-0.5">
          {tabs.map((t) => {
            const isActive = pathname === t.href || pathname.startsWith(`${t.href}/`)
            const showCount = typeof t.count === 'number' && t.count > 0
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition sm:text-sm ${
                  isActive
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <span>{t.label}</span>
                {showCount && (
                  <span
                    className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    {t.count}
                  </span>
                )}
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
            className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-700 sm:text-sm"
          >
            {initial}
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-1.5 w-56 overflow-hidden rounded-lg border border-zinc-200 bg-white text-sm shadow-lg"
            >
              <div className="border-b border-zinc-100 px-3 py-2">
                <p className="truncate font-medium text-zinc-900">{displayName}</p>
                <p className="truncate text-[11px] text-zinc-500">{email}</p>
              </div>
              <Link
                href="/profile"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 text-zinc-700 hover:bg-zinc-50"
              >
                Edit profile
              </Link>
              <form action={signOut} role="menuitem" className="border-t border-zinc-100">
                <button
                  type="submit"
                  className="block w-full px-3 py-2 text-left text-red-600 hover:bg-red-50"
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
