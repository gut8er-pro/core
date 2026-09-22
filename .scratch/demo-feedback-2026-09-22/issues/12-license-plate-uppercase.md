# 12 — License plate input auto-uppercase

Status: ready-for-agent
Type: polish
Severity: low

Typing a lowercase plate leaves it lowercase in the input; the visual plate preview next to the
field (the blue-band EU plate component) should always show proper uppercase, and the client
wants the input itself to normalise too.

## Direction

- Uppercase transform on the plate inputs (claimant + visits + vehicle wherever plates are
  entered): `text-transform: uppercase` for display plus `.toUpperCase()` on the change value so
  the STORED value is uppercase, not just the rendering.
- The `LicensePlate` preview component (`src/components/ui/license-plate.tsx`) uppercases
  defensively as well.
- Store normalised; PDFs and the dashboard then inherit the fix for free.

## Resolution (2026-09-22)

Status: done for the claimant plate (the only plate input in the accident-info tab).

- `src/components/report/accident-info/license-plate-field.tsx` (new) — uppercases the change
  value itself, so what is STORED is uppercase rather than only what is rendered.
- `src/components/ui/license-plate.tsx` — the preview component uppercases defensively before
  splitting off the city code, so a lowercase value already in the database still renders as a
  proper plate.
- `src/lib/validations/accident-info.ts` — `licensePlate` uppercases server-side too, the
  backstop for anything reaching the column by another route (AI autofill, OCR, the API).

Note: the ticket also mentions "visits + vehicle wherever plates are entered". The visits rows
have no plate field, and the vehicle tab is another wave's territory — the server-side transform
above only covers `ClaimantInfo.licensePlate`. If the vehicle tab gains a plate input it needs
the same `LicensePlateField` treatment.
