# Prisma migrations

Production deploys must run `pnpm prisma migrate deploy` (not `db push`) so the
migration history stays in sync.

## Baselining an existing database

The first migration (`20260514160136_init`) was generated from the live schema
*after* the database was already created via `prisma db push` during development.
On any pre-existing database, mark it as applied **once** before the next deploy:

```bash
pnpm prisma migrate resolve --applied 20260514160136_init
```

Fresh databases will pick it up automatically on the first `migrate deploy`.
