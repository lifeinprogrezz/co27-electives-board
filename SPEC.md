# Co27 Electives Trading Board — Build Spec

> **Built by**: Rober Quintero (ESADE Co27 MBA)
> **For**: ~170 Co27 MBA students across 3 sections of ~55
> **Target ship date**: Sun May 17, 2026 (launch in cohort WhatsApp Sun evening)
> **Critical milestone**: Add/Drop bidding opens **Tuesday May 19, 2026** — product must be live with some liquidity before then.

---

## 1. The problem

ESADE MBA students bid for 8-9 summer electives in Round 1. Many end up under-allocated — for example, only 4 of 9 ranked electives assigned, leaving 12 of 24 required ECTS unfilled (with CBI silently assumed to cover the gap). Students opting out of CBI (because they're pursuing full-time job offers starting in July/August) have to recover those credits during the Add/Drop round.

Add/Drop is essentially a refresh-and-hope game: students sit on eOffice waiting for someone to drop a course they want. There's **no visibility** into:

- Who wants to drop what
- Who wants to add what
- Whether any trade is possible

The cohort is already trading manually via WhatsApp DMs. The DM that triggered this build: a classmate posting "Anyone planning to drop any of these electives? Global Risks, Growth Strategies, Action Learning. DM me."

**This product centralizes that signal. Nothing more.**

---

## 2. Principles (don't violate these)

1. **Boring beats clever.** Cohort needs to trust it in 5 seconds. Look like a tool, not a startup.
2. **Liquidity > features.** A board with 30 listings and zero features beats a slick product with zero listings.
3. **Transparent.** Built by a named student. Open about what data is stored. Not affiliated with ESADE.
4. **Ship Sunday.** Anything that pushes launch past Sun May 17 evening gets cut.
5. **Mobile-first.** Most users will tap a WhatsApp link → mobile browser. Test mobile before desktop.

---

## 3. MVP scope

### IN scope (build this)

1. **Magic-link auth** restricted to `@esade.edu` emails (Supabase auth, server-side email domain check)
2. **Onboarding form** (single page):
   - Name (pre-filled from email username, editable)
   - WhatsApp number (international format, optional)
   - Cohort section (1, 2, or 3)
   - Current courses (multiselect from catalog)
   - Courses I want to drop (multiselect, must be subset of "current")
   - Courses I want to add (multiselect)
3. **Public board** (auth-gated):
   - Grouped by course (one block per course)
   - Two sub-lists per course: "Has & wants to drop" / "Wants to add"
   - Each entry shows name + click-to-reveal contact (WhatsApp link `wa.me/[number]`, fallback to email)
   - Simple text search / filter by course
4. **Edit profile** any time

### OUT of scope (don't build — explicitly v2 or later)

- Matching algorithm / auto-match
- Email / push notifications
- In-app chat
- Course capacity data integration with ESADE
- Trade confirmation / "mark as completed" flow
- User analytics / dashboard
- Admin panel
- Native mobile app (responsive web only)
- Payments / monetization
- Rating / reputation system

### Visual / UX guidance

- Clean, functional, ESADE-aware (red accent acceptable but optional)
- Mobile responsive — assume primary viewport ~380px wide
- Trust footer on every page: *"Built by Rober Quintero, Co27. Not affiliated with ESADE."*
- Privacy note on landing + `/privacy` page
- No marketing fluff. No hero animations. No testimonials. Just the tool.

---

## 4. Tech stack

| Layer | Tool | Notes |
|---|---|---|
| Frontend | Next.js 16 App Router + TypeScript | Tailwind 4, React 19 |
| Auth + DB | Supabase | Magic link auth + Postgres + RLS |
| Deploy | Vercel | Free tier sufficient |
| Domain | Subdomain of `lifeinprogrezz.com` or new IONOS purchase | Choose during deploy |
| Analytics | Vercel Analytics | Page views, no PII |

---

## 5. Data model

### `users`
| Field | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | From Supabase auth |
| `email` | text (unique, NOT NULL) | Must end in `@esade.edu` |
| `name` | text | Display name |
| `whatsapp_number` | text (nullable) | International format e.g. `+34666123456` |
| `cohort_section` | smallint (1, 2, or 3) | |
| `created_at` | timestamptz | Default now() |
| `updated_at` | timestamptz | |

### `courses` (seed data — see Section 8)
| Field | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `class_code` | text | e.g. `4099` |
| `name` | text | |
| `ects` | numeric | `1.5` or `3` |
| `professor` | text | |
| `term` | enum (`summer`, `september`, `term4`) | |
| `schedule_text` | text | Human-readable e.g. `Jun 15-18 AM+PM` |
| `slot` | enum (`AM`, `PM`, `AM+PM`, `online`, `fri-pm`, `special`) | For conflict detection later |
| `notes` | text (nullable) | Special structure, async info, etc. |

### `listings`
| Field | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid (FK → users) | |
| `course_id` | uuid (FK → courses) | |
| `type` | enum (`have_want_drop`, `want_add`) | |
| `status` | enum (`active`, `closed`) | Default `active` |
| `created_at` | timestamptz | |

**Index**: `(course_id, type, status)` for board queries.

### Supabase RLS (Row-Level Security)
- `users`: SELECT for all authenticated, INSERT/UPDATE/DELETE only own row
- `listings`: SELECT for all authenticated, INSERT/UPDATE/DELETE only where `user_id = auth.uid()`
- `courses`: SELECT for all (even unauthenticated — for landing page preview)

---

## 6. Pages

```
/                       Landing — explainer + sign-in CTA (public)
/login                  Magic link form (public)
/auth/callback          Magic link handler (technical)
/profile                Onboarding / edit profile (auth required)
/board                  Public board (auth required)
/about                  Who built this + why (public)
/privacy                Data handling notes (public)
```

---

## 7. User flow

1. User taps WhatsApp link → lands on `/`
2. Reads 30-second explainer: "Trade Co27 electives with your cohort. No more refreshing eOffice."
3. Clicks "Sign in with ESADE email"
4. Enters `name@esade.edu` → receives magic link → clicks → authenticated
5. **First-time**: redirected to `/profile` → fills form → submits
6. Redirected to `/board`
7. Browses board, finds a relevant entry
8. Taps the person's name → reveals WhatsApp link
9. Opens WhatsApp, coordinates the trade
10. (Later) returns to mark listing as `closed` (manual, optional)

---

## 8. Course catalog (seed data)

Class codes marked `???` need to be filled in by Rober from the ESADE official elective catalog PDF.

### Summer Term — June-July 2026, Barcelona, in-person unless noted

| Class | Name | ECTS | Professor | Schedule | Slot |
|---|---|---|---|---|---|
| 4099 | Advanced Communication Skills (June) | 3 | Lola Martínez | Jun 15-18 AM+PM | AM+PM |
| ??? | Berlin Study Tour | 3 | — | Jun 15-19 | AM+PM |
| ??? | International Tax Planning | 1.5 | — | Jun 15-18 AM | AM |
| ??? | Transforming Corporate Operations | 1.5 | — | Jun 15-18 PM | PM |
| 11127 | Social Entrepreneurship & Impact Economy | 3 | Hehenberger | Jun 22-26 AM+PM (skip Wed) | AM+PM |
| 4185 | Re-Imagining Capitalism | 3 | — | Jun 22-26 AM+PM | AM+PM |
| 4194 | Venture Capital & Entrepreneurial Finance | 3 | Corrales | Jun 29 - Jul 2 AM+PM | AM+PM |
| 4211 | Transforming the Family Business | 1.5 | — | Jun 29 - Jul 2 AM | AM |
| 11124 | AI in our Lives: Behavioral Science of AI | 1.5 | Valenzuela | Jun 29 - Jul 2 PM | PM |
| 11146 | AI, Entrepreneurship & Innovation | 1.5 | Marc Cortés | Jul 6, 7, 9, 10 AM | AM |
| ??? | Operations, Innovation & Data Science | 1.5 | — | Jul 6-9 AM | AM |
| 4208 | Entrepreneurial & Innovative Growth Strategies | 1.5 | Francesco Di Lorenzo | Jul 6-9 PM | PM |
| 4195 | Advanced Corporate Finance | 3 | — | Jul 6-9 + Jul 13-16 AM | AM |
| ??? | International Portfolio Management | 3 | — | Jul 6-9 + Jul 13-16 PM | PM |
| 4212 | Global Risks in the 21st Century | 3 | Ángel Pascual Ramsay | Jul 13-16 AM+PM | AM+PM |
| 11144 | Action Learning Consultancy Project | 3 | Juan Carlos García | Fri PM: Jul 3, 10, 17 | fri-pm |
| 4213 | Modern Spain and Catalunya | 1.5 | Alex Fernández de Castro | Fri PM: Jun 19 + Jul 3, 10, 17 (online with synchronous groups) | fri-pm |
| 11145 | Introduction to Python | 1.5 | Esteve Almirall | Online async, Jun 25 - Jul 25 | online |
| ??? | The Startup Experience / Start-Up Program | 3 | Jan Brinckmann + Davide Rovera | Mid-Jun to mid-Oct (10-20h/wk, special structure) | special |

### September (Term 4 Intensive)

| Class | Name | ECTS | Professor | Schedule | Slot |
|---|---|---|---|---|---|
| 5456 | Impact Investing in Action | 3 | Casasnovas + Hehenberger | Sep 14-18 AM+PM | AM+PM |
| ??? | Brand-Driven Strategy Management | 3 | Iglesias | Sep 7-10 + Sep 14-17 AM | AM |
| ??? | Hypergrowth in StartUps | 1.5 | Davide Rovera | Sep 21-22 AM+PM | AM+PM |
| ??? | Advanced Communication Skills (Sept) | 1.5 | Lola Martínez | Sep 7-10 AM | AM |
| ??? | Building Scenarios | 1.5 | — | Sep 21-22 | special |

### Term 4 (October-December 2026, mostly online)

| Class | Name | ECTS | Professor | Schedule | Slot |
|---|---|---|---|---|---|
| 3638 | Python for Data Analysis | 3 | Esteve Almirall | Oct 1 - Dec 12, online self-paced | online |
| ??? | Entrepreneurship through Acquisition | 1.5 | Bartomeus + Corrales | Oct 27-30 PM | PM |
| ??? | Introduction to Consultancy | 1.5 | Coyne | Oct 6-9 AM | AM |
| ??? | Leading Organizations | 1.5 | Correa | Nov 12-26 AM | AM |
| ??? | AI for Productivity and Personal Development | 1.5 | — | Nov 30 - Dec 4 AM | AM |

---

## 9. Launch checklist

- [ ] **Fri May 15 eve**: scaffold project (Next.js + Supabase wiring)
- [ ] **Sat May 16**: ship core flow (auth → onboarding → board)
- [ ] **Sat May 16 afternoon**: invite 3-5 trusted cohort friends → stress test
- [ ] **Sun May 17 morning**: fix critical bugs from feedback
- [ ] **Sun May 17 evening**: post link in cohort WhatsApp group (Section 11 template)
- [ ] **Mon May 18**: monitor sign-ups, fix breakage, support questions
- [ ] **Tue May 19**: Add/Drop opens — peak day
- [ ] **Through end of Add/Drop window**: monitor, support
- [ ] **Post-Add/Drop**: collect feedback, write case study, ask program management about official data integration for v2

---

## 10. Privacy & trust copy (use verbatim)

### Footer (every page)
*Built by Rober Quintero, Co27. Not affiliated with ESADE. [GitHub] · [Privacy]*

### Landing page trust block
*This is a peer-built tool to help Co27 students coordinate elective trades during Add/Drop. We store your ESADE email, name, WhatsApp number (if you choose to share it), cohort section, and elective preferences. We never share data with third parties. You can delete your account anytime from your profile page.*

### /privacy page
- What we store (same as above)
- Why (matching cohort members for elective trades)
- How long (deleted on request, or auto-deleted 60 days after Add/Drop window closes)
- Contact: [Rober's email]

---

## 11. WhatsApp launch message template

> Hey Co27 — quick one. With Add/Drop opening Tuesday, I built a small site for us to coordinate elective trades instead of refreshing eOffice all week.
>
> [link]
>
> Sign in with your ESADE email, post which electives you want to drop and which you want to add, and see who else is looking for what. Then DM them directly.
>
> Built it solo over the weekend. Open source, no affiliation with ESADE, no data shared anywhere. Feedback welcome.
>
> Let's make Add/Drop less painful for all of us.

---

## 12. Stretch goals (v1.1 if time permits, but DO NOT block launch)

- Course filter on board (dropdown)
- Listing edit / delete from board
- "Mark as closed" button on own listings
- Light/dark mode
- Empty-state messaging when no listings on a course

## 13. v2 (post-Add/Drop, only if there's signal)

- Email notifications when someone posts a course you want
- Telegram bot integration
- Course capacity data (requires program management cooperation)
- Replicate for incoming Co28 cohort
- Open-source as a generic "MBA cohort elective trading board" template
