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
