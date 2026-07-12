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
