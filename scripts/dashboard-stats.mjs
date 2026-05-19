import { readFileSync } from 'node:fs';

// load .env.local manually since dotenv defaults to .env
const envText = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const h = { apikey: KEY, Authorization: 'Bearer ' + KEY };

// T+0 = Sat 2026-05-16 18:18 Madrid (CEST, UTC+2) = 16:18 UTC
const T0 = new Date('2026-05-16T16:18:00Z');
const dayBound = (n) => new Date(T0.getTime() + n * 24 * 3600 * 1000).toISOString();

const headCount = async (path) => {
  const r = await fetch(URL_ + '/rest/v1/' + path, {
    method: 'HEAD',
    headers: { ...h, Prefer: 'count=exact', Range: '0-0' },
  });
  const cr = r.headers.get('content-range');
  return cr ? parseInt(cr.split('/')[1], 10) : null;
};

// auth.users — full list via admin API (paginated, but cohort < 1000 so one page)
const au = await fetch(URL_ + '/auth/v1/admin/users?per_page=1000', { headers: h }).then((r) => r.json());
const signedIn = au.users.length;
const signupTimes = au.users.map((u) => new Date(u.created_at).getTime()).sort((a, b) => a - b);

// onboarded = users.name not null
const onboarded = await headCount('users?select=id&name=not.is.null');

// posted = distinct user_id in listings; fetch user_ids and dedup
const listingsRows = await fetch(URL_ + '/rest/v1/listings?select=user_id,type,status,created_at', { headers: h }).then((r) => r.json());
const totalListings = listingsRows.length;
const activeListings = listingsRows.filter((l) => l.status === 'active');
const wantAddActive = activeListings.filter((l) => l.type === 'want_add').length;
const haveDropActive = activeListings.filter((l) => l.type === 'have_want_drop').length;
const distinctPosters = new Set(listingsRows.map((l) => l.user_id)).size;

// per-day buckets (launch-relative 24h windows)
const buckets = [
  { label: 'Day 1', from: dayBound(0), to: dayBound(1), signups: 0, listings: 0 },
  { label: 'Day 2', from: dayBound(1), to: dayBound(2), signups: 0, listings: 0 },
  { label: 'Day 3', from: dayBound(2), to: dayBound(3), signups: 0, listings: 0 },
];

for (const t of signupTimes) {
  for (const b of buckets) {
    if (t >= +new Date(b.from) && t < +new Date(b.to)) { b.signups++; break; }
  }
}
for (const l of listingsRows) {
  const t = +new Date(l.created_at);
  for (const b of buckets) {
    if (t >= +new Date(b.from) && t < +new Date(b.to)) { b.listings++; break; }
  }
}

const out = {
  asOf: new Date().toISOString(),
  signedIn,
  onboarded,
  posted: distinctPosters,
  totalListings,
  activeListings: activeListings.length,
  wantAddActive,
  haveDropActive,
  buckets,
};
console.log(JSON.stringify(out, null, 2));
