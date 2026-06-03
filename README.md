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

- **Lesson bookings:** 100% upfront; **2%** platform fee
- **Digital worksheet packs:** **5%** platform fee; secure download after purchase

## Auth setup (Supabase dashboard)

1. **Authentication → Providers** — enable Email.
2. **Authentication → URL configuration** — add redirect URL:
   - `http://localhost:3000/auth/callback`
3. For production, add `https://yazzow.com/auth/callback` (or your live domain).

## Database migration

Migrations live in `supabase/migrations/` and run in order:

| File | Purpose |
| --- | --- |
| `001_initial_schema.sql` | Core tables, RLS, storage bucket |
| `002_extended_schema.sql` | Indexes, schedule rules, schema cache reload |
| `003_calendar_integration.sql` | iCal feed token, Google Calendar fields |

Add your database password to `.env.local`:

```env
SUPABASE_DB_PASSWORD=your-database-password
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_REF.supabase.co
```

Then run:

```bash
npm run db:migrate
```

Or paste both SQL files into Supabase → SQL Editor (run `001` first, then `002`).

After migrating, retry **Launch my portal** on `/onboarding`.

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
3. Stripe Checkout for bookings (2% application fee) and resources (5%)
4. Secure file storage (Supabase Storage) + purchase email with download token
5. Student ledger backed by bookings + purchases
