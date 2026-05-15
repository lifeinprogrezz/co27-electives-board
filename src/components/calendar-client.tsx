'use client'

import { useMemo } from 'react'

export type CalendarStatus = 'kept' | 'dropping' | 'adding'

export interface CalendarRow {
  id: string
  name: string
  ects: number
  professor: string | null
  schedule_text: string | null
  start_date: string // YYYY-MM-DD
  end_date: string // YYYY-MM-DD
  status: CalendarStatus
}

// Calendar spans Jun 1 → Dec 31, 2026 (7 months, 214 days).
const TIMELINE_START = new Date(Date.UTC(2026, 5, 1)).getTime()
const TIMELINE_END = new Date(Date.UTC(2026, 11, 31)).getTime()
const TIMELINE_SPAN_MS = TIMELINE_END - TIMELINE_START

const MONTHS: { label: string; short: string; idx: number }[] = [
  { label: 'June', short: 'Jun', idx: 5 },
  { label: 'July', short: 'Jul', idx: 6 },
  { label: 'August', short: 'Aug', idx: 7 },
  { label: 'September', short: 'Sep', idx: 8 },
  { label: 'October', short: 'Oct', idx: 9 },
  { label: 'November', short: 'Nov', idx: 10 },
  { label: 'December', short: 'Dec', idx: 11 },
]

function pctFromTimeline(dateStr: string): number {
  const t = new Date(`${dateStr}T00:00:00Z`).getTime()
  const clamped = Math.max(TIMELINE_START, Math.min(TIMELINE_END, t))
  return ((clamped - TIMELINE_START) / TIMELINE_SPAN_MS) * 100
}

const STATUS_STYLE: Record<
  CalendarStatus,
  { bar: string; badge: string; label: string }
> = {
  kept: {
    bar: 'bg-zinc-400 border-zinc-500 text-white',
    badge: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    label: 'Keeping',
  },
  dropping: {
    bar: 'bg-red-500 border-red-600 text-white',
    badge: 'bg-red-50 text-red-700 border-red-200',
    label: 'Dropping',
  },
  adding: {
    bar: 'bg-emerald-500 border-emerald-600 text-white',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    label: 'Adding',
  },
}

interface Props {
  rows: CalendarRow[]
}

export function CalendarClient({ rows }: Props) {
  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        if (a.start_date !== b.start_date) return a.start_date < b.start_date ? -1 : 1
        return a.name.localeCompare(b.name)
      }),
    [rows],
  )

  if (sorted.length === 0) {
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
    kept: sorted.filter((r) => r.status === 'kept').length,
    dropping: sorted.filter((r) => r.status === 'dropping').length,
    adding: sorted.filter((r) => r.status === 'adding').length,
  }

  return (
    <div className="flex flex-col gap-4">
      <Legend counts={counts} />

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {/* Month header */}
        <div className="grid grid-cols-[110px_1fr] border-b border-zinc-200 bg-zinc-50 sm:grid-cols-[180px_1fr]">
          <div className="px-2 py-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500 sm:px-3 sm:text-xs">
            Course
          </div>
          <div className="relative grid grid-cols-7">
            {MONTHS.map((m) => (
              <div
                key={m.idx}
                className="border-l border-zinc-200 px-1 py-2 text-center text-[10px] font-medium uppercase tracking-wider text-zinc-500 sm:px-2 sm:text-xs"
              >
                <span className="sm:hidden">{m.short[0]}</span>
                <span className="hidden sm:inline">{m.short}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        <ul className="divide-y divide-zinc-100">
          {sorted.map((row) => (
            <li
              key={row.id}
              className="grid grid-cols-[110px_1fr] sm:grid-cols-[180px_1fr]"
            >
              <div className="flex min-w-0 flex-col gap-0.5 px-2 py-2 sm:px-3">
                <span className="truncate text-xs font-medium text-zinc-900 sm:text-sm">
                  {row.name}
                </span>
                <span className="truncate text-[10px] text-zinc-500 sm:text-[11px]">
                  {row.ects} ECTS
                  {row.professor ? ` · ${row.professor.split(/[+,]/)[0].trim()}` : ''}
                </span>
              </div>
              <div className="relative grid grid-cols-7 py-2">
                {/* Month gridlines (background) */}
                {MONTHS.map((m, i) => (
                  <div
                    key={m.idx}
                    className={`h-full ${i === 0 ? '' : 'border-l border-zinc-100'}`}
                  />
                ))}
                {/* Bar */}
                <CourseBar row={row} />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[11px] leading-relaxed text-zinc-500">
        Bars span each course&apos;s date range. Tap a bar for details. Overlapping
        bars on the same week = schedule conflict.
      </p>
    </div>
  )
}

function CourseBar({ row }: { row: CalendarRow }) {
  const left = pctFromTimeline(row.start_date)
  const right = 100 - pctFromTimeline(row.end_date)
  const style = STATUS_STYLE[row.status]

  const title = [
    row.name,
    row.schedule_text ?? '',
    row.professor ?? '',
    `${row.ects} ECTS`,
    style.label,
  ]
    .filter(Boolean)
    .join('\n')

  return (
    <div
      title={title}
      aria-label={title}
      className={`pointer-events-auto absolute top-1/2 flex h-5 -translate-y-1/2 items-center overflow-hidden rounded-md border px-1.5 text-[10px] font-medium sm:h-6 sm:text-[11px] ${style.bar}`}
      style={{
        left: `max(${left}%, 0px)`,
        right: `max(${right}%, 0px)`,
      }}
    >
      <span className="truncate">{style.label}</span>
    </div>
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
      <span className={`h-2 w-2 rounded-full ${style.bar.split(' ')[0]}`} />
      {style.label} ({count})
    </span>
  )
}
