# 29 — PDF preview/download from Export & Send before sending

Status: done
Type: feature
Severity: high

The assessor must be able to LOOK at the exact PDF before sending it. Client scoped it tight:
"možda neki preview/download — otvaranje u novom tabu, samo otvaranje PDF-a, ne treba ništa
više od toga." What is previewed is what gets sent.

## Direction

- A "Preview PDF" (Vorschau) button on Export & Send that opens the generated PDF in a new tab
  — the export GET route (`/api/reports/[id]/export?format=pdf`) already renders and streams
  exactly the send-time document; the button is mostly a link with the current toggle/language
  state as query params.
- It must respect the CURRENT composer state: PDF language selection and the section toggles
  (vehicle valuation / commission / invoice) — same params the send route will use, so preview
  and sent document cannot diverge (ties into ticket 30, where those toggles get fixed).
- The completeness gate applies as it does for send (422 → the existing missing-fields panel);
  locked reports stay downloadable per the standing exemption.
- One button per language when both are selected, or preview follows the first selected
  language — pick the simpler; label clearly.

## Resolution (2026-09-23)

Status: done.

A "Vorschau" / "Preview" button sits next to Send Report on Export & Send. It is a plain link,
which is the whole of what the client asked for — `target="_blank"`, no modal, no viewer.

- **One URL builder, `buildPdfUrl` in `src/hooks/use-export.ts`**, used by the preview link and
  mirrored by the send payload, so the previewed document and the attached one are produced by
  the same code path and the same params. The link carries `format=pdf`, `lang`, `sections`
  (serialized from the live toggles) and `disposition=inline`.
- **`disposition=inline`** on the export GET makes the browser render the PDF in the new tab
  instead of downloading it. Without the param the route still answers `attachment`, so the
  existing download path and `18-exhaustive-verify` are untouched.
- **Language.** One button per selected language: with a single language the label is
  "Vorschau", with both it becomes "Vorschau DE" / "Vorschau EN". The simpler of the two options
  the ticket offered, and it makes the two-PDF case explicit rather than silently previewing
  one of them.
- **The gate applies unchanged.** The preview goes through `generateReportPdfBuffer`, which is
  where the gate lives, so an incomplete report gets the same 422 as the send and the existing
  missing-fields panel is already on screen. The button is disabled while the report is blocked
  or while completeness is still being checked, so the assessor is not sent to a tab full of
  JSON. A delivered report previews regardless, per the standing exemption.
- Also disabled when all three section toggles are off, with a one-line hint — there is no
  document to look at.

### Tests

`10-export.spec.ts`: the inline URL answers 200 with `content-type: application/pdf` and
`content-disposition: inline`; the rendered button is a link whose href carries `format=pdf`,
`disposition=inline` and `sections=`.
