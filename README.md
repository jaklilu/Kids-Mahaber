# Kids Mahaber (Netlify)

React rebuild of the family hosting-rotation tracker. Old Wix/PythonAnywhere code stays in `../Kids Mahaber/` for reference until cutover.

## Stack

- React + Vite (frontend)
- Netlify Functions (API)
- Netlify Blobs in production; local JSON fallback in `data/` for offline/dev without Blobs

## Local development

```bash
cd kids-mahaber
npm install
npm run dev
```

Opens Netlify Dev at http://localhost:8889 (proxies Vite + functions).

Admin password defaults to `change-me` (see `.env` / Netlify env `ADMIN_PASSWORD`).

## Deploy

1. Push this folder to GitHub (or drag-drop the `kids-mahaber` folder in Netlify)
2. Set env vars in Netlify:
   - `ADMIN_PASSWORD`
   - Optional email: `RESEND_API_KEY`, `EMAIL_TO`, `EMAIL_FROM`
3. Publish

## Features

- Tracker: current turn, Host / Pass, family RSVP votes
- Admin: reset, reorder, history
- Kids: attendance yes/no
- PWA: installable (home screen); app-shell cache only — live `/api` data is never cached

## Try the PWA locally

```bash
npm run build
npx vite preview --host
```

Open the preview URL on your phone (same Wi‑Fi) or in Chrome → Install / Add to Home Screen.
Service worker is **off** during `npm run dev` so API debugging stays simple; production/preview enables it.
