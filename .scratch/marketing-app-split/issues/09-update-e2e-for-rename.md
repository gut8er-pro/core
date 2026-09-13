# 09 — Update Playwright e2e for the rename

Status: resolved
Type: task
Blocked by: 03, 04, 05

## Goal
Keep the single existing test seam (Playwright driving the Next app over HTTP) green after the route/locale changes.

## Changes (core repo, testing dir)
- Update the 16 specs for `/dashboard`→`/` and any post-auth redirect assertions now targeting `/`.
- Keep `baseURL=http://localhost:3000` for CI (`playwright.config.ts:13,32`, `testing/e2e/playwright.config.ts:18`).
- Account for the German-default UI (ticket 05): any assertions on English strings should set the locale explicitly or match German — prefer role/testid selectors over visible-copy assertions where feasible.

## Acceptance criteria
- All previously-passing specs pass against the migrated app.
- No assertion depends on the removed landing/legal routes.

## Notes
No marketing-site e2e in phase 1 (out of scope). Good tests assert external behavior (can the user reach the page / complete the flow), not route internals.

## Comments

**2026-09-01 — implemented.** Updated both suites for `/dashboard` → `/`, including the two absolute-URL `goto`s in `16-all-reports-send.spec.ts` and `helpers/test-data.ts` that a relative-path search misses.

`01-auth.spec.ts`: replaced the "landing page loads" test with one asserting the behaviour that took its place — an unauthenticated visitor to `/` is redirected to `/login`. Its `test.use` block ran with a wholly empty `storageState`, so with the German default it would have hit German copy; it now seeds `NEXT_LOCALE=en`. (`auth.setup.ts` already seeded that cookie, so the authenticated specs were unaffected.)

**The ticket missed a second suite.** There is a legacy root-level `e2e/` directory with its own `playwright.config.ts` (`testDir: './e2e'`), not wired to any npm script, containing `landing.spec.ts` plus landing-page blocks in `responsive.spec.ts` and `visual-regression.spec.ts` — all testing the page that moved to the Astro site. Deleted `e2e/landing.spec.ts` and those two blocks; updated the rest for the new root.

Not executed: the suites need a running dev server, a seeded database, and live Supabase credentials. They typecheck clean under `tsc --noEmit` (which covers `**/*.ts`).
