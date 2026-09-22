# 36 — Multi-upload silently drops photos

Status: ready-for-agent
Type: bug
Severity: high

KG notes: "not all pictures got uploaded" — a batch upload finished with fewer photos in the
gallery than files selected, with no error shown.

## Direction

- Suspects in `src/hooks/use-photo-upload.ts`: the sequential compress→storage→POST loop
  aborting on one failure, a storage upload rejection swallowed, the 20-photo cap silently
  truncating (cap hit shows a message today — verify it actually fires from the multi-file
  path), or duplicate-name/HEIC files failing compression quietly.
- The upload already collects an `errors` list — make sure EVERY skipped file lands there and
  the summary line renders how many uploaded vs skipped ("8 von 10 hochgeladen — 2 fehlgeschlagen:
  …"), so silence becomes impossible.
- Reproduce with a 10+ file batch including one corrupt file and one oversized file; add a unit
  test on the hook for partial failure.
- Coordinate with ticket 01 (same files) — one agent owns both.
