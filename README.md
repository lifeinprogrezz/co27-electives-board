# Co27 Electives Trading Board

Peer-built tool for Co27 ESADE MBA students to coordinate elective trades during
Add/Drop. See [`SPEC.md`](./SPEC.md) for the full build spec.

> Built by Rober Quintero, Co27. Not affiliated with ESADE.

## Stack

- Next.js 16 App Router (TypeScript, Tailwind 4)
- Supabase (Auth, Postgres, RLS)
- Vercel (hosting)

## First-time setup

### 1. Create a Supabase project

1. Go to <https://supabase.com> → New project → name it `co27-electives-board`.
2. From **Settings → API**, copy the **Project URL**, **anon public** key, and the
   **service_role** key.

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Fill in:

- `NEXT_PUBLIC_SUPABASE_URL` — Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon public key
- `SUPABASE_SERVICE_ROLE_KEY` — service_role key (server-only, used for seeding)
- `NEXT_PUBLIC_SITE_URL` — `http://localhost:3000` for dev

### 3. Run the schema + seed

Open the Supabase SQL editor (**SQL → New query**) and run, in order:

1. The contents of `supabase/migrations/0001_init.sql`
2. The contents of `supabase/seed.sql`

This creates the `users`, `courses`, `listings` tables, enables RLS, installs the
signup trigger, and seeds the elective catalog.

### 4. Configure Supabase Auth

In **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3000` (add the production URL once you deploy)
- **Redirect URLs**: include `http://localhost:3000/auth/callback` and any
  production callback (e.g. `https://co27electives.lifeinprogrezz.com/auth/callback`).

In **Authentication → Providers → Email**, ensure **Enable Email provider** is on
and **Confirm email** is on (magic-link mode).

### 5. Install + run

```bash
npm install
npm run dev
```

Open <http://localhost:3000>, sign in with an `@esade.edu` email, click the link
in your inbox.

## Deploying to Vercel

1. Import the repo on Vercel (`vercel.com/new`).
2. Add the same four env vars under **Settings → Environment Variables**.
3. Update Supabase **Site URL** and **Redirect URLs** with the production domain.
4. Deploy.

## Project layout

```
proxy.ts                      # Next 16 proxy — was middleware.ts
src/
  app/                        # routes
    auth/callback/route.ts    # magic-link handler
    profile/                  # onboarding + edit (auth-gated)
    board/                    # public board (auth-gated)
    login/                    # magic-link form
  components/                 # client components
  lib/
    supabase/{server,client,proxy}.ts
    auth.ts                   # signIn / signOut server actions
    profile.ts                # saveProfile server action
    dal.ts                    # requireUser / getCurrentProfile
    types.ts
supabase/
  migrations/0001_init.sql    # schema + RLS + triggers
  seed.sql                    # course catalog
```

## Scripts

- `npm run dev` — local dev server (Turbopack)
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — ESLint
