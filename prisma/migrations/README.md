# Prisma migrations

Production deploys apply migrations automatically: the Vercel build runs
`scripts/migrate-on-vercel.mjs` (production environment only), which executes
`prisma migrate deploy` before `next build`. If a migration fails, the build fails
and the previous deploy stays live. When the runtime `DATABASE_URL` moves to the
Supavisor pooler, set `MIGRATE_DATABASE_URL` to the direct (5432) connection —
migrations need a session connection and the script prefers that variable.

## Incremental, additive migrations

`20260915120000_init` is the baseline; every schema change after it is its own
timestamped migration created with:

```bash
pnpm prisma migrate dev --name <what_changed>
```

(or hand-written in the same style when no database is reachable — verify it with
`migrate deploy` + `migrate diff` against a throwaway Postgres before committing).

The earlier convention of regenerating a single `_init` does not survive contact
with a database that has already recorded `init` in `_prisma_migrations`: a
regenerated from-empty script fails on the first `CREATE TYPE ... already exists`.
Production is such a database, so migrations stack from here on.

Because old code keeps serving traffic while a deploy builds, keep migrations
additive (new tables, new nullable-or-defaulted columns). Destructive changes need
the expand-migrate-contract dance across two deploys.

## Existing development databases

A database created before the baseline has rows and a `_prisma_migrations`
history that no longer match. Reset it — there is nothing to preserve:

```bash
pnpm prisma migrate reset
```
