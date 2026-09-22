# 29 — PDF preview/download from Export & Send before sending

Status: ready-for-agent
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
