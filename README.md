# Anniversary Gallery

A minimalist, wedding-themed photo gallery for celebrating your anniversary. Browse memories organized by month, with a built-in admin panel for uploading and managing photos.

## Features

- **Elegant gallery** — Soft ivory palette, serif typography, and a clean wedding-inspired layout
- **Month sections** — Photos grouped by month with sticky navigation
- **Lightbox viewer** — Full-screen photo viewing with keyboard navigation
- **Days counter** — Shows how many days since your anniversary date
- **Admin panel** — Upload, caption, and delete photos; manage months and site settings
- **GitHub Pages ready** — Static build deploys easily to GitHub Pages

## Quick Start

```bash
# Install dependencies
npm install

# Start development (gallery + admin API)
npm run dev
```

- **Gallery:** http://localhost:5173
- **Admin:** http://localhost:5173/admin.html (login)
- **Dashboard:** http://localhost:5173/admin-dashboard.html (after login)
- **Admin password:** `love2025` (change in `src/js/admin.js`)

## Admin Usage

1. Open the admin page and log in
2. **Site Settings** — Update the gallery title, subtitle, and anniversary date
3. **Add Month** — Create a new month section (use ID format `YYYY-MM`, e.g. `2025-07`)
4. **Upload Photo** — Select a month, add a caption, drag & drop an image
5. **Manage Photos** — View and delete photos or entire months

> The admin API only runs during development (`npm run dev`). Uploaded images are saved to `public/images/` and metadata to `public/data/gallery.json`.

## Deploy to GitHub Pages

```bash
# Build static site
npm run build

# The dist/ folder contains the deployable site
```

### Option A: Deploy from `/docs` folder

1. Copy `dist/` contents to a `docs/` folder in your repo
2. In GitHub repo Settings → Pages → Source: select `main` branch, `/docs` folder

### Option B: Deploy with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

## Project Structure

```
anniversary-gallery/
├── public/
│   ├── data/gallery.json    # Gallery metadata
│   └── images/              # Uploaded photos (by month)
├── server/
│   └── admin-api.js         # Local admin API
├── src/
│   ├── index.html           # Gallery page
│   ├── admin.html           # Admin panel
│   ├── css/                 # Styles
│   └── js/                  # Frontend logic
└── dist/                    # Built site (after npm run build)
```

## Customization

- **Colors & fonts** — Edit CSS variables in `src/css/main.css`
- **Admin password** — Change `ADMIN_PASSWORD` in `src/js/admin.js`
- **Sample data** — Edit `public/data/gallery.json`

## License

MIT
