# Kids Mahaber — Agent Handoff Context

Last updated: 2026-08-25 (PWA deployed; admin password rotated locally)

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

## Live / old systems

| System | URL | Role |
|--------|-----|------|
| New live site | https://kids-mahaber.netlify.app/ | **Primary** — Netlify + Blobs |
| New GitHub repo | https://github.com/jaklilu/Kids-Mahaber.git | Source of truth (`kids-mahaber/` = repo root) |
| Local Netlify Dev | http://localhost:8889 | Dev server (port **8889**, not 8888) |
| Wix (mostly empty shell) | https://jaklilu5.wixsite.com/kidsmahaber | Old UI host — retire after cutover |
| PythonAnywhere API | https://kidsmahaber-jaklilu.pythonanywhere.com/api | Old shared state — import then retire |
| Design reference | https://wegene-family-mahaber.netlify.app/ | Color/vibe inspiration |

**Prod health (verified 2026-08-25):** `GET /api/health` → `{ status: "ok", storage: "blobs" }`. PWA manifest + `sw.js` live after commit `f333f0c`.

---

## PWA (installable app)

**Shipped 2026-08-25** — thin installable shell via `vite-plugin-pwa`. Not offline-first.

### What it gives the family

- Home-screen icon + name **“Mahaber”**
- **Standalone** window (no browser URL bar on many devices)
- Faster repeat loads (app shell precached ~280 KiB; kid photos **not** precached)
- **`/api/*` is NetworkOnly** — votes and schedule always hit the live API

### What it does *not* do (yet)

- Offline use
- Push notifications (deferred — see **Notifications** below)
- One-click install on iPhone (Apple has no install API)

### How to install (tell the family)

| Device | Steps |
|--------|--------|
| **iPhone/iPad** | Safari → open site → **Share** → **Add to Home Screen** → **Add** |
| **Android** | Chrome → **⋮** menu → **Install app** / **Add to Home screen** |
| **Desktop Chrome** | Install icon in address bar (right side) |

There is **no “Install” in the Safari URL bar** on iPhone — Share is required.

### Dev vs preview gotcha

| URL | Use |
|-----|-----|
| `http://localhost:8889` | **`npm run dev`** — full app + API (correct for testing data) |
| `http://localhost:4173` | **`vite preview`** — static build only, **no API** → blank schedule |
| `https://kids-mahaber.netlify.app/` | Production — install + full API |

Service worker is **disabled during `npm run dev`** (`devOptions.enabled: false` in `vite.config.ts`) so local API debugging stays simple. SW runs on production build / Netlify deploy.

### Future PWA polish (not built)

- **Install helper UI:** “Install app” button on Android/desktop (`beforeinstallprompt`); iOS instruction sheet (Share → Add to Home Screen) — family asked for easier install for non-technical users
- **Push notifications:** deferred; email (Resend) is the easier first notification channel

### PWA files

- `vite.config.ts` — manifest, workbox, NetworkOnly `/api`
- `src/main.tsx` — `registerSW()`
- `public/pwa-192.png`, `pwa-512.png`, `apple-touch-icon.png`
- `scripts/generate-pwa-icons.mjs` — regenerate icons from `public/favicon.svg`

---

## Current product state (2026-08-25) — READ FIRST

Snapshot from live Blobs via `GET /api/data`:

| Item | Live value |
|------|------------|
| Process vote deadline | **Closed** (`2026-07-15T17:00:00-07:00`) |
| Parents votes | **5 yes / 0 no** → `adopted: false` (need **>70% of 10** = **8+** 👍) |
| Children process votes | **0** |
| Host/Pass UI | Still **hidden** (`showCurrentTurn = false` in `TrackerPanel.tsx`) |
| Current turn | **Frea** (`isCurrent: true`), status empty — **nobody Hosting** |
| Frea proposed date | **2026-08-15** — **already past**, `dateConfirmed: false` |
| Other confirms | Only **Tsedaye** confirmed (`2028-08-12`) |
| History | Tammy `2025-09-20`, Tsedaye `2025-06-14` |
| Kids process UI | Still shown (`SHOW_KIDS_PROCESS_VOTE = true`) |

**Product limbo:** Voting closed short of the 70% bar; first host date slipped; rotation Host/Pass still off. Decide outcome + calendar before more feature work.

### Suggested deep-dive tracks

| Track | Question |
|-------|----------|
| **A. Process outcome** | Re-open vote, lower threshold, force-adopt, or archive the proposal UI? |
| **B. Post-Aug-15 ops** | Slip Frea’s date, mark hosted, or regenerate schedule from “now”? Restore Host/Pass? |
| **C. Cutover** | Import PythonAnywhere state → Blobs; retire Wix/PA; delete old folder |
| **D. Hardening** | Member gate; lock open mutating routes; admin session vs password header |
| **E. Notifications** | Wire **Resend email** first (partially built); push/SMS later |

---

## Notifications (planned — not priority)

| Channel | Status | Notes |
|---------|--------|-------|
| **Email** | Code exists (`_shared/email.ts`); needs `RESEND_API_KEY` + `EMAIL_TO` in Netlify | Triggers on new host; easiest win |
| **Push (PWA)** | **Deferred** | Needs VAPID keys, subscribe API, Blobs for device tokens; iPhone requires home-screen install + Allow |
| **SMS** | Not built | Old Wix app had `sms:` link idea |

User preference (2026-08-25): revisit push **maybe later**; email first.

---

## What the product does

Private family tool to rotate who **hosts** the next gathering:

1. **Parents** tab (route id still `tracker`)
   - **Current turn card temporarily hidden** (`showCurrentTurn = false` in `TrackerPanel.tsx`) — Host/Pass not shown while family votes on the process; set to `true` to restore
   - Family schedule table: **Member · Proposed date** (date-hosted column removed from Parents view; still in Admin)
   - Proposed dates: **−1 wk / +1 wk** + **Pls Confirm** (`dateConfirmed`)
   - After someone hosts: member RSVP thumbs (👍/👎); buttons hide after vote
   - **Separate proposal cards** (explain / vote / tally) — **Parents tally** only drives adoption
2. **Admin** — password gate; reset member / reset all; reorder; clear history; change current host date; refresh proposed schedule; shift proposed dates
3. **Children** tab (route id still `kids`)
   - Temporary **process vote** card (`SHOW_KIDS_PROCESS_VOTE` in `KidsPanel.tsx`) — set `false` after voting ends
   - Separate **Coming / not coming** RSVP tally + per-child thumbs

Tabs labeled **Parents · Admin · Children**.

Auto-refresh every 10s while tab visible. Client merges by `updatedAt` and conservatively merges proposal/kids votes so stale polls cannot wipe local/recent votes.

### Three separate “vote” systems (do not mix)

1. **Process proposal** — first-name thumbs → `scheduleProposal.responses` / `kidsResponses`
2. **Post-host RSVP** — after someone is `Hosting` → `member.vote`
3. **Kids attendance** — Coming / not coming → `kids[].vote`

Host/Pass is a fourth action path (currently hidden).

---

## Schedule proposal (process vote)

Kept **separate from hosting** so people don’t confuse thumbs with Host/Pass.

### Deadline

- Closed **Wednesday, July 15, 2026 at 5:00 PM** Pacific
- Constants: `PROPOSAL_DEADLINE_AT` (`2026-07-15T17:00:00-07:00`) + `PROPOSAL_DEADLINE_LABEL` in `src/schedule.ts` / `_shared/schedule.ts`
- Stored on proposal as `deadlineAt`; synced by `ensureScheduleProposal()`
- UI: deadline line under title; badge **Voting Closed** after deadline; thumbs hidden
- API rejects `proposal-vote` after deadline via `isProposalVotingOpen()`
- **Live outcome:** 5/10 yes → **not adopted** (threshold is strict `yes / familySize > 0.7`)

### Copy (source of truth)

- Title / summary: `PROPOSAL_TITLE` + `PROPOSAL_SUMMARY` in `src/schedule.ts` and `netlify/functions/_shared/schedule.ts`
- Title: **Vote on the New Hosting Process**
- Includes: Frea hosts **Saturday, August 15, 2026**; rotate every three months on second Saturdays; “Which means we will see each other every three months for sure.”
- Badge when open: **Open for Voting**
- `ensureScheduleProposal()` rewrites stored title/summary/deadline when they differ from the constants (votes preserved)

### Vote UX

1. Three cards: explanation → thumbs → tally (`ScheduleProposalPanel`)
2. Large green 👍 / red 👎 (~4.5rem) → modal asks for **first name** (`Modal` `mode="text"`)
3. Parents: `{ firstName, vote }` in `scheduleProposal.responses[]` — drives **>70%** adoption
4. Children: same flow into `scheduleProposal.kidsResponses[]` (does **not** flip `adopted`; separate Children tally)
5. API: `POST /api/proposal-vote` with `{ firstName, vote, audience: "adults"|"kids" }`
6. Duplicate first names blocked per audience (case-insensitive)

### Schedule rule (proposed dates)

- Builder: **Frea locked to `FREA_FIRST_HOST_DATE` = `2026-08-15`**, then every **3 months** second Saturday for subsequent roster order
- `ensureScheduleProposal()` / `getTracker()` one-time-corrects Frea if stored as `2026-08-08` (old second-Saturday Aug) back to Aug 15
- Hosts may shift ±1 week via `POST /api/shift-proposed-date` (clears `dateConfirmed`)
- Host may confirm via `POST /api/confirm-proposed-date` → `dateConfirmed: true`
- Admin **Refresh proposed schedule** rebuilds dates and **resets proposal votes** (`generate-schedule`)

### Legacy migration

Old shape used per-member `votes: { name, photo, vote }[]`. Backend/frontend migrate to `responses: { firstName, vote }[]` via `migrateLegacyVotes()`.

---

## New stack (`kids-mahaber`)

| Layer | Choice |
|-------|--------|
| Frontend | React 19 + Vite + TypeScript |
| PWA | Thin installable shell via `vite-plugin-pwa` (manifest + SW); **NetworkOnly for `/api/*`** — no offline data |
| Hosting | Netlify |
| API | Netlify Function `netlify/functions/api.ts` |
| Storage (prod) | Netlify Blobs store `kids-mahaber` only — never `USE_LOCAL_STORE` on Netlify |
| Storage (local) | `data/*.json` when `USE_LOCAL_STORE=1` |
| Live site | https://kids-mahaber.netlify.app/ |
| Email (optional) | Resend via `RESEND_API_KEY` + `EMAIL_TO` |
| Admin auth | `ADMIN_PASSWORD` env + `x-admin-password` header |

**Prod bug fixed 2026-07-12:** `ENOENT: mkdir '/var/task/data'` — never fall back to local files under Lambda. Blobs only on Netlify deploy contexts.

**Vote-loss bug fixed 2026-07-13:** Never persist from GET; hard-block file store on deployed contexts; stamp `updatedAt`; client ignores stale polls / merges votes. **Do not set `USE_LOCAL_STORE` in Netlify env.**

**Blobs wiring fixed later (Jul commits):** `connectBlobs(event)` / `connectLambda` required for Functions v1; do **not** use Blobs `consistency: "strong"` (breaks without uncachedEdgeURL).

**POST `/api/data` vote merge:** `mergeTrackerOnClientSave()` unions proposal responses so a stale full-tracker POST cannot drop process votes.

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
ADMIN_PASSWORD=<your-secret>   # local only; never commit
USE_LOCAL_STORE=1
```

**Admin password (2026-08-25):**

- Local `.env` was rotated to a family-chosen secret (not in git).
- **Production:** set `ADMIN_PASSWORD` in Netlify → Site configuration → Environment variables, then redeploy. Until set, the API falls back to hardcoded **`change-me`** in `netlify/functions/api.ts` (`process.env.ADMIN_PASSWORD || "change-me"`) — that is why admin worked on Netlify with no env entry.
- Client stores password in `sessionStorage` after Admin tab login.

Production (Netlify UI): `ADMIN_PASSWORD` (required for real security); optionally `RESEND_API_KEY`, `EMAIL_TO`, `EMAIL_FROM`.

See `.env.example` (still shows `change-me` as template only).

Email helper fallback URL should be `https://kids-mahaber.netlify.app` (hyphen). Confirm `URL` / `DEPLOY_PRIME_URL` / hardcoded fallback in `_shared/email.ts` if enabling Resend.

---

## API surface (`/api/*` → function `api`)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/health` | public | `{ status, storage: "blobs"\|"local-file" }` |
| GET | `/api/data` | public | Full tracker (read-only; may in-memory ensure proposal) |
| POST | `/api/data` | **public** | Full write; merges proposal votes; may email on new host |
| POST | `/api/host` | **public** | `{ memberIndex, date }` — host to top, history unshift |
| POST | `/api/pass` | **public** | `{ currentIndex }` |
| POST | `/api/update-host-date` | admin | `{ index, date }` |
| POST | `/api/generate-schedule` | admin | Rebuild proposed dates + reset proposal votes |
| POST | `/api/shift-proposed-date` | **public** | `{ name, weeks: 1 \| -1 }` |
| POST | `/api/confirm-proposed-date` | **public** | `{ name }` → `dateConfirmed` |
| POST | `/api/proposal-vote` | **public** | `{ firstName, vote, audience? }` — blocked after deadline |
| POST | `/api/reset` | admin | Clears member status **and** that member’s history rows |
| POST | `/api/reset-all` | admin | Clears statuses + kids votes (keeps history) |
| POST | `/api/clear-history` | admin | |
| GET | `/api/kids` | public | Kids list + votes |
| POST | `/api/kids/vote` | **public** | `{ name, vote: "yes"\|"no" }` |
| POST | `/api/admin-login` | public | `{ password }` — returns success only; client stores password in `sessionStorage` |

Admin header: `x-admin-password: <ADMIN_PASSWORD>` (default env fallback `"change-me"`).

**Auth gap:** Reorder / delete-history in the UI go through unauthenticated `POST /api/data`. Date shift/confirm and host/pass are also public. Fine for a trusted family URL today; harden before wider sharing (Track D).

---

## Data model

**Tracker** (`TrackerData`):

- `members[]`: `name`, `photo`, `status` (`""` \| `"Hosting"` \| `"Passed"`), `isCurrent`, `hostingDate`, `proposedDate`, `dateConfirmed?`, `vote` (hosting RSVP, not process vote)
- `history[]`: `{ name, date }` (ISO `YYYY-MM-DD` preferred)
- `passStartIndex`, `currentRoundPassers`, `hostConfirmed`, `lastHostIndex`
- `updatedAt?` — write stamp (ms) for client stale-poll handling
- `scheduleProposal?`:
  - `title`, `summary`, `createdAt`, `deadlineAt`, `adopted`, `threshold` (0.7)
  - `responses[]`: parent process votes `{ firstName, vote }`
  - `kidsResponses[]`: child process votes (temporary; remove after vote UI retired)

**Kids** (`KidsData`): `kids[]` with `name`, `photo` (`/kids/Name.jpg`), `vote`; optional `updatedAt`

**Date hosted (Admin):** `src/hosting.ts` → current `hostingDate` if Hosting, else first matching history entry.

**Adoption:** `yes / familySize > 0.7` (e.g. **8+ of 10** 👍). Kids tally does not set `adopted`.

Seed members/photos: `netlify/functions/_shared/seed.ts` (adult ImgBB URLs; kids local `/kids/...`).

---

## UI / design decisions already made

- Vibrant **green → yellow → red** gradient fading toward **bottom-right** (Wegene-inspired, but direction differs)
- Hero title **“Kids Mahaber”**: Fraunces, **deep black** `#0a0f0c`
- Body fonts: Outfit + Fraunces
- Host / Pass buttons **centered** under current turn (when shown)
- Glass-style white cards over the colorful background
- Process vote lives in **`ScheduleProposalPanel`** only — split into explanation / vote / tally cards
- Proposal thumbs: **green** yes / **red** no, enlarged (~4.5rem)
- Parents schedule: Member + Proposed date only (no date-hosted column)
- Current turn Host/Pass currently **hidden** (`showCurrentTurn = false`)

Main styles: `src/index.css`

---

## Git status

- Repo initialized **inside** `kids-mahaber/` (not the parent folder)
- Remote: `origin` → `https://github.com/jaklilu/Kids-Mahaber.git`
- Branch: `main` (tracks `origin/main`)
- Recent themes: **PWA** (`f333f0c`), proposal UX, vote-loss fixes, Blobs connectLambda, Frea Aug 15 lock, admin password rotation (local)
- Ignored: `.env`, `data/`, `node_modules/`, `dist/`, `.netlify/`

---

## Important bugs / lessons already fixed

1. **Frea showed July 20 without hosting** — leftover test host in `history`. **Reset now also deletes that person’s history entries**.
2. Port **8888** conflict → Netlify Dev on **8889**.
3. Flask default port **5000** blocked on this Windows machine; old Flask was tested on **5050** (not required for the new app).
4. Old `app.py` had a **hardcoded Gmail app password** — treat as compromised; never copy secrets into the new repo. Use env vars / Resend. **Revoke in Google Account if still active.**
5. Do not mix **process proposal thumbs** with **hosting Host/Pass** or **post-host RSVP**.
6. **Vote loss / GET rewrite races** — never persist on GET; merge on client save; `updatedAt` polling.
7. **`/var/task/data` ENOENT** — never use local file store on Netlify/Lambda.
8. **Missing Blobs env in Functions v1** — call `connectBlobs(event)` / `connectLambda` in the handler.
9. **Frea Aug 8 vs Aug 15** — lock `FREA_FIRST_HOST_DATE`; auto-correct stored `2026-08-08`.
10. **Blank schedule on `vite preview`** — no Netlify functions; use `npm run dev` on **8889** or production URL.
11. **Empty members on Parents tab** — `TrackerPanel` shows a hint if API data never loaded (preview-without-API case).

---

## Naming quirks (from old system)

- UI tab **“Kids”** was backed by API/`adults_data.json` named **adults**
- New code uses **`kids`** consistently
- Local folders: host photos under `Pictures/Adults`, kid photos under `Pictures/Kids`

---

## What is NOT done yet (next agent)

**Immediate (product limbo — prefer Tracks A/B):**

1. Decide process-vote outcome (re-open / force-adopt / archive UI)
2. Resolve Frea’s slipped **2026-08-15** date; restore Host/Pass when ready (`showCurrentTurn = true`)
3. Set `SHOW_KIDS_PROCESS_VOTE = false` (and optionally drop kidsResponses) once process vote is finished

**Cutover & polish:**

4. **Import live PythonAnywhere state** into Blobs if continuity still needed
5. **Email** — wire Resend; Netlify URL (hyphenated); retire Wix link
6. **SMS** — old `sms:` deep link not reimplemented
7. **Adult photos** — still ImgBB; optional migrate to `public/`
8. **Custom domain** + retire Wix + PythonAnywhere
9. **Delete** old `Kids Mahaber\` folder after cutover verified

**PWA & UX:**

14. **Install helper banner** — Android/desktop install button + iOS Share instructions (discussed, not built)
15. **Push notifications** — deferred

**Hardening (Track D):**

16. Optional **member gate** (shared password) before tracker
17. Require admin (or member gate) for `POST /data`, date shift/confirm, host/pass as appropriate
18. Admin session token vs password-in-header; rate limiting
19. Set **`ADMIN_PASSWORD` in Netlify** (remove reliance on `change-me` fallback)
20. Concurrent write safety — OK for light family use; consider DB if expanding

---

## Key files for the next agent

| File | Why |
|------|-----|
| `src/App.tsx` | Tabs, polling, merge logic, admin flows, modals |
| `src/components/TrackerPanel.tsx` | Current turn flag + proposal + schedule |
| `src/components/ScheduleProposalPanel.tsx` | Process vote UI + tally |
| `src/components/MemberRow.tsx` | Proposed date, ±1 wk, Pls Confirm, RSVP |
| `src/components/AdminPanel.tsx` | Admin UI |
| `src/components/KidsPanel.tsx` | Kids process vote flag + RSVP |
| `src/schedule.ts` | Proposed dates + proposal text/stats (frontend) |
| `src/hosting.ts` | Date hosted helpers |
| `src/api.ts` | Frontend API client |
| `src/index.css` | Full visual system |
| `netlify/functions/api.ts` | All backend routes |
| `netlify/functions/_shared/schedule.ts` | Backend schedule + proposal sync |
| `netlify/functions/_shared/store.ts` | Blobs + local JSON + connectBlobs |
| `netlify/functions/_shared/seed.ts` | Default roster |
| `netlify/functions/_shared/email.ts` | Optional Resend |
| `vite.config.ts` | Vite + thin PWA (`vite-plugin-pwa`; NetworkOnly `/api`) |
| `public/pwa-192.png` / `pwa-512.png` / `apple-touch-icon.png` | Install icons |
| `netlify.toml` | Build, redirects, dev port 8889 |
| `../Kids Mahaber/app.py` | Old API behavior reference (do not copy secrets) |
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
# Admin password: value in local .env (not committed)
# Parents: proposal cards (likely Voting Closed) + schedule −1/+1 wk + Pls Confirm
# Current turn Host/Pass hidden until showCurrentTurn = true
# Children: process vote (SHOW_KIDS_PROCESS_VOTE) + Coming/not coming RSVP
curl http://localhost:8889/api/health
curl http://localhost:8889/api/data
curl http://localhost:8889/api/kids

# Production smoke
curl https://kids-mahaber.netlify.app/api/health
# expect storage: "blobs"
# Production admin: Netlify UI → Site → Environment variables → ADMIN_PASSWORD
```

---

## Security notes for handoff

- Do **not** commit `.env` or copy Gmail credentials from old `app.py`
- Rotate/revoke the exposed Gmail app password in Google Account if still active
- Change `ADMIN_PASSWORD` in Netlify env — **do not rely on code fallback `change-me`**
- Site + most mutating APIs are currently **world-reachable** without a member gate
