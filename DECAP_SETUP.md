# Decap CMS Setup (mobile uploads → GitHub)

Use this **once** to enable uploading photos from your phone. Changes commit directly to your repo (`public/images/` + `gallery.json`), then GitHub Actions redeploys the site.

---

## What you get

- Open **Gallery CMS** on your phone (anywhere)
- Sign in with GitHub
- Upload photos, edit captions, update settings
- Saves as a git commit — no Firebase, no paid plan

**CMS URL (after deploy):**  
`https://degarushiya.github.io/anniversary-gallery/admin/index.html#/`

---

## One-time setup (~10 minutes)

### 1. Create a GitHub OAuth App

1. Go to [GitHub → Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
2. **New OAuth App**
3. Fill in:
   - **Application name:** `Anniversary Gallery CMS`
   - **Homepage URL:** `https://degarushiya.github.io`
   - **Authorization callback URL:** `https://api.netlify.com/auth/done`
4. Click **Register application**
5. Copy the **Client ID**
6. Click **Generate a new client secret** and copy the **Client secret**

> You are **not** moving your site to Netlify. Netlify only provides the free OAuth login bridge that Decap CMS needs.

---

### 2. Connect OAuth to Netlify (free)

1. Sign up / log in at [netlify.com](https://www.netlify.com) (free tier)
2. **Add new site** → **Import an existing project** → connect your `anniversary-gallery` repo (or create any placeholder site)
3. You do **not** need to change your GitHub Pages hosting — this site is only for OAuth config
4. In Netlify: **Site configuration** → **Access & security** → **OAuth**
5. **Install provider** → choose **GitHub**
6. Paste your **Client ID** and **Client secret** from step 1 → **Save**

---

### 3. Push this project & wait for deploy

After you push the Decap CMS files, GitHub Actions will deploy. Then open the CMS URL on your phone.

---

### 4. First login

1. Open: `https://degarushiya.github.io/anniversary-gallery/admin/index.html#/`
   - Use `.../admin/index.html#/` (with `#/`) — not just `/admin/`
2. Click **Login with GitHub**
3. Authorize the app
4. Open **Gallery → Gallery Content**
5. Expand **Photo Gallery by Month** → add or edit a month → upload a photo
6. Click **Publish** (top) to commit to GitHub

Your site rebuilds automatically within a minute or two.

---

## Two ways to manage the gallery

| Method | Best for | URL |
|--------|----------|-----|
| **Gallery CMS (Decap)** | Phone, anywhere | `/admin/index.html#/` |
| **Local admin** | Laptop, full dashboard | `npm run dev` → `/admin.html` |

Both write to the same `public/data/gallery.json` and `public/images/` files.

---

## Local testing (optional)

```bash
# Terminal 1 — OAuth proxy for local CMS
npm run cms

# Terminal 2 — dev server
npm run dev
```

Open `http://localhost:5173/admin/index.html#/` — uses `local_backend` to write to your local files without committing.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Failed to load config.yml` | Open `/admin/index.html#/` (note the `#/`) |
| Login popup fails | Check OAuth callback URL is exactly `https://api.netlify.com/auth/done` |
| `Repository not found` | Your GitHub account needs push access to the repo |
| Photos don't show on live site | Wait for GitHub Actions deploy to finish, then hard-refresh |
| Permission denied on save | Re-login; confirm you're owner of `deGarushiya/anniversary-gallery` |

---

## Security

Only GitHub accounts with **push access** to the repo can use the CMS. That's usually just you.
