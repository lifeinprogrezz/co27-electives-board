'use client'

import { useMemo, useState } from 'react'

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
  session_dates: string[]
  status: CalendarStatus
}

interface MonthDef {
  name: string
  year: number
  monthIdx: number
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
  {
    solid: string
    softBg: string
    border: string
    text: string
    dot: string
    badge: string
    label: string
  }
> = {
  kept: {
    solid: 'bg-sky-500',
    softBg: 'bg-sky-50',
    border: 'border-sky-300',
    text: 'text-sky-900',
    dot: 'bg-sky-500',
    badge: 'bg-sky-50 text-sky-800 border-sky-200',
    label: 'Keeping',
  },
  dropping: {
    solid: 'bg-rose-500',
    softBg: 'bg-rose-50',
    border: 'border-rose-300',
    text: 'text-rose-900',
    dot: 'bg-rose-500',
    badge: 'bg-rose-50 text-rose-800 border-rose-200',
    label: 'Dropping',
  },
  adding: {
    solid: 'bg-emerald-500',
    softBg: 'bg-emerald-50',
    border: 'border-emerald-300',
    text: 'text-emerald-900',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    label: 'Adding',
  },
}

interface Tag {
  rowId: string
  name: string
  code: string
  status: CalendarStatus
}

interface DayBuckets {
  am: Tag[]
  pm: Tag[]
}

interface Props {
  rows: CalendarRow[]
}

function abbreviate(name: string): string {
  // First letter of each non-trivial word, max 3 chars.
  const ignore = new Set(['the', 'and', 'of', 'in', 'on', 'a', 'to', 'for', '&'])
  const cleaned = name
    .replace(/\(.*?\)/g, '') // strip parens
    .replace(/[:,]/g, ' ')
  const parts = cleaned
    .split(/\s+/)
    .filter((p) => p && !ignore.has(p.toLowerCase()))
  const letters = parts.map((p) => p[0]?.toUpperCase() ?? '').filter(Boolean)
  return letters.slice(0, 3).join('') || name.slice(0, 3).toUpperCase()
}

export function CalendarClient({ rows }: Props) {
  // selectedDay holds a YYYY-MM-DD when the user taps a day; null otherwise.
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const gridRows = rows.filter(
    (r) => r.session_dates.length > 0 && r.slot && r.slot !== 'online',
  )
  const otherRows = rows.filter(
    (r) => r.session_dates.length === 0 || r.slot === 'online' || !r.slot,
  )

  const codeByCourse = useMemo(() => {
    const m = new Map<string, string>()
    for (const r of rows) m.set(r.id, abbreviate(r.name))
    return m
  }, [rows])

  const byDate = useMemo(() => {
    const m = new Map<string, DayBuckets>()
    for (const r of gridRows) {
      const slot = r.slot ?? 'special'
      const code = codeByCourse.get(r.id) ?? ''
      for (const d of r.session_dates) {
        if (!m.has(d)) m.set(d, { am: [], pm: [] })
        const b = m.get(d)!
        const tag: Tag = { rowId: r.id, name: r.name, code, status: r.status }
        if (slot === 'AM' || slot === 'AM+PM' || slot === 'special') b.am.push(tag)
        if (slot === 'PM' || slot === 'AM+PM' || slot === 'fri-pm' || slot === 'special')
          b.pm.push(tag)
      }
    }
    return m
  }, [gridRows, codeByCourse])

  /** Which day-grid rows have at least one session in YYYY-MM month. */
  const rowsByMonth = useMemo(() => {
    const m = new Map<string, CalendarRow[]>()
    for (const r of gridRows) {
      const seen = new Set<string>()
      for (const d of r.session_dates) {
        const key = d.slice(0, 7)
        if (seen.has(key)) continue
        seen.add(key)
        if (!m.has(key)) m.set(key, [])
        m.get(key)!.push(r)
      }
    }
    return m
  }, [gridRows])

  /** Continuous (online/long-range) rows active in each month. */
  const continuousByMonth = useMemo(() => {
    const m = new Map<string, CalendarRow[]>()
    for (const r of otherRows) {
      if (!r.start_date || !r.end_date) continue
      for (const month of MONTHS) {
        const monthStart = new Date(Date.UTC(month.year, month.monthIdx, 1))
        const monthEnd = new Date(Date.UTC(month.year, month.monthIdx + 1, 0))
        const courseStart = new Date(`${r.start_date}T00:00:00Z`)
        const courseEnd = new Date(`${r.end_date}T00:00:00Z`)
        if (courseEnd < monthStart || courseStart > monthEnd) continue
        const key = `${month.year}-${String(month.monthIdx + 1).padStart(2, '0')}`
        if (!m.has(key)) m.set(key, [])
        m.get(key)!.push(r)
      }
    }
    return m
  }, [otherRows])

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

      <div className="flex flex-col gap-7">
        {MONTHS.map((m) => {
          const monthKey = `${m.year}-${String(m.monthIdx + 1).padStart(2, '0')}`
          const inMonth = rowsByMonth.get(monthKey) ?? []
          const continuousInMonth = continuousByMonth.get(monthKey) ?? []
          return (
            <MonthBlock
              key={monthKey}
              month={m}
              byDate={byDate}
              monthRows={inMonth}
              continuousRows={continuousInMonth}
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
            />
          )
        })}
      </div>

      <p className="text-[11px] leading-relaxed text-zinc-500">
        Top half of each day = morning (AM); bottom half = afternoon (PM). Two
        courses in the same slot = side-by-side strips = clash. Tap any day for
        full details.
      </p>
    </div>
  )
}

function MonthBlock({
  month,
  byDate,
  monthRows,
  continuousRows,
  selectedDay,
  setSelectedDay,
}: {
  month: MonthDef
  byDate: Map<string, DayBuckets>
  monthRows: CalendarRow[]
  continuousRows: CalendarRow[]
  selectedDay: string | null
  setSelectedDay: (d: string | null) => void
}) {
  const firstDay = new Date(Date.UTC(month.year, month.monthIdx, 1))
  const lastDay = new Date(Date.UTC(month.year, month.monthIdx + 1, 0))
  const daysInMonth = lastDay.getUTCDate()
  const firstWeekday = firstDay.getUTCDay() || 7
  const startOffset = firstWeekday <= 5 ? firstWeekday - 1 : 0

  const cells: ({ day: number; iso: string } | null)[] = []
  if (firstWeekday <= 5) for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(Date.UTC(month.year, month.monthIdx, d))
    const wd = dt.getUTCDay() || 7
    if (wd >= 1 && wd <= 5) {
      const iso = dt.toISOString().slice(0, 10)
      cells.push({ day: d, iso })
    }
  }
  while (cells.length % 5 !== 0) cells.push(null)

  // Group monthRows + continuousRows by status for the header summary.
  // Continuous rows get a "(online)" or "(continuous)" suffix in the line.
  const allInMonth = [...monthRows, ...continuousRows]
  const groups = {
    kept: allInMonth.filter((r) => r.status === 'kept'),
    dropping: allInMonth.filter((r) => r.status === 'dropping'),
    adding: allInMonth.filter((r) => r.status === 'adding'),
  }
  const continuousIds = new Set(continuousRows.map((r) => r.id))
  const hasAny = allInMonth.length > 0

  // Selected day buckets (for the detail flyout).
  const selectedBuckets =
    selectedDay && selectedDay.startsWith(`${month.year}-${String(month.monthIdx + 1).padStart(2, '0')}`)
      ? byDate.get(selectedDay) ?? null
      : null

  return (
    <section className="flex flex-col gap-2.5">
      <header className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold tracking-tight text-zinc-900 sm:text-lg">
            {month.name} {month.year}
          </h2>
          {!hasAny && <span className="text-[11px] text-zinc-400">no sessions</span>}
        </div>
        {hasAny && (
          <div className="flex flex-col gap-1 text-[11px] sm:text-xs">
            <MonthGroupLine
              status="kept"
              rows={groups.kept}
              continuousIds={continuousIds}
            />
            <MonthGroupLine
              status="dropping"
              rows={groups.dropping}
              continuousIds={continuousIds}
            />
            <MonthGroupLine
              status="adding"
              rows={groups.adding}
              continuousIds={continuousIds}
            />
          </div>
        )}
      </header>

      {continuousRows.length > 0 && (
        <ContinuousTracks rows={continuousRows} month={month} />
      )}

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
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

        <div className="grid grid-cols-5">
          {cells.map((cell, idx) => (
            <DayCell
              key={idx}
              cell={cell}
              buckets={cell ? byDate.get(cell.iso) ?? null : null}
              isSelected={cell?.iso === selectedDay}
              onSelect={() =>
                cell && setSelectedDay(cell.iso === selectedDay ? null : cell.iso)
              }
            />
          ))}
        </div>
      </div>

      {selectedBuckets && selectedDay && (
        <SelectedDayDetail
          iso={selectedDay}
          buckets={selectedBuckets}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </section>
  )
}

function MonthGroupLine({
  status,
  rows,
  continuousIds,
}: {
  status: CalendarStatus
  rows: CalendarRow[]
  continuousIds: Set<string>
}) {
  if (rows.length === 0) return null
  const style = STATUS_STYLE[status]
  return (
    <div className="flex flex-wrap items-baseline gap-1.5">
      <span className={`inline-flex items-center gap-1 font-medium ${style.text}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
        {style.label}:
      </span>
      <span className="text-zinc-700">
        {rows.map((r, i) => (
          <span key={r.id}>
            {i > 0 ? ', ' : ''}
            <span className={style.text}>{r.name}</span>
            {continuousIds.has(r.id) && (
              <span className="text-zinc-400"> (continuous)</span>
            )}
          </span>
        ))}
      </span>
    </div>
  )
}

function ContinuousTracks({
  rows,
  month,
}: {
  rows: CalendarRow[]
  month: MonthDef
}) {
  // Render each continuous course as a horizontal bar spanning the days it
  // occupies in THIS month (clipped to month boundaries).
  const monthStart = new Date(Date.UTC(month.year, month.monthIdx, 1))
  const monthEnd = new Date(Date.UTC(month.year, month.monthIdx + 1, 0))
  const daysInMonth = monthEnd.getUTCDate()

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-2">
      <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
        Continuous tracks (online / long-range)
      </span>
      <ul className="flex flex-col gap-1.5">
        {rows.map((r) => {
          const courseStart = new Date(`${r.start_date}T00:00:00Z`)
          const courseEnd = new Date(`${r.end_date}T00:00:00Z`)
          const clippedStart = courseStart < monthStart ? monthStart : courseStart
          const clippedEnd = courseEnd > monthEnd ? monthEnd : courseEnd
          const startDay = clippedStart.getUTCDate()
          const endDay = clippedEnd.getUTCDate()
          const leftPct = ((startDay - 1) / daysInMonth) * 100
          const widthPct = ((endDay - startDay + 1) / daysInMonth) * 100
          const s = STATUS_STYLE[r.status]
          return (
            <li
              key={r.id}
              className="flex flex-col gap-1"
              title={`${r.name} · ${r.schedule_text ?? `${r.start_date} → ${r.end_date}`} · ${s.label}`}
            >
              <div className="relative h-5 rounded bg-white">
                <div
                  className={`absolute top-0 h-full rounded ${s.solid} flex items-center px-1.5`}
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                >
                  <span className="truncate text-[10px] font-semibold text-white">
                    {r.name}
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-zinc-500">
                {r.schedule_text ?? `${r.start_date} → ${r.end_date}`}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function DayCell({
  cell,
  buckets,
  isSelected,
  onSelect,
}: {
  cell: { day: number; iso: string } | null
  buckets: DayBuckets | null
  isSelected: boolean
  onSelect: () => void
}) {
  if (!cell) {
    return <div className="h-[88px] border-l border-t border-zinc-100 bg-zinc-50/40 first:border-l-0" />
  }

  const am = buckets?.am ?? []
  const pm = buckets?.pm ?? []
  const isClickable = am.length > 0 || pm.length > 0

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!isClickable}
      className={`group relative flex h-[88px] flex-col border-l border-t border-zinc-100 text-left transition first:border-l-0 ${
        isSelected ? 'ring-2 ring-zinc-900 ring-inset' : ''
      } ${isClickable ? 'cursor-pointer hover:bg-zinc-50' : 'cursor-default'}`}
    >
      <span className="px-1 pt-0.5 text-[10px] font-medium text-zinc-500 sm:text-[11px]">
        {cell.day}
      </span>
      <SlotZone label="AM" tags={am} />
      <div className="h-px bg-zinc-100" />
      <SlotZone label="PM" tags={pm} />
    </button>
  )
}

function SlotZone({ label, tags }: { label: 'AM' | 'PM'; tags: Tag[] }) {
  const isEmpty = tags.length === 0
  return (
    <div
      className={`relative flex flex-1 items-stretch ${
        isEmpty ? 'bg-white' : ''
      }`}
    >
      <span
        className={`pointer-events-none absolute left-0.5 top-0 text-[8px] font-medium uppercase tracking-wider ${
          isEmpty ? 'text-zinc-300' : 'text-white/80 mix-blend-luminosity'
        } sm:text-[9px]`}
      >
        {label}
      </span>
      {!isEmpty && (
        <div className="flex flex-1 items-stretch pl-4 pr-0.5 py-0.5">
          {tags.length === 1 ? (
            <ChipSolo tag={tags[0]} />
          ) : (
            tags.map((t, i) => (
              <ChipSplit key={`${t.rowId}-${i}`} tag={t} count={tags.length} />
            ))
          )}
        </div>
      )}
    </div>
  )
}

function ChipSolo({ tag }: { tag: Tag }) {
  const s = STATUS_STYLE[tag.status]
  return (
    <span
      className={`flex flex-1 items-center justify-center overflow-hidden rounded-sm border ${s.solid} ${s.border} px-1 text-[9px] font-semibold leading-tight text-white sm:text-[10px]`}
    >
      {tag.code}
    </span>
  )
}

function ChipSplit({ tag, count }: { tag: Tag; count: number }) {
  const s = STATUS_STYLE[tag.status]
  return (
    <span
      className={`flex flex-1 items-center justify-center overflow-hidden border-r border-white/60 last:border-r-0 ${s.solid} text-[8px] font-bold leading-none text-white ${count >= 3 ? 'min-w-0' : ''}`}
    >
      <span className="truncate px-0.5">{count > 3 ? '•' : tag.code}</span>
    </span>
  )
}

function SelectedDayDetail({
  iso,
  buckets,
  onClose,
}: {
  iso: string
  buckets: DayBuckets
  onClose: () => void
}) {
  return (
    <div className="rounded-lg border border-zinc-300 bg-white p-3 shadow-sm">
      <header className="mb-2 flex items-baseline justify-between">
        <h4 className="text-sm font-semibold text-zinc-900">{formatLongDate(iso)}</h4>
        <button
          type="button"
          onClick={onClose}
          className="text-[11px] text-zinc-500 underline hover:text-zinc-800"
        >
          close
        </button>
      </header>
      <div className="flex flex-col gap-2">
        <SlotDetailRow label="Morning (AM)" tags={buckets.am} />
        <SlotDetailRow label="Afternoon (PM)" tags={buckets.pm} />
      </div>
    </div>
  )
}

function SlotDetailRow({ label, tags }: { label: string; tags: Tag[] }) {
  return (
    <div className="flex flex-col gap-1 text-xs">
      <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      {tags.length === 0 ? (
        <span className="text-zinc-400">— free —</span>
      ) : (
        <ul className="flex flex-col gap-1">
          {tags.map((t, i) => {
            const s = STATUS_STYLE[t.status]
            return (
              <li
                key={`${t.rowId}-${i}`}
                className={`flex items-center gap-2 rounded-md border px-2 py-1 ${s.softBg} ${s.border}`}
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
                <span className={`text-xs font-medium ${s.text}`}>{t.name}</span>
                <span className={`ml-auto text-[10px] font-medium ${s.text}`}>
                  {s.label}
                </span>
              </li>
            )
          })}
          {tags.length > 1 && (
            <li className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800">
              ⚠ Clash — {tags.length} courses in this slot
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

function Legend({
  counts,
}: {
  counts: { kept: number; dropping: number; adding: number }
}) {
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
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}
