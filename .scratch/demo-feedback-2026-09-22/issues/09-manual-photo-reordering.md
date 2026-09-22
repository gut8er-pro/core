# 09 — Manual photo reordering

Status: ready-for-agent
Type: feature
Severity: medium

Photos are auto-sorted today; the client wants to override the order by dragging the small
thumbnails (filmstrip and/or grid) — the order also drives the PDF's photo pages.

## Direction

- `Photo.order` already exists in the schema and the queries already sort by it
  (`@@index([reportId, order])`) — the model needs no change.
- Add drag-to-reorder on the thumbnails (`filmstrip.tsx`, `photo-grid.tsx`) with a persisted
  reorder call — either extend the photos PATCH with an ordered id list or a small
  `/photos/reorder` route; one write per drop, optimistic UI.
- Keyboard/touch fallback matters less here than shipping; plain HTML5 DnD or the lightweight
  dnd-kit both fit — no heavyweight new dependency beyond dnd-kit if needed.
- Mind ticket 01: the gallery gains file-drop handling at the same time — the two drag layers
  (files from OS vs thumbnail reorder) must not swallow each other's events.
