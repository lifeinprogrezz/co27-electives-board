#!/usr/bin/env node
// Applies supabase/migrations/*.sql in order, then optionally supabase/seed.sql.
// Connection string is read from POSTGRES_URL_NON_POOLING (preferred), POSTGRES_URL,
// or DATABASE_URL. Run with:  node --env-file=.env.local scripts/apply-db.mjs [--seed]

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import pg from 'pg'

const url =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL

if (!url) {
  console.error(
    'Missing connection string. Set POSTGRES_URL_NON_POOLING in .env.local.',
  )
  process.exit(1)
}

const includeSeed = process.argv.includes('--seed')
const onlyIdx = process.argv.indexOf('--only')
const onlyFile = onlyIdx >= 0 ? process.argv[onlyIdx + 1] : null

// Strip sslmode from the connection string so we can pass ssl options
// explicitly — Supabase ships a self-signed cert chain.
const parsed = new URL(url)
parsed.searchParams.delete('sslmode')
const isLocal = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'

const client = new pg.Client({
  connectionString: parsed.toString(),
  ssl: isLocal ? false : { rejectUnauthorized: false },
})

await client.connect()

try {
  const migrationsDir = 'supabase/migrations'
  const files = onlyFile
    ? [onlyFile]
    : readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.sql'))
        .sort()

  for (const f of files) {
    const sql = readFileSync(join(migrationsDir, f), 'utf8')
    process.stdout.write(`Applying ${f}… `)
    await client.query(sql)
    console.log('ok')
  }

  if (includeSeed) {
    const seedPath = 'supabase/seed.sql'
    const seed = readFileSync(seedPath, 'utf8')
    process.stdout.write(`Seeding (${seedPath})… `)
    await client.query(seed)
    console.log('ok')
  }
} finally {
  await client.end()
}

console.log('Done.')
