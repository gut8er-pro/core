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

## Resolution (2026-09-22)

Status: ready-for-human

**Approach.** Plain HTML5 drag & drop — no new dependency. Thumbnails are draggable in both the
filmstrip (`filmstrip.tsx`) and the grid (`photo-grid.tsx`); the grid additionally shows a grip
handle on hover, and the dragged tile dims while its drop target gets a primary-colour ring.

**Coexistence with ticket 01's file drops.** A reorder drag writes its photo id under a private
`application/x-gut8erpro-photo` MIME type; the file-drop layer only reacts when
`dataTransfer.types` contains `Files`. The two layers are mutually exclusive by payload type, so
neither swallows the other's events. The reorder drop also calls `stopPropagation`, so it never
bubbles to the surrounding gallery drop surface.

**Persistence — one write per drop.** New route `PATCH /api/reports/[id]/photos/reorder` takes the
full ordered `photoIds` list and renumbers `Photo.order` in a single `prisma.$transaction`. It
rejects anything that is not a complete permutation of the report's photos, since a partial list
would renumber some rows and strand the rest on stale positions. 403 on a locked report.

**Optimistic UI.** `useReorderPhotos` writes the new order into the query cache in `onMutate` and
rolls back in `onError`, so the tiles move under the cursor immediately and the assessor sees a
message only if the write actually fails.

`reorderPhotos` in `src/hooks/use-photos.ts` is the pure move-one-item mapping shared by the
optimistic update and the request body, so the drop and the persisted write cannot disagree.

**Tests.** `src/hooks/use-photos.test.ts` (6 passing) covers forward and backward moves, the
renumbering, no-op drops, unknown ids, and that the input array is not mutated. E2E `reordering
thumbnails persists after a reload` drags the first thumbnail onto the second, polls the API for
the swap, reloads and asserts the order held. Green.
