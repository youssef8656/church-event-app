# Church Event Management Platform

A real, production-oriented 3-day event platform: React/Vite/Tailwind frontend + Node/Express/PostgreSQL/Prisma backend. No mock data, no fake auth — every feature described here talks to a real database.

## What's implemented

**Backend** — every route group from the spec: `auth`, `users`, `attendance`, `meetings`, `leaderboard`, `points`, `program`, `announcements`, `home`, `media`, `leagues`, `tasks`, `restaurants`, `teams`, `rooms`, `notifications`, `admin`, `settings`, `events`.

- Full Prisma schema (every model from the spec) with DB-level constraints (e.g. one attendance row per user+meeting, one team per user+day, one league join per user)
- Auth: bcrypt + JWT access/refresh (refresh stored hashed, rotated on use), email verification
- Role-based (`MEMBER`/`SERVANT`/`ADMIN`) + granular, **scopable** permission system for servants — e.g. `league:manage` can be granted scoped to one specific league, `attendance:scan` globally. Role changes and permission grants are ADMIN-only server-side actions; nothing a client sends can self-elevate.
- QR: opaque token (no personal data in the code), PNG generation with the name burned into the image via `sharp` (chosen over `node-canvas` — ships prebuilt binaries, no system libcairo/libpango needed at deploy time), backend-validated scanning
- Attendance/check-in: server-time-only point calculation, configurable grace period + points, atomic ledger write
- Points: append-only ledger, dense-ranked leaderboard (ties share a rank, no gaps) computed in SQL, team leaderboard with `TODAY`/`CUMULATIVE` scope
- `/api/home` — one aggregated call powering the whole Home page
- Leagues: join/leave with a transaction-guarded capacity check (no race condition on the last slot), admin result recording that awards ledger points
- Tasks: create + bulk-assign, member self-complete, admin verify-and-award
- Media & Restaurant menus: file upload via `multer` (memory storage, type/size validated) behind a storage abstraction (`storage.service.js`) — local disk today, swap to S3 later by implementing two functions
- Teams/Rooms admin CRUD with daily-assignment upserts and room-reassignment history preserved
- `events`/`settings` routes let an admin create the Event + N EventDays and tune attendance grace/points from the UI instead of Prisma Studio
- Every sensitive action (role change, permission grant/revoke, manual point adjustment) writes to `AuditLog`, viewable in the admin UI
- Admin dashboard stats endpoint, in-app notification fan-out on announcements/media/tasks
- Central error handling (maps Prisma + Multer errors to clean HTTP responses), rate limiting, helmet, CORS, Zod validation

**Frontend**
- Vite + React Router + Tailwind, mobile-first with a bottom nav (4 primary + "More" sheet for the rest) and full desktop nav, unread-notification badge
- Centralized design tokens (`tailwind.config.js` + CSS variables in `index.css`) — re-skinning later means editing those two files, not hunting through components
- Auth flow (register/login/logout, silent refresh on load, in-memory access token — never localStorage)
- Home page wired to `/api/home`: event header, notifications, announcements, program, and the reusable `<Leaderboard />` component (top 5, your rank if outside top 5, team ranking with a Today/All-Days toggle)
- Check-In page: QR fetched as an authenticated blob, "Download as PNG" button, attendance history table
- Profile, Program (tabbed by day), full Leaderboard page, Leagues (join/leave), Media (by category), Food/Restaurants
- QR Scanner page (`html5-qrcode`, back camera, ready for the next scan immediately, no restart needed) — gated behind the `attendance:scan` permission
- Staff Dashboard with real stats + admin pages for Users (role/permission management), Teams, Rooms, Tasks, Announcements, Meetings, Program, Settings, and the Audit Log

## Not yet built (next steps)

S3 storage implementation (stubbed, throws clearly if selected without being filled in), push/email notification delivery beyond in-app + verification emails, a UI for editing an existing Event's name/dates (create works; the update endpoint exists but has no form yet).

## UI polish

- Toast notifications (`ToastProvider`/`useToast`) confirm success/failure on every admin mutation — publish, upload, delete, add meeting/program item.
- Destructive actions (deleting an announcement, media file, meeting, or program item) go through a shared `<ConfirmDialog />` rather than firing immediately.
- `/verify-email` is a real page — the link the backend emails now lands somewhere instead of 404ing.
- Home page has a skeleton loader; other data-driven pages show a plain loading state (further skeleton polish is a good place to extend the visual design once the final theme arrives).

## Quickest way to run it (Docker)

```bash
docker compose up --build
```

This starts Postgres, runs migrations, seeds the database, and boots the backend on `http://localhost:4000` — no local Postgres or Prisma setup needed. Then run the frontend separately (it's not containerized, since it's just a Vite dev server):

```bash
cd frontend
cp .env.example .env
npm install
npm run dev   # http://localhost:5173
```

## Manual installation (without Docker)

## Requirements

- Node.js 20+
- PostgreSQL 14+
- npm

## Installation

```bash
# Backend
cd backend
cp .env.example .env      # then fill in DATABASE_URL, JWT secrets, etc.
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev                # http://localhost:4000

# Frontend
cd frontend
cp .env.example .env       # VITE_API_BASE_URL=http://localhost:4000/api
npm install
npm run dev                 # http://localhost:5173
```

## Environment variables

See `backend/.env.example` for the full list: `DATABASE_URL`, JWT secrets/expiry, SMTP settings for verification emails, storage provider config, default timezone.

## Database setup

```bash
cd backend
npx prisma migrate dev --name init   # creates tables from prisma/schema.prisma
npx prisma studio                     # optional: browse data in a GUI
```

## Seed data

`npm run seed` creates:
- Admin: `admin@example.com` / `Password123!`
- Servant (with `attendance:scan` permission): `servant@example.com` / `Password123!`
- 8 sample members, e.g. `ahmed.youssef@example.com` / `Password123!`
- A 3-day event (Oct 1–3, 2026), meetings per day, daily team rotation, rooms, sample attendance + points, program items, two leagues, a restaurant, one pinned announcement

## Creating the first admin

The seed script creates one. To promote a real registered user to admin manually:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'you@example.com';
```

(There is intentionally no self-service "become admin" API — this must be done at the database level or by an existing admin, so a client can never claim the role by sending `{"role":"ADMIN"}`.)

## Verifying the setup

Once the backend is running against a seeded database:

```bash
cd backend
npm run smoke-test
```

This walks the golden path against your actual running server and DB: admin/servant/member login, rejecting bad passwords, confirming registration ignores a client-supplied `role`, the `/home` aggregate feed, dense-rank leaderboard ordering, a member being forbidden from scanning while a servant with `attendance:scan` succeeds, duplicate-checkin handling, an unknown QR token being rejected, league join/duplicate-join rejection, and admin-only routes rejecting non-admins. It prints a pass/fail count and exits non-zero on any failure, so it's CI-friendly.

For manual, ad-hoc exploration, import `backend/postman_collection.json` into Postman or Insomnia — the login request auto-saves its `accessToken` into a collection variable used by the rest of the requests.

## Development commands

- `npm run dev` — backend (nodemon) / frontend (vite) dev servers
- `npx prisma studio` — inspect/edit data visually
- `npx prisma migrate dev` — create and apply a new migration after schema changes

## Production build

```bash
# Backend
npm run prisma:deploy   # applies migrations without prompting (CI/CD safe)
npm start

# Frontend
npm run build            # outputs frontend/dist — deploy as a static site
```

## Deployment

- **Frontend**: Vercel (or any static host) — point it at `frontend`, build command `npm run build`, output `dist`.
- **Backend**: Render or Railway — point at `backend`, build command `npm install && npx prisma generate`, start command `npm start`. Set all `.env` vars in the platform's dashboard, including `DATABASE_URL` from a managed Postgres instance.
- **Database**: managed PostgreSQL from the same host (Render/Railway) or a separate provider (Neon, Supabase).
- **File storage** (for Media/Restaurant menus, once built): the schema already stores `fileUrl`/`fileKey` rather than raw bytes; wire up an S3-compatible bucket behind a small storage service so the provider can change later without touching the rest of the app.

## Basic system usage

1. Admin logs in and, if no event exists yet, creates one from **Staff Dashboard** (via `POST /api/events` — a dedicated "create event" form is the one remaining admin screen to build; in the meantime the seeded event works out of the box, or call the endpoint directly). Then creates meetings, teams, rooms, and program items for each day from their respective admin pages.
2. Members register, verify their email, and log in — they land on Home, which shows today's info automatically (server-determined "current day", never trusted from the client).
3. Members open **Check In** to show their QR code to staff.
4. A servant granted `attendance:scan` (or an admin) opens **Staff Dashboard → QR Scanner**, picks the active meeting, and scans continuously — each scan is validated server-side, points are awarded automatically if within the grace window, and duplicates are rejected.
5. Points from attendance, manual admin awards, tasks, and leagues all flow into the same ledger; the Leaderboard (Home preview and full page) is always computed live from it.
