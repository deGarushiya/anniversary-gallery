# Supabase Setup Guide

Follow these steps once for **admin from anywhere** (phone, laptop, live site) — free tier, no credit card required.

---

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **Start your project** (sign in with GitHub)
2. **New project** → name it e.g. `anniversary-gallery`
3. Set a database password (save it somewhere safe)
4. Pick a region close to you → **Create new project**

---

## 2. Run the database schema

1. In Supabase: **SQL Editor** → **New query**
2. Copy all of `supabase/schema.sql` from this repo → paste → **Run**

---

## 3. Create the images storage bucket

1. **Storage** → **New bucket**
2. Name: `images`
3. Turn **Public bucket** ON → **Save**

The SQL in step 2 already added upload/read policies for this bucket.

---

## 4. Enable authentication

1. **Authentication** → **Providers**
2. Enable **Email** (already on by default)
3. Optional: enable **Google** (add Google OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/))

### Redirect URLs (required for live site + local dev)

**Authentication** → **URL Configuration** → **Redirect URLs** — add:

```
http://localhost:5173/anniversary-gallery/admin-dashboard.html
http://localhost:5173/admin-dashboard.html
https://degarushiya.github.io/anniversary-gallery/admin-dashboard.html
```

(Adjust if your GitHub username or repo name differs.)

**Site URL** can be: `https://degarushiya.github.io/anniversary-gallery/`

---

## 5. Create your admin account

1. **Authentication** → **Users** → **Add user** → **Create new user**
2. Enter your email + a strong password
3. Use this to sign in on the admin page (phone or laptop)

> Only users you create can upload/edit. Everyone else can only view the gallery.

---

## 6. Get your URL and API key

Supabase shows these in **two** places — you need one value from each:

### A) Project URL → `VITE_SUPABASE_URL`

1. Click the **gear** (Project Settings) at the bottom of the left sidebar  
2. Open **Data API** (may appear under **Integrations** in some layouts)  
3. Copy **Project URL** — looks like `https://abcdefghijk.supabase.co`

### B) Public API key → `VITE_SUPABASE_ANON_KEY`

1. Still in Project Settings, open **API Keys** (under **Configuration**)  
2. Copy the **public** key — use one of these (either works):
   - **Publishable key** (`sb_publishable_...`) — newer projects  
   - **anon public** (`eyJ...` long JWT) — legacy label  

**Do NOT use** the **secret** or **service_role** key — that bypasses security and must never go in your website code.

| Copy this | Goes in `.env` as |
|-----------|-------------------|
| Project URL (from Data API) | `VITE_SUPABASE_URL` |
| Publishable or anon public key (from API Keys) | `VITE_SUPABASE_ANON_KEY` |

---

## 7. Local `.env` file

1. Copy `.env.example` → `.env`
2. Paste your URL and anon key
3. Run:

```bash
npm install
npm run dev
```

4. Open http://localhost:5173/admin.html  
   You should see **Sign in with Google** (if enabled) and email login — not the password form.

---

## 8. GitHub Pages (live site)

Add these **repository secrets** (Settings → Secrets → Actions):

| Secret | Value |
|--------|--------|
| `VITE_SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_ANON_KEY` | anon public key |

Push any commit → Actions rebuilds with Supabase enabled.

---

## 9. First sign-in on your phone

1. Open `https://degarushiya.github.io/anniversary-gallery/admin.html`
2. Sign in with your email/password (or Google)
3. On first load, your `gallery.json` is copied into Supabase automatically
4. Upload a photo — it appears on the live site immediately (refresh the gallery)

---

## How it works

| What | Where |
|------|--------|
| View gallery | GitHub Pages (static site) |
| Admin login | Supabase Auth |
| Photos | Supabase Storage (`images` bucket) |
| Titles, months, settings | Supabase database (`gallery` table) |
| Git push | Only for code changes, not photos |

---

## Free tier limits

Personal anniversary site stays **$0** on the free plan:

- ~1 GB storage
- ~50 MB database
- 50,000 monthly active users (more than enough)

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Password form instead of email login | `.env` or GitHub secrets missing — restart dev server |
| `new row violates row-level security` | Run `schema.sql` again; confirm you're signed in |
| Google sign-in fails | Add redirect URLs in Supabase URL Configuration |
| Photos don't load | Bucket must be **public**; check Storage policies |
| Upload fails | Sign in again; check file size (free tier ~50 MB max per file) |

---

## Local dev without Supabase

If `.env` is empty, the site falls back to password login (`love2025`) + `npm run dev` for file-based saves.
