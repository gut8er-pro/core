# 05 — Lawyer: full contact details + recipient presets on Export & Send

Status: done
Type: feature
Severity: high

Today "Represented by a lawyer" reveals a single free-text field (`claimantInvolvedLawyer`).
The client needs the lawyer as a real party, wired into sending.

## Part A — lawyer contact details (Accident Info → claimant section)

When `representedByLawyer` is checked, collect: law-firm name, street + number, postcode,
location, email address, phone number (lawyer name field stays). Additive columns on
`ClaimantInfo` (e.g. `lawyerFirm`, `lawyerStreet`, `lawyerPostcode`, `lawyerLocation`,
`lawyerEmail`, `lawyerPhone`) + zod + route mapping + form section + PDF block. Completeness:
when the checkbox is on, at least firm + email should count as required (mirrors how the LAWYER
signature already becomes required — see `signaturesSection` in `src/lib/completeness/manifest.ts`).

## Part B — recipient presets on Export & Send

UPDATED on the call (2nd pass): exactly TWO recipient-type buttons, "ili jedan ili drugi" —
the third (Dokumentempfänger) goes away.

- **Claimant** (single-person button) → prefill the recipient chip with the claimant's email.
- **Claimant + lawyer** (two-people button) → prefill claimant email + lawyer email, the
  Gutachten goes to both.
- The two behave as an either/or toggle; switching replaces the prefilled chips.
- Emails missing on the report → the field stays empty and manual entry on the export step works
  exactly as now (that is the explicit fallback the client asked for).
- Prefills are editable chips, not locked values.

Files: `src/components/report/export/email-composer.tsx`, export page, `use-export.ts`; the
send route already accepts multiple recipients. The invoice Settings card has the same three
buttons (`recipientId`) — align it to the same two-option model in the same pass (ticket 25
renders the addressee from it).

Open question for Ivan (non-blocking): should the lawyer also appear in the PDF's parties block
or only as a recipient?

## Resolution — Part A only (2026-09-22)

Status: Part A done, Part B (export composer) still open for wave 2.

Six columns on `ClaimantInfo` (`lawyerFirm`, `lawyerStreet`, `lawyerPostcode`, `lawyerLocation`,
`lawyerEmail`, `lawyerPhone`) are now carried end to end:

- `src/components/report/accident-info/lawyer-fields.tsx` (new) — the block that appears inside
  the claimant section while `claimantRepresentedByLawyer` is checked. The old single
  `involvedLawyer` free-text field moved in here beside the firm.
- `src/lib/validations/accident-info.ts` — the six fields on `claimantInfoSchema`; `lawyerEmail`
  reuses `emailOrEmpty`.
- `form-data.ts` / `types.ts` — `claimantLawyer*` form fields, defaults and `*FromApi` mapping.
  The page's existing `claimant` prefix-strip routes them to `claimantInfo.lawyer*` unchanged.
- `use-accident-info.ts` — the six fields on the GET response type.
- `src/lib/completeness/manifest.ts` — the existing `when claimantRepresentedByLawyer === true`
  rule now also requires `claimantLawyerFirm` and `claimantLawyerEmail` (non-OT only, same as
  the LAWYER signature rule it sits beside).
- `testing/e2e/helpers/manifest-fill.ts` — fills the lawyer contact fields whenever the report
  has the checkbox on, so `completeManifest` still reaches 0 missing.

For wave 2 (PDF): the six new API fields arrive under `claimantInfo.lawyer*`.

## Resolution — Part B (2026-09-23)

Status: done. Ticket 05 is now complete.

Exactly two recipient-type buttons on Export & Send; the third (Dokumentempfänger) is gone,
along with its `individualRecipient` / `groupRecipient` / `documentRecipient` locale keys, which
had no other caller.

- **Claimant** (single-person icon) → replaces the chips with the claimant's email.
- **Claimant + lawyer** (two-people icon) → replaces them with the claimant's and the lawyer's.
- Either/or: `aria-pressed` carries which is active, and picking one replaces the chips rather
  than appending, so the two can never both be on.
- **Missing emails leave the field empty.** The preset filters out nulls, so a report with no
  claimant email and no lawyer email prefills nothing and manual entry works exactly as before
  — the explicit fallback the client asked for.
- **Chips stay editable** — a prefilled chip is an ordinary chip, removable with its X, and the
  input still accepts more addresses.

Stored as `ExportConfig.recipientMode`, validated by zod against `RECIPIENT_MODES =
['claimant', 'claimant_lawyer']` exported from `src/lib/validations/export.ts` — the same two
strings the invoice agent uses on the invoice card, so the two surfaces agree. The mode is
persisted and restored with the rest of the composer state (ticket 32).

The emails come from `useAccidentInfo(reportId)`: `claimantInfo.email` and
`claimantInfo.lawyerEmail`, the latter one of the six columns Part A added.

Answering the open question Ivan left on Part A — **yes, the lawyer appears in the PDF's parties
block**, as its own "Rechtsanwalt" section under the claimant, rendered only while
`representedByLawyer` is true. See the PDF notes appended to this wave's tickets.

E2E: `10-export.spec.ts` asserts both buttons are present and that no "Document recipient"
button remains.
