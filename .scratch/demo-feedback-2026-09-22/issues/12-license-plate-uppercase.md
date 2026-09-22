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
