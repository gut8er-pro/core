# 05 — Settings → Vorlagen is entirely non-functional

Status: resolved
Type: bug
Severity: high

The Templates tab looks like a working feature and is not one. Nothing a user does there survives
a page reload.

## Proven on the live app

1. Opened Settings → Vorlagen. Four rows, all titled "Random Title for This Template", all dated
   05/07/2026.
2. Clicked "Vorlage hinzufügen", filled Betreff = `E2E-TEST Vorlage Persistenz` and a body, clicked
   "Erstellen".
3. Reloaded the page.
4. The four mock rows are back. The created template is gone.

`GET /api/settings` contains **no template-related keys whatsoever** (filtered its key list for
`/templ/i` → `[]`), and there is no `/api/templates` route in the codebase.

## Cause

`src/app/(app)/settings/[[...tab]]/page.tsx:968-971` defines `MOCK_TEMPLATES`, and line 977 holds
it in component state:

```ts
const [templates, setTemplates] = useState<Template[]>(MOCK_TEMPLATES)
```

That is the whole feature. There is no persistence layer behind it.

## Further defects in the same tab

- **The row is created on drawer-open, not on confirm.** Clicking "Vorlage hinzufügen" immediately
  appends a "Neue Vorlage" row to the list before any input is given or "Erstellen" is pressed.
  Cancelling would leave an empty template behind (were anything persisted).
- **"Betreff" does not map to the row title.** I typed a subject; the list row still read
  "Neue Vorlage".
- **Templates cannot be opened or edited** — the only per-row action is "Entfernen".
- Mock titles are English in a German UI, and dates render as `05/07/2026` / `14/09/2026` — an
  ambiguous slash format rather than German `05.07.2026`.

## Fix

Either build the feature properly — schema, `/api/templates` CRUD, wire the drawer to it, create
on confirm rather than on open, map Betreff to the title, add an edit path — or hide the tab until
it exists. Shipping it in this state invites a client to write templates and lose them.

## Resolution notes

### Backend — persistence and CRUD

There is now somewhere for a template to live and four endpoints that put it there.

- `EmailTemplate` on `prisma/schema.prisma` — `id`, `userId` (cascading relation on `User`),
  `subject`, `body`, `createdAt`, `updatedAt`, indexed on `userId`.
- `GET /api/settings/templates` → `{ templates: [{ id, subject, body, createdAt, updatedAt }] }`,
  newest first.
- `POST /api/settings/templates` → `201 { template }`.
- `PATCH /api/settings/templates/[id]` → `200 { template }`, both fields optional.
- `DELETE /api/settings/templates/[id]` → `200 { success: true }`.

Every query is scoped by `userId`, so another user's id is a 404 rather than a row. Validation is
`createTemplateSchema` / `updateTemplateSchema` in `src/lib/validations/templates.ts` — subject
non-empty and under 200 characters, body under 20000 — and a failure answers
`400 { error: 'Invalid input', details }`, the shape the other settings routes use.

The endpoints sit under `/api/settings/templates`, not the `/api/templates` this ticket guessed
at, so that they read as part of settings like the tab they serve.

### The migration was written by hand

`DATABASE_URL` in `.env` points at a Supabase project that no longer answers:

```
$ npx prisma migrate status
Error: Schema engine error:
FATAL: (ENOTFOUND) tenant/user postgres.vdfgicgofmuscxqzmqpj not found
```

So `prisma/migrations/20260915120100_add_email_templates/migration.sql` was written by hand rather
than generated, and **nothing has applied it to any shared database**. Someone must run
`pnpm db:migrate` (`prisma migrate deploy`) against production before this deploys, or every
request to the new endpoints answers 500.

It was verified against a throwaway Postgres 16: `migrate deploy` applied `init` and it in order
on an empty database, and `migrate diff --from-config-datasource --to-schema` then reported *No
difference detected* — the hand-written SQL reproduces the schema exactly.

It is an **incremental** migration, which is the one deliberate departure from
`prisma/migrations/README.md`. That README says schema changes are made by regenerating the single
`_init` migration. Regenerating it here would produce a full from-empty script that
`migrate deploy` cannot apply to a database that already has `init` recorded — it would fail on
`CREATE TYPE "UserRole"` — and this ticket was proven against a live app, so such a database
exists. A `CREATE TABLE` that is additive applies cleanly to both a fresh database and that one.
Worth settling which convention the project actually wants before the next schema change.

### Verified

`npx tsc --noEmit` clean. `npx biome check` clean on the new files. `npx vitest run` — 916 passed,
26 skipped (the three integration files, which need `DATABASE_URL`). Against the throwaway
database, `src/test/integration/templates-api.integration.test.ts` — 9 passed, covering create,
list scoped to the owner, patch, delete, cross-user 404 on both patch and delete, and validation
400 — and `completeness-server.integration.test.ts` still 7 passed.

The UI half of the tab — create on confirm rather than on drawer-open, Betreff as the row title,
an edit path, German date formatting — is not covered by this note.

### UI (2026-09-15)

`MOCK_TEMPLATES` and the create-on-drawer-open path are gone from
`src/app/(app)/settings/[[...tab]]/page.tsx`. The tab reads and writes through
`src/hooks/use-templates.ts` — `useTemplates` / `useCreateTemplate` / `useUpdateTemplate` /
`useDeleteTemplate`, the same TanStack query-plus-invalidate shape as `use-settings.ts`, keyed
`['settings','templates']`. A row now shows its Betreff and `createdAt` via the file's existing
`formatDate()` (de-DE, dd.MM.yyyy), the row itself is a button that opens the drawer prefilled and
saves via PATCH, Entfernen calls DELETE, and "Erstellen" is the only thing that POSTs — it is
disabled while the subject is empty. Loading renders `SkeletonGroup`, a failed GET renders
`settings.templates.loadError`, an empty list `settings.templates.empty`; new keys are in both
`de.json` and `en.json` along with five `toast.template*` messages.
Verified: `npx tsc --noEmit` clean, `npx biome check` clean on the changed files, `npx vitest run`
921 passed / 26 skipped, `npx next build` succeeded with `/api/settings/templates` and
`/api/settings/templates/[id]` in the route list.

### Closed (2026-09-15)

Backend and UI halves both landed and verified together; flipped to resolved. Deploy note:
production must run `pnpm db:migrate` (applies `20260915120100_add_email_templates`) before or
with the deploy, or the four endpoints 500.
