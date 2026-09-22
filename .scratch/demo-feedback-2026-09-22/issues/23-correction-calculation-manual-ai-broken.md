# 23 — Correction Calculation: Manual and AI calculation don't work

Status: ready-for-agent
Type: bug
Severity: high

The Correction Calculation area offers three provider cards — DAT, Manual, AI Calculation.
Client on the call: "manuelna kalkulacija i AI kalkulacija — ta funkcionalnost nešto ne radi,
vidi šta se dešava." No more detail than that; the demo stalled there.

## Direction

Investigation ticket — reproduce each path end-to-end on an HS report and write down what each
card actually does today before fixing:

- **Manual** — selecting the card should open the manual correction entry (fields for the
  correction rows); check whether the card click registers at all, whether a form renders, and
  whether values persist through the calculation PATCH.
- **AI Calculation** — should run the calc-extractor over the report's photos/data
  (`src/lib/ai/calculation-extractor.ts`, `/api/reports/[id]/calculation/auto-fill`); check the
  route wiring from THIS button specifically, auth/entitlement, and what the UI shows while it
  runs (the audit-era fixes touched auto-fill locale — the button wiring may never have been
  finished).
- **DAT** — expected to be gated on DAT credentials (integrations); it may legitimately no-op
  without a connected account, but then it must SAY so instead of silently doing nothing.
- Relevant standing context: audit issues 17/18 (AI writes vs selects, AI overwriting user
  input) apply to whatever the AI path writes.

Deliverable: findings appended here, then the fix; two green buttons below the cards (visible
in the screenshot, cut off) belong to this flow — identify and test them too.

## Findings (investigation before the fix)

Traced all three cards end to end on an HS report. The client was right; two of
the three did literally nothing.

**Manual — dead.** `handleTabClick('manual')` called `onModeChange?.(selected)`
and nothing else. No branch in `CorrectionSection` or the page rendered anything
for `mode === 'manual'`: no form, no fields, no request. The card just took a
black border. `correctionResultWithout` / `correctionResultWith` exist in
`CalculationFormData` but were never rendered and never sent, and the two result
cards were hardcoded `resultWithoutValue="—" resultWithValue="—"`.

**AI Calculation — dead.** Same story: the card only set state. The auto-fill
route `/api/reports/[id]/calculation/auto-fill` was wired **only** to the
page-top "Upload Image to Auto-fill" button (`handleAutoFill`), never to this
card. The route itself is fine (entitlement via `getEntitledUser`, 503 when
`ANTHROPIC_API_KEY` is absent, 400 with no photos, calls `extractCalculationData`).

**A second AI bug, found while tracing:** even via the working toolbar button,
`handleAutoFill` only called `invalidateQueries`. Because the page initialises
the form once per mount (`initializedRef`), the refetched values **never
reached the form** — the AI's writes were invisible until a full page reload.

**DAT — works, but silent when it cannot.** The card opens `DatModal`, which
saves into `datCalculationResult`. But `handleDatSave` swallows every error
(`catch {}`), and nothing anywhere checks whether a DAT account is connected —
matching the ticket's "may legitimately no-op, but must SAY so".

**The two green buttons** below the cards are `ValuationSection`'s "Quick
Valuation" and "Detail Valuation" (BE reports only). Both are `<button
type="button">` with **no `onClick` at all** — dead controls. Out of scope here;
filed as a follow-up note rather than fixed, since they are DAT-backed valuation
calls that need the same credentials work.

## Resolution

Status: fixed

### Fixed

- **AI card now runs the calculation.** `onRunAi` → `handleCorrectionAi`, which
  guards on the report actually having photos (translated hint if not) and then
  runs the same extractor. The card shows a spinner and "Auto-filling…" while it
  runs, is disabled during the run, and renders the result or error message
  underneath.
- **AI results now appear without a reload.** `handleAutoFill` replaces the bare
  invalidate with `queryClient.fetchQuery(...)` + `reset(..., { keepDirtyValues:
  true })`. `keepDirtyValues` is deliberate: it satisfies audit issue 18 (AI must
  not overwrite what the assessor already typed).
- **DAT now says when it cannot work.** The page reads `useUserSettings()` and
  passes `datConnected` (an active `DAT` integration). Without one, clicking the
  card no longer silently opens a modal that cannot calculate — it shows a
  translated hint pointing at Settings → Integrations.
- **Manual no longer pretends.** It shows a translated hint explaining it is not
  available yet and what to use instead, rather than highlighting a card that
  does nothing.

### Manual correction entry (unblocked and shipped)

Originally blocked: `model Calculation` had no `correctionResultWithout` /
`correctionResultWith` columns, and zod **silently stripped** them, so a manual
UI would have looked saved and lost the value on reload — the exact complaint
this demo was about. Verified rather than assumed:

    calculationPatchSchema.safeParse({ calculation: { costPerDay: 5, correctionResultWith: 100 } })
    → { success: true, data: { calculation: { costPerDay: 5 } } }

The coordinator added the two `Float?` columns and migration
`20260922140000_add_correction_results`. Completed on top of that:

- `src/lib/validations/calculation.ts` — both fields as
  `z.number().nonnegative().nullable().optional()`, so the PATCH stops stripping
  them. (The route's PATCH mapping is generic over the validated object, so it
  needed no change.)
- `src/app/api/reports/[id]/calculation/route.ts` — both fields added to the GET
  projection, so a reload can read them back.
- `src/components/report/calculation/form-data.ts` — both mapped in
  `calculationFromApi`; the form type and defaults already carried them.
- `correction-section.tsx` — the Manual card renders the entry again: two
  `€`-adorned numeric `TextField`s labelled with the same two result labels,
  saving through the page's existing `onFieldBlur` → auto-save path (and so
  through the tracked-save barrier from ticket 22).
- `details/calculation/page.tsx` — both names added to the `floatFields` list so
  they serialise as numbers, and the two result cards now derive from
  **`useWatch`**, formatted `de-DE` EUR, instead of the hardcoded `"—"`. That
  satisfies the "derived displays compute from useWatch, not server round-trips"
  requirement in ticket 22.

Design reference: `design/Main report flow/14b-Calculation - Manual.png`, which
shows the two green cards holding real figures with an Edit affordance.

### Verification

`src/components/report/calculation/correction-section.test.tsx` — 8 tests:

- DAT card opens the modal when an account is connected;
- DAT card does **not** open it when none is, and shows the translated hint instead;
- AI card invokes the run handler;
- AI card is disabled and shows "Auto-filling…" during a run, and a second click is ignored;
- the AI result message renders on the card;
- the Manual card opens the entry with both € amount fields;
- a manual amount is reported for saving on blur;
- mode changes are reported back to the page.

`src/app/(app)/reports/[id]/details/calculation/page.test.tsx` — 2 tests for the
AI photo guard: a photo-less report shows the hint and **never calls** the
auto-fill endpoint; a report with photos POSTs to
`/api/reports/:id/calculation/auto-fill` and shows no hint. (This is the guard
that was reported as broken via `photos.length` on `{ photos }` — the bug was
real, caught by tsc during implementation and already fixed before the report
arrived; these tests lock it down.)

Persistence round-trip proven through the real stack (zod → Prisma → Postgres):
`calculationPatchSchema` now **preserves** both fields, the update writes them
and they read back `32500` / `30000`. Both columns confirmed present in the
local database via `information_schema`.

**Environment caveat:** an HTTP round-trip against the running dev server still
returns 500 for these two fields only (`costPerDay` on the same report returns
200). That is a stale Prisma client in the long-running dev process, not a code
fault — the server started 23:04:24 and the client was regenerated 23:12:33.
A dev-server restart clears it; I did not restart it because other agents had
Playwright runs in flight against it.

### Follow-up (not fixed here)

`ValuationSection`'s "Quick Valuation" and "Detail Valuation" buttons (BE reports) have no
`onClick` and do nothing. They are DAT-backed valuation calls and need the same credentials
plumbing as the DAT card. Now tracked separately as **ticket 41**; left untouched here.
