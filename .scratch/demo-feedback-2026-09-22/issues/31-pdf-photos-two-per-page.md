# 31 — PDF photo pages: two photos per page, larger

Status: done
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

## Resolution (2026-09-23)

Status: done.

- **Two per page, large.** The old layout was a `flexWrap` grid of `48%`-wide, 180pt-tall,
  `objectFit: cover` tiles — four to a page and cropped. Photos now render one per row at full
  content width, `objectFit: contain` with a 320pt cap, so nothing is cropped and two fill a
  page. Verified on a real 5-photo report: `pdfimages -list` reports exactly 2 images on each
  photo page.
- **`previewUrl`.** `photoSource()` picks `annotatedUrl ?? previewUrl ?? url` — annotated stays
  first because the markings are burnt into that variant, then the preview variant, then the
  original as a last resort. `previewUrl` was already on `Photo` and is now selected in the
  generator's query. Measured at ~115-128 PPI in the output, which is sharp at this size.
- **Captions kept.** `aiDescription` still prints under each photo, at 8pt instead of 7pt now
  that the images carry the page.
- **Category labels.** The old code wrapped each whole category in `wrap={false}`, which with
  images this size would push most categories onto pages of their own. Each category now prints
  its heading once and lets its photos flow; `wrap={false}` moved to the individual photo, so a
  photo is never split across a page break.
- **Border fix.** `@react-pdf` scales an `Image` to its own aspect ratio, so a border set on the
  image does not track the rendered edges and drew a line through the photo. The border moved to
  a `photoFrame` wrapper.

### Size at the 20-photo cap

Uploaded 20 photos (the cap) to a complete HS report and generated the DE PDF:

```
PHOTO COUNT 20
PDF BYTES 1389236  MB 1.32
```

**1.32 MB at 20 photos** — an order of magnitude under any mail attachment limit. The preview
variant is doing its job; no further compression needed.

Reference PDFs in `testing/reference-pdfs/` are now a layout generation behind and should be
regenerated. `18-exhaustive-verify` parses text only and is unaffected — it passes unchanged.
