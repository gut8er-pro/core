# Wave 2 report — 2026-09-23

Six agents, all green. End-of-wave gates: unit **1244/0**, tsc clean, locale parity
**1177 = 1177 zero drift**; the full serial E2E run is recorded below the ticket table once it
lands (individual agents' suite runs were all green on a quiet server).

## Ticket status

| # | Ticket | Status |
|---|--------|--------|
| 05B | Two recipient buttons + prefills on Export & Send | done |
| 10 | DateField primitive + swapped everywhere (incl. invoice, follow-up landed) | done |
| 24 | Preview Invoice | done — opens invoice-only PDF |
| 25 | Invoice carries claimant name + address ("Rechnung an") | done |
| 26 | Line items: default rows, per-unit pricing, auto photo count, delete, stored totals | done |
| 28 | Payment lifecycle pending/completed/delayed, coherent dashboard + statistics | done |
| 29 | PDF preview before send (Vorschau, per language) | done |
| 30 | Export toggles shape the PDF; invoice its own last page | done |
| 31 | 2 photos per page, larger (1.32 MB at the 20-photo cap) | done |
| 32 | Composer state persists; WYSIWYG send; locked re-send allowed | done |
| 33 | Report number = file number everywhere (a fake GH-number generator was deleted) | done |
| 34 | Business website/email/phone editable + on the letterhead | done |
| 35 | Manifest relaxations (opponent, second tire set, paint markers) | done |
| 37 | Business update broke sending (From header > 320 chars + unencoded umlauts) | done |
| 38 | OT Vehicle Grading: own tab, auto-grade, final grade visible, no Paint duplicate | done |
| 41 | BE Quick/Detail Valuation buttons live (DAT modal or honest hint) | done |
| — | Red invoice + tire fast-switch tests from wave 1 | both green (5/5 twice) |

## Root causes worth remembering

1. **Toggles never shaped the PDF** because half the sections were unconditional (invoice-only
   was structurally impossible), `includeCommission` had no consumer at all, and the send read
   a DB row the debounce hadn't written yet — with an inverted fallback that silently dropped
   the calculation.
2. **"I received the old version"**: chips lived in component state seeded from nothing, while
   the send payload read the form, which quietly held the last-sent address. Confirmed it could
   never leak across reports. Second cause of "Failed to send": the route *required* an
   ExportConfig row that only the composer's GET created.
3. **Invoice tab-switch loss had a second cause** beyond the missing watch-subscription: on
   remount React Query serves the previous mount's cached body first; the init effect latched
   on it, reset the form and even re-saved a fresh invoice number every re-entry. Fixed via
   `isFetchedAfterMount`; the same latent pattern on other tabs is documented in ticket 22.
4. **Business update broke sending** because a long company name pushed the From header over
   Resend's 320-char limit (misclassified as "service unavailable"), and umlauts went unencoded
   (RFC 2047 now).
5. **Tire fast-switch**: an effect keyed on `Array.prototype.find` (identity never changes) so
   it ran only on mount, and typing during the placeholder window created a second tire set.
6. **The dashboard's fake report numbers** came from a `generateReportNumber()` that minted
   plausible GH-numbers from the UUID — deleted; file number or em dash now.
7. `Invoice.totalGross/Net` were never persisted (70 local invoices all stored 0) — totals now
   derived server-side on every line-item write.

## Decisions waiting on Ivan / the client

1. **"Provision" toggle semantics** — bound to the Auftragserteilung block (visits + expert
   opinion) as the closest match; if the client means a commission fee line, that is a new
   column + template block. The DE label itself may be the mistranslation.
2. **Grading formula** — equal-weight mean, Non/ungraded excluded, rounded to thirds
   (2+/2/2−). One pure function to change if the client wants different weighting.
3. **Minimum-viable-Gutachten review** — the broader pass over remaining required fields per
   type (ticket 35's open question).
4. **Business IBAN** (ticket 07) and **per-report PDF language column** — both small schema
   additions if wanted.
5. **Invoice completeness rule** now auto-satisfied by seeded default rows; if the gate should
   still bite on invoices, the rule needs to become "at least one row with a rate > 0".
6. BVSK licensing (ticket 27) unchanged — client-side action.

## New tickets from this wave

43 — condition PATCH lacks server-side idempotency on `(conditionId, setNumber)` (hardening).

## Housekeeping

`.tmp-agent/` at the repo root is an agent's leftover scratch (untracked); deletion was
blocked for the orchestrator — remove manually. `testing/reference-pdfs/` are one layout
generation stale and should be regenerated when convenient (18-exhaustive-verify is text-only
and unaffected).
