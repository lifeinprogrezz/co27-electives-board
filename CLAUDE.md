@AGENTS.md

# Co27 Electives Trading Board — Claude Code project notes

> See `SPEC.md` for the full build spec. This file captures conventions and gotchas only.

## Ship constraints
- **Launch: Sun May 17, 2026 evening.** Add/Drop opens Tue May 19.
- Cut anything that risks the Sunday ship.
- Mobile-first; primary viewport ~380px.

## Stack
- **Next.js 16.2.6 App Router** + React 19 + TypeScript + Tailwind 4 (no Pages Router)
- **@supabase/ssr** for SSR-aware auth + RLS-aware queries
- Magic-link auth restricted to `@esade.edu`
- Deploy: Vercel

## Next.js 16 gotchas (post-training-cutoff API changes)
- `middleware.ts` is now **`proxy.ts`** — same Node.js runtime, same matcher config, but rename.
- `cookies()` from `next/headers` is **async** — always `await cookies()`.
- `headers()` is also async.
- For instant client-side nav on dynamic pages, export `unstable_instant` from the route.
- Cache Components are opt-in; we are NOT using them for v0 (board is auth-gated + per-request).

## Supabase patterns we use
- `src/lib/supabase/server.ts` — `createClient()` for Server Components / Server Actions / Route Handlers (reads `cookies()`)
- `src/lib/supabase/client.ts` — `createBrowserClient` for Client Components
- `src/lib/supabase/proxy.ts` — `updateSession(req)` called from root `proxy.ts` to refresh JWT cookies on every request
- `src/app/auth/callback/route.ts` — exchanges magic-link `?code` for a session

## Auth + authorization conventions
- Server Actions and protected pages call `getUser()` (not `getSession()`) — `getUser()` validates the JWT with Supabase, `getSession()` only reads the cookie.
- DB enforces the truth via RLS. Server Actions are a convenience layer, not a security boundary.
- `@esade.edu` domain check happens in TWO places: server action before `signInWithOtp` (UX), and DB CHECK constraint (truth).

## Directory layout
```
src/
  app/                 # routes (App Router)
    auth/callback/     # magic-link handler (Route Handler)
    profile/           # auth-gated
    board/             # auth-gated
  lib/
    supabase/          # server.ts, client.ts, proxy.ts
    auth.ts            # signIn, signOut, getCurrentUser actions
    profile.ts         # saveProfile server action
  components/          # presentational + form pieces
supabase/
  migrations/          # SQL migrations (0001_init.sql, …)
  seed.sql             # course catalog
```

## Do
- Use Server Components by default. Drop to `'use client'` only for interactive bits.
- Validate forms server-side with Zod in the Server Action.
- Lower-case all emails before storing/comparing.
- WhatsApp links: `https://wa.me/<digits>` — strip `+` and non-digits.
- Keep RLS strict: never assume a server action's "trust me" — let Postgres reject it.

## Don't
- Don't add tests for v0 — ship first, regression-test later.
- Don't write a matching algorithm — explicitly out of scope.
- Don't add notifications, chat, or admin pages.
- Don't import `cookies()` synchronously — it's async in Next 16.
- Don't put secrets in `NEXT_PUBLIC_*` env vars.

## Environment
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `NEXT_PUBLIC_SITE_URL` (e.g. `https://co27electives.lifeinprogrezz.com`) — used for magic-link redirect

Node 20.17 raises an EBADENGINE warning on one dev dep that wants >=20.19. Non-blocking for now.
