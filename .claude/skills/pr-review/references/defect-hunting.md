# Defect hunting by area

Read the sections matching what the diff touches. These are the failure modes that survive linters and type-checkers — the ones a reviewer has to catch by reasoning about the code, which is why they're worth your attention and a `no-explicit-any` rule isn't.

For each item the question is the same: **what concrete input or state makes this go wrong?** If you can't answer that, move on.

- [Next.js App Router](#nextjs-app-router)
- [API routes](#api-routes)
- [Database & Prisma](#database--prisma)
- [Auth & authorization](#auth--authorization)
- [Forms, Zod & auto-save](#forms-zod--auto-save)
- [React data flow](#react-data-flow)
- [Money, tax & invoices](#money-tax--invoices)
- [PDF & file generation](#pdf--file-generation)
- [i18n & localized strings](#i18n--localized-strings)
- [Migrations, env & config](#migrations-env--config)
- [Tests](#tests)

---

## Next.js App Router

- **Server/client boundary.** A `'use client'` file importing something that reads secrets or `process.env` without `NEXT_PUBLIC_` either breaks at build or leaks. Trace new imports across the boundary.
- **Route moves.** When a route file moves or is deleted, every link, redirect, `router.push`, middleware matcher, OAuth callback, and external callback URL (Stripe, Supabase) pointing at the old path is now a 404. `grep` the old path across the repo *and* across config — this is the single most reliable source of real blockers in a restructuring PR.
- **Middleware matchers.** Adding a route to `publicRoutes` opens it to the world; removing one locks out flows that depended on it (password reset, email confirmation, webhooks). Ask which unauthenticated flows still need to reach it.
- **Caching.** New `fetch` in a server component inherits caching defaults. Per-user or per-report data rendered from a cached fetch shows one user's data to another — check for `cache: 'no-store'` / `revalidate` on anything user-scoped.
- **`params` / `searchParams`** are async in recent versions. A missing `await` yields a Promise where a string is expected and often fails only at runtime on a specific route.

## API routes

- **Input validation.** Does the handler parse the body through a schema, or index into it raw? Unvalidated `body.someId` reaching a query is both a crash and an authz hole.
- **Authorization, not just authentication.** Knowing *who* the caller is isn't the same as checking *this* row belongs to them. Any handler taking an id from the request needs an ownership check in the query itself.
- **Error responses.** Returning `error.message` to the client can leak schema, paths, or provider detail. Log detail, return a generic message plus a status.
- **Status codes and shape.** A new endpoint returning `200 { error }` breaks callers that branch on `res.ok`.
- **Idempotency.** Webhooks and payment callbacks are delivered more than once by design. A handler that creates a row unconditionally will double-create.

## Database & Prisma

- **N+1.** A `map` or loop containing an `await prisma.…` is one query per item. Look for `include`/`select` or a single `findMany` with `in`.
- **Over-fetching.** No `select` on a wide table pulls every column, including ones you don't want crossing a boundary.
- **Transactions.** Multi-row writes that must all land (report + line items, user + subscription) need `$transaction`, or a partial failure leaves inconsistent state.
- **Cascades.** A new relation without an explicit `onDelete` inherits a default that may orphan rows or block deletes.
- **Migration/schema drift.** A `schema.prisma` change with no migration file, or a migration that doesn't match the schema, breaks deploy rather than the PR.

## Auth & authorization

- **Server-side enforcement.** A check that exists only in a component is decoration; the request must be rejected server-side too.
- **Session reads.** Trusting a user id from the request body rather than the session lets any caller act as anyone.
- **Redirect targets.** A redirect path taken from a query param without an allowlist is an open redirect.
- **Secrets.** Service-role keys, provider credentials, and signing secrets must never reach a client bundle or a log line.

## Forms, Zod & auto-save

- **Schema vs. UI drift.** A field added to the form but not the Zod schema is silently dropped on submit; a field made required in the schema but with no UI affordance produces a validation error the user can't resolve.
- **Reading form state.** Prefer `getValues()` over DOM queries — DOM reads miss React Hook Form's internal state and go stale under re-render.
- **Auto-save races.** Debounced saves need flush-on-unmount, or the last edit before navigation is lost. Array fields (visits, line items) that save the whole array on blur will drop concurrent edits if two blurs overlap.
- **Coercion.** German-locale number and date inputs (`1.234,56`) parsed with `parseFloat` yield `1.234`. Check both directions, input and render.
- **Optional vs. nullable.** `z.string().optional()` and `.nullable()` are different contracts against a DB column; mismatches surface as runtime failures on old rows.

## React data flow

- **Effect dependencies.** A missing dep causes stale closures; an object or array literal in the dep array re-runs every render. A `setState` inside an effect that depends on that state loops.
- **Keys.** `key={index}` on a reorderable or filterable list carries state onto the wrong row.
- **Query invalidation.** A mutation with no `invalidateQueries` leaves the UI showing pre-mutation data until reload.
- **Cleanup.** Subscriptions, intervals, canvas instances (Fabric.js), and object URLs created in an effect need teardown, or you leak across navigations.
- **Derived state in `useState`.** State initialized from a prop won't track later prop changes — usually it should be computed during render instead.

## Money, tax & invoices

- **Floats.** Currency in `number` accumulates error across line items. Check whether the codebase's convention is integer cents or a decimal type, and whether this diff follows it.
- **Rounding.** Round once at the end, at a defined precision — rounding per line then summing gives a different total than summing then rounding, and invoices must reconcile.
- **VAT.** Gross/net confusion is the classic bug: applying a rate to an already-gross figure, or storing net and displaying it as gross.
- **Totals recomputed vs. stored.** If a total is stored, an edit to a line item must update it; if it's derived, it must be derived everywhere.

## PDF & file generation

- **Conditional sections.** Where the document varies by type (report types HS/BE/KG/OT), check the new branch against the matrix in the architecture docs — a section rendering for the wrong type is a correctness bug an author rarely sees, because they test one type.
- **Missing data.** Templates that assume a field is present render `undefined` into a customer-facing document rather than failing.
- **Layout overflow.** Long German compound words and long tables overflow fixed-width cells silently.
- **Uploads.** Check size limits, MIME validation, and that filenames aren't used as paths.

## i18n & localized strings

- **Key parity.** A key added to one locale file and not the other renders the raw key in production. Diff the key sets.
- **Hardcoded strings.** User-visible text inline in a component isn't translatable — and in this repo it breaks a documented rule.
- **Interpolation and plurals.** String concatenation around a translated fragment produces broken grammar in the other locale.

## Migrations, env & config

- **New env vars** need to be in `.env.example`, in the deploy target, and handled when absent — a bare `process.env.X!` becomes a production crash rather than a clear error.
- **Renamed vars** leave old names in CI, deploy configs, and other apps in the org.
- **Lockfiles.** A package-manager switch or a lockfile not matching `package.json` breaks CI in a way the PR author may not have hit locally.
- **Irreversible migrations** (drop column, narrow a type) need a stated rollback story, especially against existing production rows.

## Tests

- **New logic, no test.** Not every change needs one, but a new pure function, a new branch in a calculation, or a fixed bug generally does — a fix without a regression test invites the same bug back.
- **Tests asserting the old behaviour.** A changed test is worth reading closely: was the assertion updated because the behaviour intentionally changed, or to make a failure go away?
- **Tautological tests.** Mocking the unit under test, or asserting on the mock, passes regardless of correctness.
- **Skipped or `.only` tests** left in the diff silently reduce coverage.
