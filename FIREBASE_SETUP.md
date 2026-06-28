# Firebase Setup Guide

Follow these steps once to enable **admin from anywhere** (phone, laptop, live site).

---

## 1. Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it e.g. `anniversary-gallery`
3. Disable Google Analytics (optional) → **Create project**

---

## 2. Enable Authentication

1. **Build → Authentication → Get started**
2. **Sign-in method** tab:
   - Enable **Google**
   - Enable **Email/Password** (optional backup)
3. **Settings → Authorized domains** — add your GitHub Pages domain:
   - `degarushiya.github.io` (replace with your username)

---

## 3. Create Firestore database

1. **Build → Firestore Database → Create database**
2. Choose **Start in production mode**
3. Pick a region close to you → **Enable**

---

## 4. Create Storage bucket

1. **Build → Storage → Get started**
2. **Start in production mode** → same region as Firestore

---

## 5. Set security rules

### Firestore rules
1. **Firestore → Rules** tab
2. Paste contents from `firebase/firestore.rules`
3. **Replace** `YOUR_EMAIL@gmail.com` with the Google account you'll use to sign in
4. **Publish**

### Storage rules
1. **Storage → Rules** tab
2. Paste contents from `firebase/storage.rules`
3. **Replace** `YOUR_EMAIL@gmail.com` with the same email
4. **Publish**

---

## 6. Get your web app config

1. **Project settings** (gear icon) → **General**
2. Under **Your apps** → click **Web** `</>`
3. Register app nickname: `anniversary-gallery`
4. Copy the `firebaseConfig` values

---

## 7. Local `.env` file

1. Copy `.env.example` to `.env` in the project root
2. Fill in your values:

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

3. Test locally:
   ```bash
   npm run dev
   ```
4. Open admin → you should see **Sign in with Google**

---

## 8. GitHub Pages (live site)

Add the **same 6 values** as repository secrets:

1. GitHub repo → **Settings → Secrets and variables → Actions**
2. **New repository secret** for each:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
3. Push any commit → Actions rebuilds with Firebase enabled

---

## 9. First sign-in

1. Open your live site → **Admin**
2. **Sign in with Google** (use the same email in your rules)
3. On first load, your existing `gallery.json` data is copied to Firestore automatically
4. Upload a photo from your phone — it appears on the live site instantly

---

## How it works now

| Action | Where |
|--------|--------|
| View gallery | Live site (GitHub Pages) |
| Admin login | Live site — Google sign-in |
| Upload photos | Phone or laptop — saves to Firebase Storage |
| Edit text/settings | Admin — saves to Firestore |
| Git push | Only needed for code changes, not photos |

---

## Free tier

For a personal anniversary site, Firebase Spark plan stays **$0** unless you get very heavy traffic.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Missing or insufficient permissions` | Check rules email matches your Google account |
| Google sign-in popup blocked | Allow popups for your site |
| Admin shows password form | Firebase env vars missing — check `.env` or GitHub secrets |
| Photos don't appear | Wait a few seconds, refresh; check Storage rules |
