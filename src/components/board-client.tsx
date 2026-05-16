'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { TERM_LABELS, type Term } from '@/lib/types'
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

type ScopeFilter = 'all' | 'mine' | 'others'

export function BoardClient({
  currentUserId,
  courses,
  listings,
  myCourseIds,
}: Props) {
  const [q, setQ] = useState('')
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [scope, setScope] = useState<ScopeFilter>('all')

  const myCourseSet = useMemo(() => new Set(myCourseIds), [myCourseIds])

  const courseIdsWithListings = useMemo(() => {
    const s = new Set<string>()
    for (const l of listings) s.add(l.course_id)
    return s
  }, [listings])

  // Add-demand per course: how many people want to add it. Drives "Most wanted".
  const addDemand = useMemo(() => {
    const m = new Map<string, number>()
    for (const l of listings) {
      if (l.type !== 'want_add') continue
      m.set(l.course_id, (m.get(l.course_id) ?? 0) + 1)
    }
    return m
  }, [listings])

  const mostWanted = useMemo(() => {
    const items = [...addDemand.entries()]
      .map(([id, n]) => ({ course: courses.find((c) => c.id === id), n }))
      .filter((x): x is { course: BoardCourse; n: number } => Boolean(x.course))
    items.sort((a, b) => b.n - a.n || a.course.name.localeCompare(b.course.name))
    return items.slice(0, 5)
  }, [addDemand, courses])

  const filteredCourses = useMemo(() => {
    const term = q.trim().toLowerCase()
    return courses
      .filter((c) => courseIdsWithListings.has(c.id))
      .filter((c) => (courseFilter === 'all' ? true : c.id === courseFilter))
      .filter((c) => {
        if (scope === 'mine') return myCourseSet.has(c.id)
        if (scope === 'others') return !myCourseSet.has(c.id)
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
  }, [courses, courseIdsWithListings, q, courseFilter, scope, myCourseSet])

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
    const m: Record<Term, BoardCourse[]> = { summer: [], september: [], term4: [] }
    for (const c of courses) m[c.term].push(c)
    return m
  }, [courses])

  if (listings.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 text-center text-sm text-zinc-700">
        <p className="font-medium text-zinc-900">Nobody&apos;s posted yet.</p>
        <p className="mt-1">
          Be the first.{' '}
          <Link href="/profile" className="underline">
            Post the courses you want to drop or add →
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {mostWanted.length > 0 && (
        <MostWantedStrip
          items={mostWanted}
          onPick={(id) => setCourseFilter(id)}
          activeId={courseFilter}
        />
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-zinc-500">
          <span className="font-medium text-red-700">{totalDrops}</span> drops ·{' '}
          <span className="font-medium text-emerald-700">{totalAdds}</span> adds
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 sm:w-auto"
          >
            <option value="all">All courses</option>
            {(['summer', 'september', 'term4'] as Term[]).map((term) =>
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
          <input
            type="search"
            placeholder="Search name or professor…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 sm:w-56"
          />
        </div>
      </div>

      <ScopeTabs scope={scope} setScope={setScope} myCount={myCourseSet.size} />

      {filteredCourses.length === 0 ? (
        <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-4 text-center text-sm text-zinc-500">
          No matches.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {(['summer', 'september', 'term4'] as Term[]).map((term) => {
            const inTerm = filteredCourses.filter((c) => c.term === term)
            if (inTerm.length === 0) return null
            return (
              <section key={term} className="flex flex-col gap-3">
                <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
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
                      />
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}

      <p className="mt-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3 text-center text-xs text-zinc-600">
        Don&apos;t see your course?{' '}
        <Link href="/profile" className="font-medium underline">
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
}: {
  course: BoardCourse
  drop: BoardListing[]
  add: BoardListing[]
  currentUserId: string
}) {
  return (
    <article className="rounded-lg border border-zinc-200 p-4">
      <header className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-zinc-900">{course.name}</h3>
        <p className="text-xs text-zinc-500">
          {course.class_code ? `${course.class_code} · ` : ''}
          {course.ects} ECTS · {course.schedule_text ?? '—'}
          {course.professor ? ` · ${course.professor}` : ''}
        </p>
      </header>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ListingColumn
          label="Has & wants to drop"
          tone="red"
          listings={drop}
          currentUserId={currentUserId}
        />
        <ListingColumn
          label="Wants to add"
          tone="emerald"
          listings={add}
          currentUserId={currentUserId}
        />
      </div>
    </article>
  )
}

function ListingColumn({
  label,
  tone,
  listings,
  currentUserId,
}: {
  label: string
  tone: 'red' | 'emerald'
  listings: BoardListing[]
  currentUserId: string
}) {
  const labelClass =
    tone === 'red'
      ? 'text-red-700 bg-red-50 border-red-100'
      : 'text-emerald-700 bg-emerald-50 border-emerald-100'

  return (
    <div className="flex flex-col gap-2">
      <span
        className={`inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${labelClass}`}
      >
        {label} ({listings.length})
      </span>
      {listings.length === 0 ? (
        <p className="text-xs text-zinc-400">—</p>
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
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const u = listing.user
  const name = u.name?.trim() || u.email.split('@')[0]
  const waDigits = (u.whatsapp_number ?? '').replace(/\D+/g, '')
  const hasWa = waDigits.length >= 6
  const contactHref = hasWa ? `https://wa.me/${waDigits}` : `mailto:${u.email}`
  const contactLabel = hasWa ? 'WhatsApp' : 'Email'

  function onClose() {
    setError(null)
    startTransition(async () => {
      const result = await closeListing(listing.id)
      if (result?.ok === false) setError(result.error)
    })
  }

  function onDelete() {
    if (!confirm('Delete this listing? This cannot be undone.')) return
    setError(null)
    startTransition(async () => {
      const result = await deleteListing(listing.id)
      if (result?.ok === false) setError(result.error)
    })
  }

  return (
    <li className="flex flex-col gap-1 rounded-md bg-zinc-50 px-2 py-1.5 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="flex flex-col leading-tight">
          <span className="font-medium text-zinc-900">{name}</span>
          {isMe && <span className="text-[11px] text-zinc-500">you</span>}
        </span>
        {isMe ? (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
              title="Mark this listing as done; it stops showing on the board."
            >
              Done
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={isPending}
              aria-label="Delete listing"
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
            >
              ✕
            </button>
          </div>
        ) : revealed ? (
          <a
            href={contactHref}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-zinc-900 bg-zinc-900 px-2 py-1 text-xs font-medium text-white"
          >
            {contactLabel}
          </a>
        ) : (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Show contact
          </button>
        )}
      </div>
      {error && <span className="text-[11px] text-red-600">{error}</span>}
    </li>
  )
}

function MostWantedStrip({
  items,
  onPick,
  activeId,
}: {
  items: { course: BoardCourse; n: number }[]
  onPick: (id: string) => void
  activeId: string
}) {
  return (
    <section className="flex flex-col gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
      <h3 className="text-xs font-medium uppercase tracking-wider text-emerald-800">
        Most wanted right now
      </h3>
      <ul className="flex flex-wrap gap-1.5">
        {items.map(({ course, n }) => {
          const isActive = activeId === course.id
          return (
            <li key={course.id}>
              <button
                type="button"
                onClick={() => onPick(isActive ? 'all' : course.id)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                  isActive
                    ? 'border-emerald-700 bg-emerald-700 text-white'
                    : 'border-emerald-300 bg-white text-emerald-900 hover:border-emerald-500'
                }`}
              >
                <span className="truncate">{course.name}</span>
                <span
                  className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold ${
                    isActive ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {n}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function ScopeTabs({
  scope,
  setScope,
  myCount,
}: {
  scope: 'all' | 'mine' | 'others'
  setScope: (s: 'all' | 'mine' | 'others') => void
  myCount: number
}) {
  const options: { id: 'all' | 'mine' | 'others'; label: string; subtitle?: string }[] = [
    { id: 'all', label: 'All courses' },
    { id: 'mine', label: 'My courses', subtitle: myCount > 0 ? `${myCount}` : undefined },
    { id: 'others', label: 'Others' },
  ]
  return (
    <div className="flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 p-0.5 self-start">
      {options.map((o) => {
        const isActive = scope === o.id
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => setScope(o.id)}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${
              isActive
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <span>{o.label}</span>
            {o.subtitle && (
              <span
                className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-zinc-200 text-zinc-700'
                }`}
              >
                {o.subtitle}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
