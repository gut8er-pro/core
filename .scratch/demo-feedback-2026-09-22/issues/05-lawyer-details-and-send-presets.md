# 05 — Lawyer: full contact details + recipient presets on Export & Send

Status: ready-for-agent
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
