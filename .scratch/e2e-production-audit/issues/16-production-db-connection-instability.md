# 16 — Production API intermittently 500s / hangs on database access

Status: ready-for-human
Type: bug
Severity: high

Observed live on `app.gut8erpro.de` during the 2026-09-15 verification pass, logged in as a fresh
trial account.

## Evidence (all within one ~40-minute session)

1. Loading a report's Vehicle tab fired the section GETs in parallel; three of them returned
   **500 with an empty body** (crash before a JSON response), twice each (React Query retry):
   `/api/reports/<id>/condition`, `/photos`, `/accident-info`. Five minutes later the same
   endpoints returned 200 with correct data — nothing was deployed in between.
2. Later in the session, **every authenticated document request hung past 60 s**
   (`/`, `/notifications`) while unauthenticated requests (307 to /login) and `/help` stayed
   instant — consistent with SSR waiting forever on a database connection. The episode cleared
   itself; afterwards the same pages answered in 0.5–1.5 s.
3. The failing responses carry no body, so nothing reaches the client log, and Sentry captured
   nothing (issue 12 — its fix landed today but is not yet deployed).

## Diagnosis

Serverless functions + `pg.Pool` over a **direct** Postgres connection (the `.env` comment says
port 5432, no pgbouncer) on a nano instance. Two compounding problems:

- Every warm lambda holds up to 3 direct connections; under parallel section fetches the instance
  count × 3 approaches the nano's connection ceiling, and requests queue forever
  (`pg` default `connectionTimeoutMillis: 0` = wait indefinitely) — matching the observed hangs.
- `src/lib/prisma.ts` created the pool with **no `error` listener**. When Supabase closes an idle
  connection, node-postgres emits `error` on the pool; with no listener that is an uncaught
  exception that kills the lambda mid-request — matching the empty-body 500s.

## Landed in code (this pass)

`src/lib/prisma.ts`: pool `error` listener (logs instead of crashing), `connectionTimeoutMillis:
10s` (fail fast instead of hanging the page), `idleTimeoutMillis: 30s`.

## Remaining — human, Vercel env

Switch the production `DATABASE_URL` to the Supabase **transaction pooler** (Supavisor, port 6543,
`...pooler.supabase.com:6543/postgres`) — the recommended setup for serverless Prisma. Keep a
separate direct URL for `prisma migrate deploy` (migrations need a session connection; run them
from a machine, not from Vercel).

After the next deploy, Sentry (issue 12) will capture any recurrence with a stack trace.
