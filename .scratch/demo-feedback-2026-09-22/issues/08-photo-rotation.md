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
