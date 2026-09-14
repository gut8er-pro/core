# Prisma migrations

Production deploys must run `pnpm prisma migrate deploy` (not `db push`) so the
migration history stays in sync.

## One migration, regenerated

There is a single migration (`20260914120000_init`) holding the whole schema.
The product is pre-launch with no production data, so schema changes are made by
editing `prisma/schema.prisma` and regenerating this file rather than by stacking
incremental migrations:

```bash
rm -rf prisma/migrations/2026*_init
pnpm prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script \
  -o prisma/migrations/<timestamp>_init/migration.sql
```

A fresh database picks it up on the first `migrate deploy`.

## Existing development databases

A database created before the current init was written has rows and a
`_prisma_migrations` history that no longer match. Reset it — there is nothing to
preserve:

```bash
pnpm prisma migrate reset
```
