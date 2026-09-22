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

## Resolution (2026-09-22)

Status: ready-for-human

**Root cause.** Two silent-drop paths in `src/hooks/use-photo-upload.ts`, plus one in the dropzone:

1. The cap check was `files.length > MAX_PHOTOS_PER_REPORT` — it only looked at the size of the
   incoming batch and ignored how many photos the report already held. Selecting 5 files into a
   report that already had 18 sent all 5; the server refused the last 3 individually and those
   refusals were the only trace.
2. `UploadZone.filterValidFiles` silently `.slice()`d the selection down to the remaining slots and
   dropped wrong-typed files before the hook ever saw them — files vanished with nothing recorded.
3. A `compressImage` rejection (corrupt or unreadable file) fell into the same generic catch as a
   network failure and was reported as "upload failed", which hid the real reason.

**Fix.** The hook now accounts for every file it was handed:

- `uploadPhotos` takes the report's `currentCount` and computes the real remaining slots; files past
  the cap land in `errors` by name instead of disappearing.
- `UploadZone` hands on the complete selection (`collectFiles`) — the hook is the single place that
  decides what is skipped and says why, so nothing is discarded without a message.
- Compression failure is its own branch with its own message (`uploadErrors.compressionFailed`).
- Every run ends with a `summary`: `"8 von 10 hochgeladen — 2 fehlgeschlagen:"` when anything was
  skipped, `"10 von 10 hochgeladen"` when clean. The gallery renders that summary above the
  per-file error lines, green when clean and red when not, so silence is impossible.

**Unit tests** (`src/hooks/use-photo-upload.test.tsx`, 5 passing) cover a mixed batch of 6 —
good / corrupt / oversized / wrong-type / server-refused / good — asserting all four failures are
named and the summary reads `2 von 6 hochgeladen — 4 fehlgeschlagen:`; the already-18-photos cap
case; and the all-succeeded case.
