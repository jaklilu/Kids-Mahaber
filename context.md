# Kids Mahaber — Agent Handoff Context

Last updated: 2026-07-13

Use this file to continue work without re-discovering the project.

---

## Goal

Rebuild the family **hosting-rotation tracker** (“Kids Mahaber”) as a modern **React app on Netlify**, replacing the old **Wix embed + PythonAnywhere Flask API**.

Old code is kept only as reference until cutover is complete, then delete.

---

## Folder layout

```
c:\Kids Mahaber\
├── Kids Mahaber\          ← OLD (reference only — Wix/Flask/JSON)
│   ├── app.py             ← Flask API (PythonAnywhere)
│   ├── kidsmahaber_data.json
│   ├── adults_data.json   ← kids votes (misnamed “adults”)
│   ├── newfielonWixKidsAdded.html  ← best old UI
│   └── Pictures\
└── kids-mahaber\          ← NEW app (work here)
    ├── src\               ← React UI
    ├── netlify\functions\ ← API
    ├── public\kids\       ← kid photos
    ├── data\              ← local JSON store (gitignored)
    ├── netlify.toml
    ├── README.md
    └── context.md         ← this file
```

**Always work in `kids-mahaber/`.** Do not modify the old folder unless comparing behavior.

---

## Live / old systems (still running)

| System | URL | Role |
|--------|-----|------|
| Wix (mostly empty shell) | https://jaklilu5.wixsite.com/kidsmahaber | Old UI host |
| PythonAnywhere API | https://kidsmahaber-jaklilu.pythonanywhere.com/api | Live shared state |
| Design reference | https://wegene-family-mahaber.netlify.app/ | Color/vibe inspiration |
| New GitHub repo | https://github.com/jaklilu/Kids-Mahaber.git | Source of truth for rebuild |
| New live site | https://kids-mahaber.netlify.app/ | Netlify production |
| Local Netlify Dev | http://localhost:8889 | Dev server (port **8889**, not 8888) |

---

## What the product does

Private family tool to rotate who **hosts** the next gathering:

1. **Tracker**
   - **Current turn card temporarily hidden** (`showCurrentTurn = false` in `TrackerPanel.tsx`) — Host/Pass not shown while family votes on the process; set to `true` to restore
   - Family schedule table: **Member · Proposed date · Date hosted**
   - Proposed dates can shift with **−1 wk / +1 wk** under each proposed date
   - After someone hosts: member RSVP thumbs (👍/👎); buttons hide after vote
   - **Separate proposal card** (not mixed with hosting) to vote on the new hosting *process*
2. **Admin** — password gate; reset member / reset all; reorder; clear history; change current host date; refresh proposed schedule
3. **Kids** — attendance yes/no (confirm “is this you?”)

Auto-refresh every 10s while tab visible.

---

## Schedule proposal (process vote)

Kept **separate from hosting** so people don’t confuse thumbs with Host/Pass.

### Deadline

- Closes **Wednesday, July 15, 2026 at 5:00 PM** Pacific
- Constants: `PROPOSAL_DEADLINE_AT` (`2026-07-15T17:00:00-07:00`) + `PROPOSAL_DEADLINE_LABEL` in `src/schedule.ts` / `_shared/schedule.ts`
- Stored on proposal as `deadlineAt`; synced by `ensureScheduleProposal()`
- UI: deadline line under title; note under thumbs; badge **Voting Closed** after deadline; thumbs hidden
- API rejects `proposal-vote` after deadline via `isProposalVotingOpen()`

### Copy (source of truth)

- Title / summary: `PROPOSAL_TITLE` + `PROPOSAL_SUMMARY` in `src/schedule.ts` and `netlify/functions/_shared/schedule.ts`
- Title: **Vote on the New Hosting Process**
- Badge when open: **Open for Voting**
- Under thumbs: “Please vote by Wednesday, July 15, 2026 at 5:00 PM. Voting closes after that.”
- `ensureScheduleProposal()` rewrites stored title/summary/deadline when they differ from the constants (votes preserved)

### Vote UX

1. Dedicated card explains the process (paragraphs from `PROPOSAL_SUMMARY`)
2. Large green 👍 / red 👎 (~4.5rem) → modal asks for **first name** (`Modal` `mode="text"`)
3. Vote stored as `{ firstName, vote }` in `scheduleProposal.responses[]`
4. Duplicate first names blocked (case-insensitive)
5. Card shows progress toward **>70%** yes of family size, Agree/Disagree name tallies

### Schedule rule (proposed dates)

- Frea = second Saturday **one month** from baseline
- Then every **3 months**, second Saturday, in member order
- Hosts may shift one week earlier/later via `POST /api/shift-proposed-date`

### Admin

- **Refresh proposed schedule** rebuilds dates and resets proposal votes (`generate-schedule`)

### Legacy migration

Old shape used per-member `votes: { name, photo, vote }[]`. Backend/frontend migrate to `responses: { firstName, vote }[]` via `migrateLegacyVotes()`.

---

## New stack (`kids-mahaber`)

| Layer | Choice |
|-------|--------|
| Frontend | React 19 + Vite + TypeScript |
| Hosting | Netlify |
| API | Netlify Function `netlify/functions/api.ts` |
| Storage (prod) | Netlify Blobs store `kids-mahaber` only — never `USE_LOCAL_STORE` on Netlify |
| Storage (local) | `data/*.json` when `USE_LOCAL_STORE=1` |
| Live site | https://kids-mahaber.netlify.app/ |
| Email (optional) | Resend via `RESEND_API_KEY` + `EMAIL_TO` |
| Admin auth | `ADMIN_PASSWORD` env + `x-admin-password` header |

**Prod bug fixed 2026-07-12:** Site showed `ENOENT: mkdir '/var/task/data'` because Blobs failures (or local-store mode) fell back to writing under the function package dir, which is read-only. Store now uses Blobs on Netlify and never falls back to `/var/task/data`.

### Local commands

```bash
cd kids-mahaber
npm install
npm run dev          # Netlify Dev → http://localhost:8889
npm run build
npm run typecheck
```

`netlify.toml` sets `port = 8889` because **8888 is used by another project**. If `Could not acquire required 'port': '8889'`, something is already serving that port — check http://localhost:8889 before starting another `npm run dev`.

### Env (`.env` — gitignored)

```
ADMIN_PASSWORD=change-me
USE_LOCAL_STORE=1
```

Production (Netlify UI): set `ADMIN_PASSWORD`; optionally `RESEND_API_KEY`, `EMAIL_TO`, `EMAIL_FROM`.

See `.env.example`.

---

## API surface (`/api/*` → function `api`)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/health` | Health check |
| GET/POST | `/api/data` | Full tracker read/write; POST may email on new host |
| POST | `/api/host` | `{ memberIndex, date }` — moves host to top, history unshift |
| POST | `/api/pass` | `{ currentIndex }` |
| POST | `/api/update-host-date` | Admin; `{ memberIndex, date }` change gathering date |
| POST | `/api/generate-schedule` | Admin; rebuild proposed dates + reset proposal votes |
| POST | `/api/shift-proposed-date` | `{ name, weeks: 1 \| -1 }` |
| POST | `/api/proposal-vote` | `{ firstName, vote: "yes"\|"no" }` — process vote + tally |
| POST | `/api/reset` | Admin; clears member status **and** that member’s history rows |
| POST | `/api/reset-all` | Admin; clears statuses + kids votes (keeps history) |
| POST | `/api/clear-history` | Admin |
| GET | `/api/kids` | Kids list + votes |
| POST | `/api/kids/vote` | `{ name, vote: "yes"\|"no" }` |
| POST | `/api/admin-login` | `{ password }` |

Admin mutating routes require header: `x-admin-password: <ADMIN_PASSWORD>`.

---

## Data model

**Tracker** (`TrackerData`):

- `members[]`: `name`, `photo`, `status` (`""` \| `"Hosting"` \| `"Passed"`), `isCurrent`, `hostingDate`, `proposedDate`, `vote` (hosting RSVP, not process vote)
- `history[]`: `{ name, date }` (ISO `YYYY-MM-DD` preferred)
- `passStartIndex`, `currentRoundPassers`, `hostConfirmed`, `lastHostIndex`
- `scheduleProposal?`:
  - `title`, `summary`, `createdAt`, `deadlineAt`, `adopted`, `threshold` (0.7)
  - `responses[]`: `{ firstName, vote: "yes"|"no" }`

**Kids** (`KidsData`): `kids[]` with `name`, `photo` (`/kids/Name.jpg`), `vote`

**Date hosted column:** `src/hosting.ts` → current `hostingDate` if Hosting, else first matching history entry.

**Adoption:** `yes / familySize > 0.7` (e.g. 8+ of 10 👍).

Seed members/photos: `netlify/functions/_shared/seed.ts` (adult ImgBB URLs; kids local `/kids/...`).

---

## UI / design decisions already made

- Vibrant **green → yellow → red** gradient fading toward **bottom-right** (Wegene-inspired, but direction differs)
- Hero title **“Kids Mahaber”**: Fraunces, **deep black** `#0a0f0c`
- Body fonts: Outfit + Fraunces
- Host / Pass buttons **centered** under current turn
- Date hosted column **centered** in each member row
- Glass-style white cards over the colorful background
- Process vote lives in **`ScheduleProposalPanel`** only — **not** in the schedule table columns
- Proposal thumbs: **green** yes / **red** no, enlarged (~4.5rem)
- Current turn Host/Pass currently **hidden** (`showCurrentTurn = false`)

Main styles: `src/index.css`

---

## Git status

- Repo initialized **inside** `kids-mahaber/` (not the parent folder)
- Remote: `origin` → `https://github.com/jaklilu/Kids-Mahaber.git`
- Branch: `main`
- Ignored: `.env`, `data/`, `node_modules/`, `dist/`, `.netlify/`

---

## Important bugs / lessons already fixed

1. **Frea showed July 20 without hosting** — leftover test host written into `history` during API testing. Member Reset only cleared status, not history. Fixed: removed bad history row; **Reset now also deletes that person’s history entries**.
2. Port **8888** conflict → Netlify Dev on **8889**.
3. Flask default port **5000** blocked on this Windows machine; old Flask was tested on **5050** (not required for the new app).
4. Old `app.py` had a **hardcoded Gmail app password** — treat as compromised; never copy secrets into the new repo. Use env vars / Resend.
5. Do not mix **process proposal thumbs** with **hosting Host/Pass** or **post-host RSVP** — separate card + first-name tally.

---

## Naming quirks (from old system)

- UI tab **“Kids”** was backed by API/`adults_data.json` named **adults**
- New code uses **`kids`** consistently
- Local folders: host photos under `Pictures/Adults`, kid photos under `Pictures/Kids`

---

## What is NOT done yet (next agent)

Priority suggestions:

1. **Deploy to Netlify** from latest `main`; confirm Blobs + proposal card in production
2. **Import live PythonAnywhere state** (current turn/history/votes) into Blobs so cutover keeps continuity
3. **Optional member gate** (Wegene-style shared password before tracker) if family wants privacy
4. **Email notifications** — wire Resend; update email body link from Wix URL to Netlify URL
5. **SMS** — old app had `sms:` deep link (often commented out); not reimplemented
6. **Adult/host photos** — still ImgBB; optional migrate to `public/` / Netlify CDN; compress huge local Adult PNGs if used
7. **Custom domain** + retire Wix + PythonAnywhere
8. **Delete** old `Kids Mahaber\` folder after cutover verified
9. Harden admin (session token vs password-in-header; rate limiting)
10. Concurrent write safety — Blobs OK for light family use; consider DB if expanding
11. Optional: hide proposal thumbs after someone already voted under that first name (today API rejects duplicates)

---

## Key files for the next agent

| File | Why |
|------|-----|
| `src/App.tsx` | Tabs, polling, admin flows, host/pass + proposal name modal |
| `src/components/TrackerPanel.tsx` | Current turn + proposal card + schedule table |
| `src/components/ScheduleProposalPanel.tsx` | Process vote UI + tally |
| `src/components/MemberRow.tsx` | Schedule row (no process-vote column) |
| `src/components/AdminPanel.tsx` | Admin UI |
| `src/components/KidsPanel.tsx` | Kids RSVP |
| `src/schedule.ts` | Proposed dates + proposal text/stats |
| `src/hosting.ts` | Date hosted helpers |
| `src/api.ts` | Frontend API client |
| `src/index.css` | Full visual system |
| `netlify/functions/api.ts` | All backend routes |
| `netlify/functions/_shared/schedule.ts` | Backend schedule + proposal sync |
| `netlify/functions/_shared/store.ts` | Blobs + local JSON |
| `netlify/functions/_shared/seed.ts` | Default roster |
| `netlify.toml` | Build, redirects, dev port 8889 |
| `../Kids Mahaber/app.py` | Old API behavior reference |
| `../Kids Mahaber/newfielonWixKidsAdded.html` | Old UI/behavior reference |

---

## User preferences (from this project)

- Rebuild from scratch (don’t patch old HTML/Flask)
- React on Netlify; Blobs fine for storage
- Keep old folder until done
- Vibrant Wegene-like palette, but green→yellow→red to bottom-right
- Start Flask when working on old Python app (`user_rule`); new app uses `npm run dev`
- Prefer concise communication
- Keep process voting clearly separate from hosting actions

---

## Quick verify checklist

```bash
cd kids-mahaber
npm run dev
# open http://localhost:8889
# Admin password: change-me
# Tracker: proposal card (deadline + green/red thumbs) + schedule −1/+1 wk
# Current turn Host/Pass hidden until showCurrentTurn = true
# Proposal: thumb → first name → Agree/Disagree tally; closed after Wed Jul 15 5pm PT
curl http://localhost:8889/api/health
curl http://localhost:8889/api/data
curl http://localhost:8889/api/kids
```

---

## Security notes for handoff

- Do **not** commit `.env` or copy Gmail credentials from old `app.py`
- Rotate/revoke the exposed Gmail app password in Google Account if still active
- Change `ADMIN_PASSWORD` before any public deploy
