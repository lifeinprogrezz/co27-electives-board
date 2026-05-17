'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { TERM_LABELS, TERM_ORDER, type Term } from '@/lib/types'
import { closeListing, deleteListing } from '@/lib/listings'

export interface BoardCourse {
  id: string
  class_code: string | null
  name: string
  ects: number
  professor: string | null
  term: Term
  schedule_text: string | null
}

export interface BoardListing {
  id: string
  type: 'have_want_drop' | 'want_add'
  course_id: string
  user: {
    id: string
    name: string | null
    email: string
    whatsapp_number: string | null
  }
}

interface Props {
  currentUserId: string
  courses: BoardCourse[]
  listings: BoardListing[]
  myCourseIds: string[]
}

type ScopeFilter = 'all' | 'mine'

const fieldClass =
  'w-full rounded-xl border border-midnight/20 bg-white px-3 py-2 text-sm text-midnight outline-none transition focus:border-midnight focus:ring-2 focus:ring-midnight/15 placeholder:text-ink/40'

export function BoardClient({
  currentUserId,
  courses,
  listings,
  myCourseIds,
}: Props) {
  const [q, setQ] = useState('')
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [scope, setScope] = useState<ScopeFilter>('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const myCourseSet = useMemo(() => new Set(myCourseIds), [myCourseIds])

  const courseIdsWithListings = useMemo(() => {
    const s = new Set<string>()
    for (const l of listings) s.add(l.course_id)
    return s
  }, [listings])

  const interestByCourse = useMemo(() => {
    const m = new Map<string, number>()
    for (const l of listings) m.set(l.course_id, (m.get(l.course_id) ?? 0) + 1)
    return m
  }, [listings])

  function pickCourseFilter(id: string) {
    setCourseFilter(id)
    if (id !== 'all') {
      setExpanded((prev) => {
        if (prev.has(id)) return prev
        const next = new Set(prev)
        next.add(id)
        return next
      })
    }
  }

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filteredCourses = useMemo(() => {
    const term = q.trim().toLowerCase()
    const out = courses
      .filter((c) => courseIdsWithListings.has(c.id))
      .filter((c) => (courseFilter === 'all' ? true : c.id === courseFilter))
      .filter((c) => {
        if (scope === 'mine') return myCourseSet.has(c.id)
        return true
      })
      .filter((c) => {
        if (!term) return true
        return (
          c.name.toLowerCase().includes(term) ||
          (c.class_code ?? '').toLowerCase().includes(term) ||
          (c.professor ?? '').toLowerCase().includes(term)
        )
      })
    out.sort((a, b) => {
      const ia = interestByCourse.get(a.id) ?? 0
      const ib = interestByCourse.get(b.id) ?? 0
      if (ia !== ib) return ib - ia
      return a.name.localeCompare(b.name)
    })
    return out
  }, [
    courses,
    courseIdsWithListings,
    q,
    courseFilter,
    scope,
    myCourseSet,
    interestByCourse,
  ])

  const listingsByCourse = useMemo(() => {
    const m: Record<string, { drop: BoardListing[]; add: BoardListing[] }> = {}
    for (const l of listings) {
      const bucket = (m[l.course_id] ??= { drop: [], add: [] })
      if (l.type === 'have_want_drop') bucket.drop.push(l)
      else bucket.add.push(l)
    }
    return m
  }, [listings])

  const totalDrops = listings.filter((l) => l.type === 'have_want_drop').length
  const totalAdds = listings.filter((l) => l.type === 'want_add').length

  const coursesByTerm = useMemo(() => {
    const m: Record<Term, BoardCourse[]> = { summer: [], september: [], term4: [], term5: [] }
    for (const c of courses) m[c.term].push(c)
    return m
  }, [courses])

  if (listings.length === 0) {
    return (
      <div className="rounded-2xl border border-midnight/15 bg-jordy/10 p-6 text-center text-sm text-ink">
        <p className="font-serif text-xl text-midnight">Nobody&rsquo;s posted yet.</p>
        <p className="mt-1.5">
          Be the first.{' '}
          <Link
            href="/profile"
            className="text-midnight underline decoration-midnight/40 underline-offset-2 hover:decoration-midnight"
          >
            Post the courses you want to drop or add →
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Status bar: drop/add counts + refresh, in one card so nothing floats */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-midnight/15 bg-white px-3 py-2">
        <div className="flex items-center gap-2 text-xs text-ink">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-robroy/30 px-2.5 py-1 font-medium text-midnight">
            <span className="font-semibold">{totalDrops}</span>
            <span className="text-[11px] uppercase tracking-wider">drops</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-midnight px-2.5 py-1 font-medium text-white">
            <span className="font-semibold">{totalAdds}</span>
            <span className="text-[11px] uppercase tracking-wider">adds</span>
          </span>
        </div>
        <RefreshButton />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-auto">
          <select
            value={courseFilter}
            onChange={(e) => pickCourseFilter(e.target.value)}
            className={`${fieldClass} appearance-none pr-9`}
          >
            <option value="all">All courses</option>
            {TERM_ORDER.map((term) =>
              coursesByTerm[term].length === 0 ? null : (
                <optgroup key={term} label={TERM_LABELS[term]}>
                  {coursesByTerm[term].map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              ),
            )}
          </select>
          <svg
            aria-hidden
            className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/60"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <input
          type="search"
          placeholder="Search name or professor…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className={`${fieldClass} sm:flex-1`}
        />
      </div>

      <ScopeTabs scope={scope} setScope={setScope} />

      {filteredCourses.length === 0 ? (
        <p className="rounded-xl border border-midnight/15 bg-jordy/10 px-3 py-4 text-center text-sm text-ink/70">
          No matches.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {TERM_ORDER.map((term) => {
            const inTerm = filteredCourses.filter((c) => c.term === term)
            if (inTerm.length === 0) return null
            return (
              <section key={term} className="flex flex-col gap-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-midnight sm:text-base">
                  {TERM_LABELS[term]}
                </h2>
                <div className="flex flex-col gap-3">
                  {inTerm.map((c) => {
                    const bucket = listingsByCourse[c.id]
                    return (
                      <CourseCard
                        key={c.id}
                        course={c}
                        drop={bucket?.drop ?? []}
                        add={bucket?.add ?? []}
                        currentUserId={currentUserId}
                        isExpanded={expanded.has(c.id)}
                        onToggle={() => toggleExpanded(c.id)}
                      />
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}

      <p className="mt-2 rounded-xl border border-midnight/15 bg-white px-3 py-3 text-center text-xs text-ink/70">
        Don&rsquo;t see your course?{' '}
        <Link
          href="/profile"
          className="font-medium text-midnight underline decoration-midnight/40 underline-offset-2 hover:decoration-midnight"
        >
          Edit your profile
        </Link>{' '}
        to post your drop or add.
      </p>
    </div>
  )
}

function CourseCard({
  course,
  drop,
  add,
  currentUserId,
  isExpanded,
  onToggle,
}: {
  course: BoardCourse
  drop: BoardListing[]
  add: BoardListing[]
  currentUserId: string
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-midnight/15 bg-white">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-jordy/5"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h3 className="truncate text-base font-medium text-midnight">
            {course.name}
          </h3>
          <p className="truncate text-xs text-ink/60">
            {course.class_code ? `${course.class_code} · ` : ''}
            {course.ects} ECTS · {course.schedule_text ?? ''}
            {course.professor ? ` · ${course.professor}` : ''}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 text-xs font-medium">
          <PoolBadge tone="drop" count={drop.length} label="drop" />
          <PoolBadge tone="add" count={add.length} label="add" />
          <span
            aria-hidden
            className={`ml-1 inline-block text-ink/40 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          >
            ▾
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="grid grid-cols-1 gap-3 border-t border-midnight/10 p-4 sm:grid-cols-2">
          <ListingColumn
            label="Has and wants to drop"
            tone="drop"
            listings={drop}
            currentUserId={currentUserId}
          />
          <ListingColumn
            label="Wants to add"
            tone="add"
            listings={add}
            currentUserId={currentUserId}
          />
        </div>
      )}
    </article>
  )
}

function PoolBadge({
  tone,
  count,
  label,
}: {
  tone: 'drop' | 'add'
  count: number
  label: string
}) {
  const active = count > 0
  const cls = active
    ? tone === 'drop'
      ? 'border-robroy-deep/40 bg-robroy/30 text-midnight'
      : 'border-midnight bg-midnight text-white'
    : 'border-midnight/15 bg-white text-ink/40'
  return (
    <span
      className={`inline-flex min-w-[2.25rem] items-center justify-center gap-1 rounded-full border px-2 py-0.5 ${cls}`}
    >
      <span className="font-semibold">{count}</span>
      <span className="text-[10px] uppercase tracking-wider">{label}</span>
    </span>
  )
}

function ListingColumn({
  label,
  tone,
  listings,
  currentUserId,
}: {
  label: string
  tone: 'drop' | 'add'
  listings: BoardListing[]
  currentUserId: string
}) {
  const labelClass =
    tone === 'drop'
      ? 'text-midnight bg-robroy/30 border-robroy-deep/40'
      : 'text-white bg-midnight border-midnight'

  return (
    <div className="flex flex-col gap-2">
      <span
        className={`inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${labelClass}`}
      >
        {label} ({listings.length})
      </span>
      {listings.length === 0 ? (
        <p className="text-xs text-ink/40">none</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {listings.map((l) => (
            <UserRow key={l.id} listing={l} isMe={l.user.id === currentUserId} />
          ))}
        </ul>
      )}
    </div>
  )
}

function UserRow({ listing, isMe }: { listing: BoardListing; isMe: boolean }) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const u = listing.user
  const name = u.name?.trim() || u.email.split('@')[0]
  const waDigits = (u.whatsapp_number ?? '').replace(/\D+/g, '')
  const hasWa = waDigits.length >= 6
  const contactHref = hasWa ? `https://wa.me/${waDigits}` : `mailto:${u.email}`
  const contactLabel = hasWa ? 'WhatsApp' : 'Email'
  const copyValue = hasWa ? `+${waDigits}` : u.email

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(copyValue)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setError('Could not copy. Long-press the number instead.')
    }
  }

  function onClose() {
    setError(null)
    startTransition(async () => {
      const result = await closeListing(listing.id)
      if (result?.ok === false) setError(result.error)
    })
  }

  function onDelete() {
    if (!confirm('Remove this listing? This cannot be undone.')) return
    setError(null)
    startTransition(async () => {
      const result = await deleteListing(listing.id)
      if (result?.ok === false) setError(result.error)
    })
  }

  return (
    <li className="flex flex-col gap-1 rounded-lg bg-jordy/10 px-2 py-1.5 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="flex flex-col leading-tight">
          <span className="font-medium text-midnight">{name}</span>
          {isMe && <span className="text-[11px] text-ink/60">you</span>}
        </span>
        {isMe ? (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-md border border-midnight/20 bg-white px-2 py-1 text-xs font-medium text-midnight transition hover:bg-jordy/15 disabled:opacity-50"
              title="Mark as traded. Stops showing on the board but keeps the record."
            >
              Traded
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={isPending}
              title="Remove this listing permanently."
              className="rounded-md border border-midnight/20 bg-white px-2 py-1 text-xs font-medium text-midnight transition hover:border-robroy-deep hover:bg-robroy/20 hover:text-robroy-deep disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        ) : revealed ? (
          <div className="flex shrink-0 items-center gap-1">
            <a
              href={contactHref}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-midnight bg-midnight px-3 py-1 text-xs font-medium text-white transition hover:bg-[#001d52]"
            >
              {contactLabel}
            </a>
            <button
              type="button"
              onClick={onCopy}
              title={`Copy ${hasWa ? 'number' : 'email'} to clipboard`}
              className="rounded-full border border-midnight/20 bg-white px-3 py-1 text-xs font-medium text-midnight transition hover:bg-jordy/15"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="rounded-full border border-midnight/20 bg-white px-3 py-1 text-xs font-medium text-midnight transition hover:bg-jordy/15"
          >
            Show contact
          </button>
        )}
      </div>
      {error && <span className="text-[11px] text-robroy-deep">{error}</span>}
    </li>
  )
}

function ScopeTabs({
  scope,
  setScope,
}: {
  scope: 'all' | 'mine'
  setScope: (s: 'all' | 'mine') => void
}) {
  const options: { id: 'all' | 'mine'; label: string }[] = [
    { id: 'all', label: 'All courses' },
    { id: 'mine', label: 'My courses' },
  ]
  return (
    <div className="flex items-center gap-1 self-start rounded-full border border-midnight/15 bg-white p-0.5">
      {options.map((o) => {
        const isActive = scope === o.id
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => setScope(o.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              isActive
                ? 'bg-midnight text-white shadow-sm'
                : 'text-ink hover:text-midnight'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function RefreshButton() {
  const router = useRouter()
  const [isRefreshing, startTransition] = useTransition()
  const [lastRefreshed, setLastRefreshed] = useState<number>(() => Date.now())
  const [ago, setAgo] = useState('just now')

  useEffect(() => {
    const tick = () => {
      const secs = Math.floor((Date.now() - lastRefreshed) / 1000)
      if (secs < 5) setAgo('just now')
      else if (secs < 60) setAgo(`${secs}s ago`)
      else setAgo(`${Math.floor(secs / 60)}m ago`)
    }
    tick()
    const id = setInterval(tick, 5000)
    return () => clearInterval(id)
  }, [lastRefreshed])

  function onClick() {
    startTransition(() => {
      router.refresh()
      setLastRefreshed(Date.now())
    })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isRefreshing}
      title="Refresh the board to pull in new listings"
      className="inline-flex items-center gap-1.5 rounded-full border border-midnight/15 bg-white px-2.5 py-1 text-xs font-medium text-ink transition hover:border-midnight/40 hover:text-midnight disabled:opacity-60"
    >
      <span
        aria-hidden
        className={`inline-block leading-none ${isRefreshing ? 'animate-spin' : ''}`}
      >
        ↻
      </span>
      <span>{ago}</span>
    </button>
  )
}
