'use client'

import { useMemo } from 'react'

export type CalendarStatus = 'kept' | 'dropping' | 'adding'
export type CourseSlot = 'AM' | 'PM' | 'AM+PM' | 'online' | 'fri-pm' | 'special'

export interface CalendarRow {
  id: string
  name: string
  ects: number
  professor: string | null
  schedule_text: string | null
  slot: CourseSlot | null
  start_date: string
  end_date: string
  session_dates: string[] // YYYY-MM-DD list
  status: CalendarStatus
}

interface MonthDef {
  name: string
  year: number
  monthIdx: number // 0-based
}

const MONTHS: MonthDef[] = [
  { name: 'June', year: 2026, monthIdx: 5 },
  { name: 'July', year: 2026, monthIdx: 6 },
  { name: 'August', year: 2026, monthIdx: 7 },
  { name: 'September', year: 2026, monthIdx: 8 },
  { name: 'October', year: 2026, monthIdx: 9 },
  { name: 'November', year: 2026, monthIdx: 10 },
  { name: 'December', year: 2026, monthIdx: 11 },
]

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

const STATUS_STYLE: Record<
  CalendarStatus,
  { bar: string; badge: string; dot: string; label: string }
> = {
  kept: {
    bar: 'bg-zinc-500',
    dot: 'bg-zinc-500',
    badge: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    label: 'Keeping',
  },
  dropping: {
    bar: 'bg-red-500',
    dot: 'bg-red-500',
    badge: 'bg-red-50 text-red-700 border-red-200',
    label: 'Dropping',
  },
  adding: {
    bar: 'bg-emerald-500',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    label: 'Adding',
  },
}

/** Tag = one course's claim on a given (date, slot-half). */
interface Tag {
  rowId: string
  name: string
  status: CalendarStatus
  isFullDay: boolean
}

interface DayBuckets {
  am: Tag[]
  pm: Tag[]
}

interface Props {
  rows: CalendarRow[]
}

export function CalendarClient({ rows }: Props) {
  /** Day-grid courses: have session_dates AND a non-flexible slot. */
  const gridRows = rows.filter(
    (r) => r.session_dates.length > 0 && r.slot && r.slot !== 'online',
  )
  /** Long-range / online / undated courses go to a separate strip. */
  const otherRows = rows.filter(
    (r) =>
      r.session_dates.length === 0 ||
      r.slot === 'online' ||
      !r.slot,
  )

  /** Index sessions by date → AM/PM. */
  const byDate = useMemo(() => {
    const m = new Map<string, DayBuckets>()
    for (const r of gridRows) {
      const slot = r.slot ?? 'special'
      for (const d of r.session_dates) {
        if (!m.has(d)) m.set(d, { am: [], pm: [] })
        const b = m.get(d)!
        const tag: Tag = {
          rowId: r.id,
          name: r.name,
          status: r.status,
          isFullDay: slot === 'AM+PM' || slot === 'special',
        }
        if (slot === 'AM' || slot === 'AM+PM' || slot === 'special') b.am.push(tag)
        if (slot === 'PM' || slot === 'AM+PM' || slot === 'fri-pm' || slot === 'special')
          b.pm.push(tag)
      }
    }
    return m
  }, [gridRows])

  /** Per-month: does it have any sessions? */
  const monthHasSessions = useMemo(() => {
    const set = new Set<string>()
    for (const r of gridRows)
      for (const d of r.session_dates) {
        const key = d.slice(0, 7) // YYYY-MM
        set.add(key)
      }
    return set
  }, [gridRows])

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 text-center text-sm text-zinc-700">
        <p className="font-medium text-zinc-900">Nothing on your calendar yet.</p>
        <p className="mt-1">
          Mark your assigned electives in{' '}
          <a href="/profile" className="underline">
            your profile
          </a>{' '}
          to see them here.
        </p>
      </div>
    )
  }

  const counts = {
    kept: rows.filter((r) => r.status === 'kept').length,
    dropping: rows.filter((r) => r.status === 'dropping').length,
    adding: rows.filter((r) => r.status === 'adding').length,
  }

  return (
    <div className="flex flex-col gap-5">
      <Legend counts={counts} />

      {otherRows.length > 0 && <OtherCommitments rows={otherRows} />}

      <div className="flex flex-col gap-6">
        {MONTHS.map((m) => {
          const monthKey = `${m.year}-${String(m.monthIdx + 1).padStart(2, '0')}`
          const hasSessions = monthHasSessions.has(monthKey)
          return (
            <MonthBlock
              key={monthKey}
              month={m}
              byDate={byDate}
              hasSessions={hasSessions}
            />
          )
        })}
      </div>

      <p className="text-[11px] leading-relaxed text-zinc-500">
        Top half of each day cell = morning (AM), bottom half = afternoon (PM). When
        two courses claim the same slot on the same day, they appear side by side —
        that&apos;s a clash. Tap a day for course names.
      </p>
    </div>
  )
}

function MonthBlock({
  month,
  byDate,
  hasSessions,
}: {
  month: MonthDef
  byDate: Map<string, DayBuckets>
  hasSessions: boolean
}) {
  // Build the weekday cells for this month. Mon-Fri only (no weekend electives).
  // Each row is a calendar week. We always start from the first Monday on/before day 1.
  const firstDay = new Date(Date.UTC(month.year, month.monthIdx, 1))
  const lastDay = new Date(Date.UTC(month.year, month.monthIdx + 1, 0))
  const daysInMonth = lastDay.getUTCDate()

  // 1 = Monday … 5 = Friday … 7 = Sunday. We want offset to align day 1 under its column.
  const firstWeekday = firstDay.getUTCDay() || 7 // 0 (Sun) → 7
  const startOffset = firstWeekday <= 5 ? firstWeekday - 1 : 0 // weekend → push to next Mon

  const cells: ({ day: number; iso: string } | null)[] = []
  if (firstWeekday <= 5) {
    for (let i = 0; i < startOffset; i++) cells.push(null)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(Date.UTC(month.year, month.monthIdx, d))
    const wd = dt.getUTCDay() || 7
    if (wd >= 1 && wd <= 5) {
      const iso = dt.toISOString().slice(0, 10)
      cells.push({ day: d, iso })
    }
  }
  // Pad to multiple of 5.
  while (cells.length % 5 !== 0) cells.push(null)

  return (
    <section className="flex flex-col gap-2">
      <header className="flex items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold tracking-tight text-zinc-900 sm:text-lg">
          {month.name} {month.year}
        </h2>
        {!hasSessions && (
          <span className="text-[11px] text-zinc-400">no sessions</span>
        )}
      </header>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {/* Weekday header */}
        <div className="grid grid-cols-5 border-b border-zinc-200 bg-zinc-50">
          {WEEKDAY_LABELS.map((w) => (
            <div
              key={w}
              className="px-1 py-1.5 text-center text-[10px] font-medium uppercase tracking-wider text-zinc-500 sm:text-xs"
            >
              {w}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-5">
          {cells.map((cell, idx) => (
            <DayCell
              key={idx}
              cell={cell}
              buckets={cell ? byDate.get(cell.iso) ?? null : null}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function DayCell({
  cell,
  buckets,
}: {
  cell: { day: number; iso: string } | null
  buckets: DayBuckets | null
}) {
  if (!cell) {
    return <div className="h-16 border-l border-t border-zinc-100 bg-zinc-50/30 first:border-l-0" />
  }
  const am = buckets?.am ?? []
  const pm = buckets?.pm ?? []
  const hasAm = am.length > 0
  const hasPm = pm.length > 0

  const tooltip = cell
    ? [
        formatLongDate(cell.iso),
        hasAm ? `AM: ${am.map((t) => t.name).join(' · ')}` : '',
        hasPm ? `PM: ${pm.map((t) => t.name).join(' · ')}` : '',
      ]
        .filter(Boolean)
        .join('\n')
    : ''

  return (
    <div
      title={tooltip}
      className="relative flex h-16 flex-col border-l border-t border-zinc-100 first:border-l-0"
    >
      <span className="px-1 pt-0.5 text-[10px] font-medium text-zinc-500 sm:text-[11px]">
        {cell.day}
      </span>
      <div className="mt-auto flex flex-col gap-px">
        <SlotBar tags={am} />
        <SlotBar tags={pm} />
      </div>
    </div>
  )
}

function SlotBar({ tags }: { tags: Tag[] }) {
  if (tags.length === 0) {
    return <div className="h-3 sm:h-3.5" />
  }
  if (tags.length === 1) {
    const s = STATUS_STYLE[tags[0].status]
    return <div className={`h-3 sm:h-3.5 ${s.bar}`} />
  }
  // Clash — render each tag as an equal-width strip.
  return (
    <div className="flex h-3 sm:h-3.5">
      {tags.map((t, i) => {
        const s = STATUS_STYLE[t.status]
        return (
          <div
            key={`${t.rowId}-${i}`}
            className={`flex-1 ${s.bar} ${i > 0 ? 'border-l border-white' : ''}`}
          />
        )
      })}
    </div>
  )
}

function OtherCommitments({ rows }: { rows: CalendarRow[] }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-600">
        Other commitments
      </h3>
      <ul className="flex flex-col gap-1.5">
        {rows.map((r) => {
          const s = STATUS_STYLE[r.status]
          return (
            <li key={r.id} className="flex items-start gap-2 text-xs">
              <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
              <span className="flex-1">
                <span className="font-medium text-zinc-900">{r.name}</span>
                <span className="text-zinc-500">
                  {' · '}
                  {r.schedule_text ?? `${r.start_date} → ${r.end_date}`}
                </span>
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function Legend({ counts }: { counts: { kept: number; dropping: number; adding: number } }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs">
      <LegendChip status="kept" count={counts.kept} />
      <LegendChip status="dropping" count={counts.dropping} />
      <LegendChip status="adding" count={counts.adding} />
    </div>
  )
}

function LegendChip({ status, count }: { status: CalendarStatus; count: number }) {
  const style = STATUS_STYLE[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-medium ${style.badge}`}
    >
      <span className={`h-2 w-2 rounded-full ${style.dot}`} />
      {style.label} ({count})
    </span>
  )
}

function formatLongDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}
