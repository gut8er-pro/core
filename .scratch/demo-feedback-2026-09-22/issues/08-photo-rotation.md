# 08 — Photo rotation in the single-photo view

Status: ready-for-agent
Type: feature
Severity: medium

Photos arrive sideways from phones; there is no way to fix them in the app. Ivan narrowed the
scope on the call: rotation belongs ONLY in the single-photo (opened) view, in the action stack
where the palette and trash buttons already sit — one rotate button, 90° per click, saved
immediately.

## Direction

- UI: rotate button alongside palette/trash in the opened-photo view (filmstrip single view in
  `src/components/report/gallery/`); each click rotates 90° clockwise and persists right away —
  no separate save step.
- Server: rotation must be applied to the stored variants, not just CSS — re-encode
  original/preview/thumbnail (and drop/regenerate the `ai` variant) via the sharp pipeline in
  `src/lib/storage/photos-server.ts` / the photos process route, so the PDF and AI see the
  corrected orientation. Rotating also invalidates `annotatedUrl` — if annotations exist, either
  rotate the fabric JSON with the image or warn that markings will be cleared (decide during
  implementation; warn-and-clear is acceptable v1).
- Bonus if cheap while in there: respect EXIF orientation at upload time so most photos never
  need manual rotation (sharp `.rotate()` with no args).

## Resolution (2026-09-22)

Status: ready-for-human

**UI.** A rotate button sits in the single-photo action stack in
`src/components/report/gallery/photo-viewer.tsx`, above the trash and below the palette, matching
their styling. One click = 90° clockwise, persisted immediately, no separate save step. The icon
spins while the request is in flight and the button is disabled for that window.

**Server.** New route `POST /api/reports/[id]/photos/[photoId]/rotate` (`degrees` ∈ 90/180/270,
zod-validated, 403 on a locked report). It calls `rotateStoredPhoto` in
`src/lib/storage/photos-server.ts`, which downloads the stored original, re-encodes it through
sharp `.rotate(degrees)`, writes the rotated original back, and regenerates all three variants
(thumbnail / preview / **ai**) from the rotated bytes. The PDF and the AI pipeline therefore see
the corrected orientation — this is a real re-encode, not a CSS transform.

Variant rendering was extracted into a shared `renderVariants` used by both this route and
`photos/process`, so the two pipelines cannot drift.

**Annotations — warn and clear (v1, as the ticket allows).** Rotating invalidates the fabric
coordinates, so the client asks for confirmation (`gallery.rotateClearsAnnotations`) only when the
photo actually has annotations or an `annotatedUrl`; on confirm the route deletes the annotations
and nulls `annotatedUrl`.

**Cache.** Variants keep stable storage paths, so the URLs are returned with a `?v=<timestamp>`
suffix — otherwise the browser would keep showing the pre-rotation image from cache.

**Bonus done: EXIF normalization at upload.** `photos/process` now runs sharp `.rotate()` with no
arguments on the downloaded original, baking the EXIF orientation into the pixels and re-uploading
the original when the bytes changed, so most phone photos never need a manual rotate. The content
hash used as the AI cache key is computed from the upright bytes.

**Verified:** new E2E `rotating a photo persists after a reload` clicks rotate, polls until the
stored URL changes (proving the server re-encoded rather than transforming in CSS), then reloads
and asserts the URL is unchanged. Green.
