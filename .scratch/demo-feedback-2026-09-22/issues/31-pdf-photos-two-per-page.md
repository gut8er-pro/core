# 31 — PDF photo pages: two photos per page, larger

Status: ready-for-agent
Type: design
Severity: medium

The report PDF's photo pages should show **2 photos per page**, noticeably larger — the client
wants the images to carry the page ("da budu krupnije slike, dizajn malo sredi").

## Direction

- PDF gallery/photo section in `src/lib/pdf/` — switch the grid to two per page (stacked,
  full-width within margins, keeping aspect ratio), caption under each (existing
  classification/description labels stay).
- Use the `previewUrl` variant rather than thumbnails so the larger render stays sharp; check
  resulting PDF size with 20 photos (the cap) stays sane — preview variants should keep it
  well under mail-attachment limits, verify once.
- Annotated photos keep using `annotatedUrl` as today.
- Compare against `testing/reference-pdfs/` and regenerate references once the layout settles;
  `18-exhaustive-verify` parses text only, so no spec break expected.
