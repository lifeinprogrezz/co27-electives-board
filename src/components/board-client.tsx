'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { TERM_LABELS, type Term } from '@/lib/types'

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
    cohort_section: 1 | 2 | 3 | null
  }
}

interface Props {
  currentUserId: string
  courses: BoardCourse[]
  listings: BoardListing[]
}

export function BoardClient({ currentUserId, courses, listings }: Props) {
  const [q, setQ] = useState('')

  const courseById = useMemo(() => {
    const m = new Map<string, BoardCourse>()
    for (const c of courses) m.set(c.id, c)
    return m
  }, [courses])

  const courseIdsWithListings = useMemo(() => {
    const s = new Set<string>()
    for (const l of listings) s.add(l.course_id)
    return s
  }, [listings])

  const filteredCourses = useMemo(() => {
    const term = q.trim().toLowerCase()
    return courses
      .filter((c) => courseIdsWithListings.has(c.id))
      .filter((c) => {
        if (!term) return true
        return (
          c.name.toLowerCase().includes(term) ||
          (c.class_code ?? '').toLowerCase().includes(term) ||
          (c.professor ?? '').toLowerCase().includes(term)
        )
      })
  }, [courses, courseIdsWithListings, q])

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
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-500">
          <span className="font-medium text-red-700">{totalDrops}</span> drops ·{' '}
          <span className="font-medium text-emerald-700">{totalAdds}</span> adds
        </p>
        <input
          type="search"
          placeholder="Filter by course or professor…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full max-w-xs rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
        />
      </div>

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
  const u = listing.user
  const name = u.name?.trim() || u.email.split('@')[0]
  const waDigits = (u.whatsapp_number ?? '').replace(/\D+/g, '')
  const hasWa = waDigits.length >= 6
  const contactHref = hasWa ? `https://wa.me/${waDigits}` : `mailto:${u.email}`
  const contactLabel = hasWa ? 'WhatsApp' : 'Email'

  return (
    <li className="flex items-center justify-between gap-2 rounded-md bg-zinc-50 px-2 py-1.5 text-sm">
      <span className="flex flex-col leading-tight">
        <span className="font-medium text-zinc-900">{name}</span>
        <span className="text-[11px] text-zinc-500">
          Section {u.cohort_section ?? '?'}
          {isMe ? ' · you' : ''}
        </span>
      </span>
      {isMe ? (
        <span className="text-[11px] text-zinc-400">your post</span>
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
    </li>
  )
}
