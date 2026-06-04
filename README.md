# Yazzow

**Tagline:** The business home for independent tutors.

White-labeled SaaS for solo educators and small agencies — private dashboard plus an isolated public portal at `yazzow.com/tutor/[username]`. No competing tutor directory.

## Stack

| Layer | Choice |
| --- | --- |
| Frontend | Next.js (App Router), TypeScript |
| UI | Tailwind CSS v4, shadcn/ui |
| Database & auth | Supabase (PostgreSQL + RLS) |
| Payments | Stripe Connect |

## Monetization

- **Tutor subscription:** **£25/month** — portal, schedule, bookings, and worksheet sales (no per-sale commission)
- **Lesson bookings:** parents pay 100% upfront; tutors keep the lesson price (Stripe processing applies). Availability is added in **1-hour slots** (a 2–5pm block becomes separate bookable hours).
- **Digital worksheet packs:** listed on the tutor portal shelf; tutors sell and deliver directly (no in-app checkout)

## Auth setup (Supabase dashboard)

1. **Authentication → Providers** — enable Email.
2. **Authentication → URL configuration**
   - **Site URL:** `https://yazzow.com` (not `http://localhost:3000` on production — or confirmation links open localhost with a raw token in the address bar).
   - **Redirect URLs** (add all that apply):
     - `https://yazzow.com/auth/confirm`
     - `https://yazzow.com/auth/callback`
     - `http://localhost:3000/auth/confirm`
     - `http://localhost:3000/auth/callback`
3. Set **`NEXT_PUBLIC_SITE_URL`** on Netlify to `https://yazzow.com` (no trailing slash).

## Database migration

Migrations live in `supabase/migrations/` and run in **filename order** when you use `npm run db:migrate` (`001` … `008`).

**Where env vars live**

| Environment | File / place | Used by |
| --- | --- | --- |
| Local dev | **`.env.local` only** (copy from `.env.example`) | `npm run dev`, `npm run db:migrate` |
| Production | **Netlify → Environment variables** | Live site at yazzow.com |

`npm run db:migrate` does **not** read Netlify. If the DB password is only in Netlify, add the same value to `.env.local` on your PC (or run SQL in the dashboard — below).

**Option A — CLI (recommended)**

In [Supabase](https://supabase.com/dashboard) → your project → **Settings → Database**, copy or reset the **database password**. Put it in `.env.local` (not only in Netlify):

```env
SUPABASE_DB_PASSWORD=your-database-password
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_REF.supabase.co
```

Optional: **Connect → Session pooler** → copy the URI into `.env.local` as `DATABASE_URL=` (often more reliable than guessing the pooler region).

Then from the project folder:

```bash
npm run db:migrate
```

If you see `password authentication failed`, the password in `.env.local` does not match that Supabase project — reset the DB password in the dashboard, update `.env.local`, save, wait 1–2 minutes, retry.

**Option B — SQL Editor (no password on your PC)**

Supabase → **SQL Editor** → run each file in `supabase/migrations/` in order (`001` through `008`), skipping any you already ran.

**“Database tables are not set up yet” in the app**

That means the **hosted** Supabase project is missing tables or a newer migration (e.g. student archive / lesson feedback needs `008`). Fix the database once (CLI or SQL Editor); redeploying Netlify alone does not apply SQL.

After migrating, refresh the dashboard.

## Go live (GitHub + Netlify)

1. Push to GitHub — see **[DEPLOY.md](./DEPLOY.md)** Part A  
2. Connect repo in Netlify — Part B (auto-deploy on every `git push`)

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Route | Purpose |
| --- | --- |
| `/` | Marketing home |
| `/dashboard` | Tutor private dashboard (scaffold) |
| `/tutor/demo` or `/tutor/maya-chen` | Sample public portal |

Copy `.env.example` to `.env.local` when wiring Supabase and Stripe.

For production deploys, set:

```env
NEXT_PUBLIC_SITE_URL=https://yazzow.com
```

## Database

| Migration | Contents |
| --- | --- |
| `supabase/migrations/001_initial_schema.sql` | Profiles, slots, bookings, resources, students, RLS, storage |
| `supabase/migrations/002_extended_schema.sql` | Indexes, schedule rules, purchase policies, PostgREST reload |

## Brand

- Spelling: **Yazzow** (capital Y)
- Domain: **yazzow.com**
- Palette: soft pastel greens, warm oak, calm cream (see `src/app/globals.css`)

## Calendar sync (iCal & Google)

Tutors can sync confirmed lesson bookings from **Dashboard → Schedule → Calendar sync**.

### iCal / Apple Calendar / Outlook

1. Run migration `003_calendar_integration.sql`.
2. Copy the **subscribe URL** from the dashboard.
3. Add it as a calendar subscription in Apple Calendar, Outlook, or Google Calendar (Other calendars → From URL).

The feed updates automatically when new lessons are booked.

### Google Calendar (one-way)

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/).
2. Enable **Google Calendar API**.
3. Create OAuth 2.0 credentials (Web application).
4. Add authorized redirect URI: `https://yazzow.com/api/calendar/google/callback` (and `http://localhost:3000/api/calendar/google/callback` for local dev).
5. Set in `.env.local`:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

6. Click **Connect Google Calendar** on the dashboard. Each new paid booking is added as an event.

## Next implementation steps

1. Supabase Auth + tutor onboarding (username claim, Stripe Connect Express)
2. Schedule CRUD → public slot availability
3. Stripe Billing for tutor subscription (£25/month) and Connect checkout for lessons and resources (no per-sale app fee)
4. Secure file storage (Supabase Storage) + purchase email with download token
5. Student ledger backed by bookings + purchases
