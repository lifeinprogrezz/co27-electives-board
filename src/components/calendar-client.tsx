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
  { name: 'January', year: 2027, monthIdx: 0 },
  { name: 'February', year: 2027, monthIdx: 1 },
  { name: 'March', year: 2027, monthIdx: 2 },
]

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

// Chip styles are intentionally pastel so the calendar's date grid + AM/PM
// labels read as the dominant structure, with course chips as ambient marks.
const STATUS_STYLE: Record<
  CalendarStatus,
  {
    strip: string
    chipBg: string
    chipBorder: string
    chipText: string
    softBg: string
    border: string
    text: string
    dot: string
    label: string
  }
> = {
  kept: {
    strip: 'bg-jordy/55',
    chipBg: 'bg-jordy/35',
    chipBorder: 'border-jordy/40',
    chipText: 'text-midnight',
    softBg: 'bg-jordy/15',
    border: 'border-jordy/40',
    text: 'text-midnight',
    dot: 'bg-jordy',
    label: 'Keeping',
  },
  dropping: {
    strip: 'bg-robroy/65',
    chipBg: 'bg-robroy/45',
    chipBorder: 'border-robroy-deep/40',
    chipText: 'text-midnight',
    softBg: 'bg-robroy/20',
    border: 'border-robroy-deep/40',
    text: 'text-robroy-deep',
    dot: 'bg-robroy-deep',
    label: 'Dropping',
  },
  adding: {
    strip: 'bg-midnight/30',
    chipBg: 'bg-midnight/18',
    chipBorder: 'border-midnight/30',
    chipText: 'text-midnight',
    softBg: 'bg-midnight/10',
    border: 'border-midnight/30',
    text: 'text-midnight',
    dot: 'bg-midnight',
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
  continuous: Tag[]
  am: Tag[]
  pm: Tag[]
}

interface Props {
  rows: CalendarRow[]
}

function abbreviate(name: string): string {
  const ignore = new Set(['the', 'and', 'of', 'in', 'on', 'a', 'to', 'for', '&'])
  const cleaned = name
    .replace(/\(.*?\)/g, '')
    .replace(/[:,]/g, ' ')
  const parts = cleaned
    .split(/\s+/)
    .filter((p) => p && !ignore.has(p.toLowerCase()))
  const letters = parts.map((p) => p[0]?.toUpperCase() ?? '').filter(Boolean)
  return letters.slice(0, 3).join('') || name.slice(0, 3).toUpperCase()
}

export function CalendarClient({ rows }: Props) {
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
    const ensure = (d: string) => {
      if (!m.has(d)) m.set(d, { continuous: [], am: [], pm: [] })
      return m.get(d)!
    }
    for (const r of gridRows) {
      const slot = r.slot ?? 'special'
      const code = codeByCourse.get(r.id) ?? ''
      for (const d of r.session_dates) {
        const b = ensure(d)
        const tag: Tag = { rowId: r.id, name: r.name, code, status: r.status }
        if (slot === 'AM' || slot === 'AM+PM' || slot === 'special') b.am.push(tag)
        if (slot === 'PM' || slot === 'AM+PM' || slot === 'fri-pm' || slot === 'special')
          b.pm.push(tag)
      }
    }
    for (const r of otherRows) {
      if (!r.start_date || !r.end_date) continue
      const code = codeByCourse.get(r.id) ?? ''
      const tag: Tag = { rowId: r.id, name: r.name, code, status: r.status }
      const start = new Date(`${r.start_date}T00:00:00Z`)
      const end = new Date(`${r.end_date}T00:00:00Z`)
      for (
        const cursor = new Date(start);
        cursor <= end;
        cursor.setUTCDate(cursor.getUTCDate() + 1)
      ) {
        const wd = cursor.getUTCDay() || 7
        if (wd < 1 || wd > 5) continue
        const iso = cursor.toISOString().slice(0, 10)
        ensure(iso).continuous.push(tag)
      }
    }
    return m
  }, [gridRows, otherRows, codeByCourse])

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
      <div className="rounded-2xl border border-midnight/15 bg-jordy/10 p-6 text-center text-sm text-ink">
        <p className="font-serif text-xl text-midnight">
          Nothing on your calendar yet.
        </p>
        <p className="mt-1.5">
          Mark your assigned electives in{' '}
          <a
            href="/profile"
            className="text-midnight underline decoration-midnight/40 underline-offset-2 hover:decoration-midnight"
          >
            your profile
          </a>{' '}
          to see them here.
        </p>
      </div>
    )
  }

  const ectsKept = sumEcts(rows, 'kept')
  const ectsDropping = sumEcts(rows, 'dropping')
  const ectsAdding = sumEcts(rows, 'adding')
  const ectsNow = ectsKept + ectsDropping
  const ectsAfter = ectsKept + ectsAdding
  const ectsDelta = ectsAfter - ectsNow

  return (
    <div className="flex flex-col gap-5">
      <CreditsCounter
        now={ectsNow}
        after={ectsAfter}
        delta={ectsDelta}
        droppingEcts={ectsDropping}
        addingEcts={ectsAdding}
      />

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

      <p className="text-center text-[11px] text-ink/60">
        Tap any day for full details.
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

  const allInMonth = [...monthRows, ...continuousRows]
  const groups = {
    kept: allInMonth.filter((r) => r.status === 'kept'),
    dropping: allInMonth.filter((r) => r.status === 'dropping'),
    adding: allInMonth.filter((r) => r.status === 'adding'),
  }
  const continuousIds = new Set(continuousRows.map((r) => r.id))
  const hasAny = allInMonth.length > 0

  const selectedBuckets =
    selectedDay && selectedDay.startsWith(`${month.year}-${String(month.monthIdx + 1).padStart(2, '0')}`)
      ? byDate.get(selectedDay) ?? null
      : null

  return (
    <section className="flex flex-col gap-2.5">
      <header className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-2xl font-bold tracking-tight text-midnight sm:text-3xl">
            {month.name} {month.year}
          </h2>
          {!hasAny && <span className="text-[11px] text-ink/40">no sessions</span>}
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

      <div className="overflow-hidden rounded-xl border border-midnight/15 bg-white">
        <div className="grid grid-cols-5 border-b border-midnight/15 bg-jordy/8">
          {WEEKDAY_LABELS.map((w) => (
            <div
              key={w}
              className="px-1 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-midnight sm:text-xs"
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
  // Render as a true paragraph: the dot+label is inline with the course list,
  // so wrapping flows continuously instead of jumping to a new column.
  return (
    <p className="text-[11px] leading-relaxed text-ink sm:text-xs">
      <span className={`mr-1 inline-block h-1.5 w-1.5 translate-y-[-1px] rounded-full align-middle ${style.dot}`} />
      <span className={`font-semibold ${style.text}`}>{style.label}:</span>{' '}
      {rows.map((r, i) => (
        <span key={r.id}>
          {i > 0 ? ', ' : ''}
          <span className={style.text}>{r.name}</span>
          {continuousIds.has(r.id) && (
            <span className="text-ink/40"> (continuous)</span>
          )}
        </span>
      ))}
    </p>
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
    return (
      <div className="h-[104px] border-l border-t border-midnight/10 bg-jordy/[0.04] first:border-l-0" />
    )
  }

  const continuous = buckets?.continuous ?? []
  const am = buckets?.am ?? []
  const pm = buckets?.pm ?? []
  const isClickable = continuous.length > 0 || am.length > 0 || pm.length > 0

  // Selected state floats above the grid as a rounded chip — softer than a square inset ring.
  const selectedRing = isSelected
    ? 'rounded-lg ring-2 ring-midnight ring-offset-0 z-10 bg-jordy/10'
    : ''

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!isClickable}
      className={`group relative flex h-[104px] flex-col border-l border-t border-midnight/10 text-left transition first:border-l-0 ${selectedRing} ${
        isClickable ? 'cursor-pointer hover:bg-jordy/10' : 'cursor-default'
      }`}
    >
      <span className="px-1.5 pt-1 text-xs font-semibold text-midnight sm:text-[13px]">
        {cell.day}
      </span>
      <ContinuousZone tags={continuous} />
      <SlotZone label="AM" tags={am} />
      <div className="h-px bg-midnight/10" />
      <SlotZone label="PM" tags={pm} />
    </button>
  )
}

function ContinuousZone({ tags }: { tags: Tag[] }) {
  if (tags.length === 0) {
    return <div className="h-2 sm:h-2.5" />
  }
  return (
    <div className="flex h-2 px-1 sm:h-2.5">
      {tags.map((t, i) => {
        const s = STATUS_STYLE[t.status]
        return (
          <div
            key={`${t.rowId}-${i}`}
            className={`flex-1 rounded-sm ${s.strip} ${i > 0 ? 'ml-0.5' : ''}`}
            title={t.name}
          />
        )
      })}
    </div>
  )
}

function SlotZone({ label, tags }: { label: 'AM' | 'PM'; tags: Tag[] }) {
  const isEmpty = tags.length === 0
  return (
    <div className="relative flex flex-1 items-stretch">
      <span
        className={`pointer-events-none absolute left-1 top-0 text-[9px] font-semibold uppercase tracking-wider sm:text-[10px] ${
          isEmpty ? 'text-midnight/30' : 'text-midnight/70'
        }`}
      >
        {label}
      </span>
      {!isEmpty && (
        <div className="flex flex-1 items-stretch gap-0.5 px-1.5 pl-5 py-1">
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
      className={`flex flex-1 items-center justify-center overflow-hidden rounded-md border px-1 text-[9px] font-semibold leading-tight sm:text-[10px] ${s.chipBg} ${s.chipBorder} ${s.chipText}`}
    >
      {tag.code}
    </span>
  )
}

function ChipSplit({ tag, count }: { tag: Tag; count: number }) {
  const s = STATUS_STYLE[tag.status]
  return (
    <span
      className={`flex flex-1 items-center justify-center overflow-hidden rounded-sm text-[8px] font-bold leading-none ${s.chipBg} ${s.chipText} ${count >= 3 ? 'min-w-0' : ''}`}
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
    <div className="rounded-xl border border-midnight/20 bg-white p-3 shadow-sm">
      <header className="mb-2 flex items-baseline justify-between">
        <h4 className="text-base font-semibold tracking-tight text-midnight">
          {formatLongDate(iso)}
        </h4>
        <button
          type="button"
          onClick={onClose}
          className="text-[11px] text-ink/60 underline decoration-midnight/30 underline-offset-2 hover:text-midnight"
        >
          close
        </button>
      </header>
      <div className="flex flex-col gap-2">
        {buckets.continuous.length > 0 && (
          <SlotDetailRow label="All day (continuous)" tags={buckets.continuous} />
        )}
        <SlotDetailRow label="Morning (AM)" tags={buckets.am} />
        <SlotDetailRow label="Afternoon (PM)" tags={buckets.pm} />
      </div>
    </div>
  )
}

function SlotDetailRow({ label, tags }: { label: string; tags: Tag[] }) {
  return (
    <div className="flex flex-col gap-1 text-xs">
      <span className="text-[11px] font-medium uppercase tracking-wider text-ink/60">
        {label}
      </span>
      {tags.length === 0 ? (
        <span className="text-ink/40">free</span>
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
              ⚠ Clash: {tags.length} courses in this slot
            </li>
          )}
        </ul>
      )}
    </div>
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

function sumEcts(rows: CalendarRow[], status: CalendarStatus): number {
  return rows.filter((r) => r.status === status).reduce((s, r) => s + r.ects, 0)
}

function fmtEcts(n: number): string {
  return Number.isInteger(n) ? n.toString() : n.toFixed(1).replace(/\.0$/, '')
}

function CreditsCounter({
  now,
  after,
  delta,
  droppingEcts,
  addingEcts,
}: {
  now: number
  after: number
  delta: number
  droppingEcts: number
  addingEcts: number
}) {
  const hasChanges = droppingEcts > 0 || addingEcts > 0
  const deltaSign = delta > 0 ? '+' : delta < 0 ? '−' : ''
  const deltaColor =
    delta > 0
      ? 'text-midnight'
      : delta < 0
        ? 'text-robroy-deep'
        : 'text-ink/60'

  return (
    <section className="rounded-xl border border-midnight/15 bg-white p-4">
      <div className="flex items-end gap-3">
        <Metric label="Now" value={fmtEcts(now)} />
        {hasChanges && (
          <>
            <span className="pb-2 text-midnight/30">→</span>
            <Metric
              label="After changes"
              value={fmtEcts(after)}
              delta={
                delta === 0
                  ? null
                  : `${deltaSign}${fmtEcts(Math.abs(delta))}`
              }
              deltaColor={deltaColor}
            />
          </>
        )}
      </div>
    </section>
  )
}

function Metric({
  label,
  value,
  delta,
  deltaColor,
}: {
  label: string
  value: string
  delta?: string | null
  deltaColor?: string
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-medium uppercase tracking-wider text-ink/60">
        {label}
      </span>
      <span className="text-3xl font-semibold leading-none tracking-tight text-midnight">
        {value}
        {delta && (
          <span className={`ml-1.5 align-top text-sm font-semibold ${deltaColor ?? ''}`}>
            {delta}
          </span>
        )}{' '}
        <span className="text-xs font-medium text-ink/60">ECTS</span>
      </span>
    </div>
  )
}
