#!/usr/bin/env node
// Parses public.courses.schedule_text → fills start_date, end_date, session_dates.
// Designed for Co27 academic year 2026 (Summer + September + Term 4).
//
// Run:  node --env-file=.env.local scripts/parse-schedule.mjs

import pg from 'pg'

const url =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL
if (!url) {
  console.error('Missing POSTGRES_URL_NON_POOLING.')
  process.exit(1)
}

const parsed = new URL(url)
parsed.searchParams.delete('sslmode')
const client = new pg.Client({
  connectionString: parsed.toString(),
  ssl: { rejectUnauthorized: false },
})

const MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
}

const TERM_YEAR = {
  // Co27 academic year — terms 4 and earlier in 2026, term 5 spills into 2027.
  summer: 2026,
  september: 2026,
  term4: 2026,
  term5: 2027,
}

/**
 * Parse a schedule_text + term into { start, end, sessions[] }.
 * Returns ISO date strings (YYYY-MM-DD).
 */
function parseSchedule(scheduleText, term) {
  const year = TERM_YEAR[term] ?? 2026
  if (!scheduleText) return { start: null, end: null, sessions: [] }

  const text = scheduleText.toLowerCase()

  // Special case: "mid-jun to mid-oct" / similar coarse phrases.
  const midMatch = text.match(/mid-(\w{3})\s+to\s+mid-(\w{3})/)
  if (midMatch) {
    const m1 = MONTHS[midMatch[1].slice(0, 3)]
    const m2 = MONTHS[midMatch[2].slice(0, 3)]
    if (m1 != null && m2 != null) {
      return {
        start: iso(year, m1, 15),
        end: iso(year, m2, 15),
        sessions: [],
      }
    }
  }

  // Strip prefixes/suffixes that don't carry dates.
  // "Fri PM: Jun 19 + Jul 3, 10, 17"  → "Jun 19 + Jul 3, 10, 17"
  // "Online async, Jun 25 - Jul 25"   → "Jun 25 - Jul 25"
  // "Oct 1 - Dec 12, online self-paced" → "Oct 1 - Dec 12"
  let body = text
    .replace(/^fri pm:\s*/i, '')
    .replace(/^online async,?\s*/i, '')
    .replace(/,\s*online[^.]*$/i, '')
    .replace(/\(skip\s+\w+\)/g, '') // "(skip Wed)" — we treat as range anyway
    .replace(/\s+am\+pm\b/g, '')
    .replace(/\s+am\b/g, '')
    .replace(/\s+pm\b/g, '')
    .trim()

  // Split on "+" to handle "Jul 6-9 + Jul 13-16" or "Jun 19 + Jul 3, 10, 17".
  const chunks = body.split(/\s*\+\s*/)
  const sessions = new Set()
  let firstStart = null
  let lastEnd = null

  for (const raw of chunks) {
    const chunk = raw.trim()
    if (!chunk) continue
    const parsed = parseChunk(chunk, year)
    if (!parsed) continue
    parsed.sessions.forEach((s) => sessions.add(s))
    if (!firstStart || parsed.start < firstStart) firstStart = parsed.start
    if (!lastEnd || parsed.end > lastEnd) lastEnd = parsed.end
  }

  if (!firstStart) return { start: null, end: null, sessions: [] }
  return {
    start: firstStart,
    end: lastEnd,
    sessions: [...sessions].sort(),
  }
}

/**
 * Parse a single chunk like "Jun 15-18", "Jun 29 - Jul 2", "Jul 3, 10, 17",
 * "Sep 21-22", "Sep 7-10", "Jul 6, 7, 9, 10". The month from the *left* of the
 * chunk is carried forward if the right side has no month.
 */
function parseChunk(chunk, year) {
  // Detect a range first ("Jun 29 - Jul 2", "Jun 15-18").
  const rangeMatch = chunk.match(
    /^(\w{3,9})\s+(\d{1,2})\s*[-–]\s*(?:(\w{3,9})\s+)?(\d{1,2})$/,
  )
  if (rangeMatch) {
    const m1 = MONTHS[rangeMatch[1].slice(0, 3)]
    const d1 = Number(rangeMatch[2])
    const m2 = rangeMatch[3] ? MONTHS[rangeMatch[3].slice(0, 3)] : m1
    const d2 = Number(rangeMatch[4])
    if (m1 == null || m2 == null) return null
    const start = new Date(Date.UTC(year, m1, d1))
    const end = new Date(Date.UTC(year, m2, d2))
    const sessions = []
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      sessions.push(d.toISOString().slice(0, 10))
    }
    return { start: iso(year, m1, d1), end: iso(year, m2, d2), sessions }
  }

  // Single date or comma list ("Jul 6, 7, 9, 10" or "Sep 22" or "Jul 9, Jul 10").
  // Find anchor month at the start.
  const anchor = chunk.match(/^(\w{3,9})\s+(.+)$/)
  if (!anchor) return null
  const anchorMonth = MONTHS[anchor[1].slice(0, 3)]
  if (anchorMonth == null) return null
  const tail = anchor[2]

  const sessions = []
  let currentMonth = anchorMonth
  // Split tail by commas → tokens like "6", "7", "9", "10" OR "Jul 10".
  for (const part of tail.split(/\s*,\s*/)) {
    const token = part.trim()
    if (!token) continue
    const withMonth = token.match(/^(\w{3,9})\s+(\d{1,2})$/)
    if (withMonth) {
      const mm = MONTHS[withMonth[1].slice(0, 3)]
      if (mm != null) {
        currentMonth = mm
        sessions.push(iso(year, mm, Number(withMonth[2])))
        continue
      }
    }
    const justDay = token.match(/^(\d{1,2})$/)
    if (justDay) {
      sessions.push(iso(year, currentMonth, Number(justDay[1])))
    }
  }
  if (sessions.length === 0) return null
  sessions.sort()
  return { start: sessions[0], end: sessions[sessions.length - 1], sessions }
}

function iso(year, monthIdx, day) {
  const d = new Date(Date.UTC(year, monthIdx, day))
  return d.toISOString().slice(0, 10)
}

await client.connect()
try {
  const { rows } = await client.query(
    `select id, name, term, schedule_text from public.courses order by term, schedule_text`,
  )

  const review = []
  for (const r of rows) {
    const parsed = parseSchedule(r.schedule_text, r.term)
    review.push({
      name: r.name,
      term: r.term,
      schedule_text: r.schedule_text,
      start: parsed.start ?? '(none)',
      end: parsed.end ?? '(none)',
      sessions: parsed.sessions.length,
    })
    if (parsed.start && parsed.end) {
      await client.query(
        `update public.courses
           set start_date = $1::date,
               end_date   = $2::date,
               session_dates = $3::date[]
         where id = $4`,
        [parsed.start, parsed.end, parsed.sessions, r.id],
      )
    }
  }

  console.log('\nReview — confirm each course\'s parsed range:\n')
  console.table(review)
  console.log(`\nUpdated ${review.filter((r) => r.start !== '(none)').length}/${review.length} courses.`)
} finally {
  await client.end()
}
