# Go live on yazzow.com (GitHub + Vercel)

Use **GitHub** for code and **Vercel** for hosting. Every `git push` can auto-deploy. Since Vercel is the creator of Next.js, it offers the fastest, most reliable, and out-of-the-box hosting for this stack.

---

## Part A — Put the project on GitHub

### 1. Create a GitHub repository

1. Log in at [https://github.com](https://github.com)
2. **New repository**
3. Name: e.g. `yazzow` (private recommended — contains no secrets if `.env` is ignored)
4. **Do not** add README, .gitignore, or license (this project already has them)
5. Click **Create repository**
6. Copy the repo URL, e.g. `https://github.com/YOUR_USERNAME/yazzow.git`

### 2. Push this folder to GitHub

In PowerShell:

```powershell
cd C:\Users\Gaming\Desktop\Tutorai

# (If Git is not initialized yet)
git init
git add .
git commit -m "Initial commit — Yazzow production ready"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/yazzow.git
git push -u origin main
```

Replace `YOUR_USERNAME/yazzow` with your real repo.

GitHub will ask you to sign in (browser or personal access token).

**Never commit `.env.local`** — it is in `.gitignore`. Secrets live only in Vercel environment variables.

### 3. Day-to-day updates

After you change code in Cursor:

```powershell
cd C:\Users\Gaming\Desktop\Tutorai
git add .
git commit -m "Describe what you changed"
git push
```

Vercel redeploys automatically once you connected GitHub (Part B).

---

## Part B — Vercel (auto-deploy from GitHub)

### 1. Import the repo

1. Go to [vercel.com](https://vercel.com) and log in.
2. Click **Add New...** → **Project**
3. Select your GitHub repository (`yazzow`) and click **Import**
4. Vercel will automatically detect that this is a **Next.js** project and apply the correct build settings.

### 2. Environment variables (before first deploy)

Under **Environment Variables** in the Vercel project configuration, add all your variables from `.env.local` (from Supabase under **Project Settings → API**):

| Variable | Value | Notes |
|----------|--------|--------|
| `SUPABASE_URL` | `https://YOUR_REF.supabase.co` | Same as project URL |
| `SUPABASE_ANON_KEY` | publishable or anon key | Server sign-in reads this at **runtime** |
| `SUPABASE_SECRET_KEY` | secret key (`sb_secret_…`) | Server-only |
| `NEXT_PUBLIC_SITE_URL` | `https://yazzow.com` or your Vercel deployment URL | |
| `NEXT_PUBLIC_SUPABASE_URL` | same as `SUPABASE_URL` | Needed for client features after rebuild |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | same as anon/publishable key | Needed for client features after rebuild |
| `STRIPE_SECRET_KEY` | Stripe secret | |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable | |
| `STRIPE_WEBHOOK_SECRET` | after Stripe webhook (below) | |

*Optional:* `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `SUPPORT_INBOX_EMAIL` (defaults to `support@yazzow.com`) for the support form, booking confirmations, cancel links, etc.

Click **Deploy**.

### 3. Custom domain — yazzow.com

1. Inside your Vercel project dashboard, go to **Settings** → **Domains**
2. Add `yazzow.com` and `www.yazzow.com`
3. At your domain registrar (e.g. GoDaddy, Namecheap), set up DNS records according to the Vercel instructions:
   - For apex domain `@`: An **A** record pointing to `76.76.21.21`
   - For `www` subdomain: A **CNAME** record pointing to `cname.vercel-dns.com`

Vercel automatically provisions Let's Encrypt SSL certificates for HTTPS once DNS propagates.

---

## Part C — External Services configuration

### 1. Supabase

**Authentication** → **Providers** → enable **Email** (sign up + sign in).

**Authentication** → **URL configuration**:

- Site URL: `https://yazzow.com` (or your Vercel address)
- Redirect URLs:
  - `https://yazzow.com/auth/callback`
  - `https://yazzow.com/**` (wildcard)

**Authentication SMTP Settings** (under **Authentication** → **Email** → **SMTP Settings**):
Use your Resend SMTP credentials so password resets and logins are delivered reliably from `@yazzow.com`.

### 2. Stripe

- Webhook endpoint: `https://yazzow.com/api/stripe/webhook` (or your Vercel address)
- Selected events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
- Connect Webhooks: Ensure **"Listen to events on Connected accounts"** is checked.
- Copy the Webhook Signing Secret (`whsec_...`) and save it as `STRIPE_WEBHOOK_SECRET` in your Vercel Project Settings. Remember to redeploy after changing Vercel environment variables!
