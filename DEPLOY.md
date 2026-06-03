# Go live on yazzow.com (GitHub + Netlify)

Use **GitHub** for code and **Netlify** for hosting. Every `git push` can auto-deploy.

---

## Part A — Put the project on GitHub

### 1. Install Git (if needed)

Download: [https://git-scm.com/download/win](https://git-scm.com/download/win)

### 2. Create a GitHub repository

1. Log in at [https://github.com](https://github.com)
2. **New repository**
3. Name: e.g. `yazzow` (private recommended — contains no secrets if `.env` is ignored)
4. **Do not** add README, .gitignore, or license (this project already has them)
5. Click **Create repository**
6. Copy the repo URL, e.g. `https://github.com/YOUR_USERNAME/yazzow.git`

### 3. Push this folder to GitHub

In PowerShell:

```powershell
cd C:\Users\Gaming\Desktop\Tutorai

git init
git add .
git commit -m "Initial commit — Yazzow production ready"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/yazzow.git
git push -u origin main
```

Replace `YOUR_USERNAME/yazzow` with your real repo.

GitHub will ask you to sign in (browser or personal access token).

**Never commit `.env.local`** — it is in `.gitignore`. Secrets live only in Netlify env vars.

### 4. Day-to-day updates

After you change code in Cursor:

```powershell
cd C:\Users\Gaming\Desktop\Tutorai
git add .
git commit -m "Describe what you changed"
git push
```

Netlify redeploys automatically if you connected GitHub (Part B).

---

## Part B — Netlify (auto-deploy from GitHub)

### 1. Import the repo

1. [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**
2. **GitHub** → authorize Netlify → select your `yazzow` repo
3. Build settings (from `netlify.toml`):
   - Branch: `main`
   - Build command: `npm run build`
   - Plugin: `@netlify/plugin-nextjs`

### 2. Environment variables (before first deploy)

Netlify → **Site configuration** → **Environment variables**. Add from `.env.local`:

| Variable | Production value |
|----------|------------------|
| `NEXT_PUBLIC_SITE_URL` | `https://yazzow.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | publishable key |
| `SUPABASE_SECRET_KEY` | secret key |
| `STRIPE_SECRET_KEY` | Stripe secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable |
| `STRIPE_WEBHOOK_SECRET` | after Stripe webhook (below) |

Optional: `SLACK_WEBHOOK_URL`  
Skip Google calendar vars for now.

Click **Deploy site**.

### 3. Custom domain — yazzow.com

1. **Domain management** → add `yazzow.com` and `www.yazzow.com`
2. Redirect `www` → apex (recommended)
3. At your registrar: use **Netlify nameservers** (easiest) or:

| Type | Name | Value |
|------|------|--------|
| A | `@` | `75.2.60.5` |
| CNAME | `www` | `your-site.netlify.app` |

Use exact values from **Netlify → Domain management** (they can differ from the table above). HTTPS is automatic.

**DNS vs “site broken”**

| What you see | Meaning |
|--------------|---------|
| Browser can’t find the site / connection refused | DNS not pointing at Netlify yet, or wrong A/CNAME |
| Netlify page: “This page couldn’t load” / server error | **DNS is usually fine** — fix **deploy** (build log) or **env vars** (runtime 500) |
| Latest deploy failed in Netlify | Old/broken build still live — fix build, then redeploy |

Check DNS on your PC: `nslookup yazzow.com` should return Netlify IPs. If it does and the browser still errors, work on Netlify **Deploys** and **Environment variables**, not the registrar.

### 4. Supabase

**Authentication** → **URL configuration**:

- Site URL: `https://yazzow.com`
- Redirect URLs: `https://yazzow.com/auth/callback`

### 5. Stripe

- Webhook: `https://yazzow.com/api/stripe/webhook`
- Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
- **Connect:** enable **“Listen to events on Connected accounts”** for lesson/resource checkouts on connected accounts.
- **Subscriptions:** tutor £25/month billing runs on your **platform** Stripe account (not Connect).
- Add signing secret to Netlify → **Trigger deploy** (or push a commit)

Bookings are also confirmed when parents return from Stripe Checkout (`session_id` in the success URL), so slots still update even if the webhook is misconfigured.

### 6. Database (if not done)

Supabase SQL editor — run:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_extended_schema.sql`
3. `supabase/migrations/005_hourly_slots_and_alerts.sql` (hourly slots, cancellations, realtime)

Optional: `RESEND_API_KEY` in Netlify so families get email when a slot reopens after cancellation.

---

## Workflow summary

```
Edit code in Cursor
    → git add . && git commit -m "..." && git push
    → Netlify builds and publishes automatically
    → yazzow.com updates (after DNS is connected)
```

---

## Optional — GitHub CLI (faster repo create)

If you install [GitHub CLI](https://cli.github.com/):

```powershell
gh auth login
cd C:\Users\Gaming\Desktop\Tutorai
git init
git add .
git commit -m "Initial commit — Yazzow"
gh repo create yazzow --private --source=. --remote=origin --push
```

Then connect that repo in Netlify as in Part B.

---

## Checklist

- [ ] Repo on GitHub, code pushed
- [ ] Netlify connected to repo, env vars set
- [ ] `yazzow.com` DNS pointed at Netlify
- [ ] Supabase redirect URL added
- [ ] Stripe webhook configured
- [ ] Sign up / login works on production
