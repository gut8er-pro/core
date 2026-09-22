# 04 — Annotation editor rework: draw anchoring, move/edit, per-element delete

Status: ready-for-agent
Type: feature
Severity: high

Three UX asks from the call, all in the drawing editor
(`src/components/report/gallery/annotation-modal.tsx`, Fabric.js):

1. **Draw from the corner, not the center.** Today the initial click is the CENTER of the shape
   and dragging grows it around that point. Every paint-style editor anchors the first click as a
   corner and drags out the opposite corner — switch rect/ellipse creation to origin-at-pointer
   (`originX/originY: 'left'/'top'` set from the drag direction).
2. **Move & edit existing markings.** Client: "we need to be able to move & edit the markings in
   the picture." Objects must be selectable and draggable after creation (Fabric selection mode
   when no drawing tool is active), with resize handles.
3. **Delete a single marking.** Client: "not intuitive that the delete button wipes every marking
   at once." Keep "clear all", add per-element delete.

   Proposed UX (Ivan asked for a recommendation): click a marking to select it → a small floating
   trash button appears pinned to the selection (plus Delete/Backspace on the keyboard does the
   same). This is the pattern from Figma/Canva/Preview, needs no new toolbar mode, and is
   discoverable on touch too. The existing toolbar trash then explicitly becomes "Alles löschen"
   with a confirm.

Acceptance: draw → select → move/resize → delete-one → save → reopen → everything as left
(depends on 03 being fixed). Applies to arrow, rect, circle and freehand alike.

## Resolution (2026-09-22)

Status: done

### Root cause of the anchoring complaint

Fabric v7 defaults `originX/originY` to `"center"`, and the drawing code never overrode it while
writing `left`/`top` as a top-left corner. So the first click became the centre and the shape
grew around it — and, because the same wrong origin was persisted, every reopened marking sat
half its size away from where it was drawn. Same defect as 03's item 3.

### What changed

- `annotation-shapes.ts` (new) — pure, unit-tested shape helpers. `createShape` forces
  `originX:'left' / originY:'top'` on rect, ellipse and arrow; `resizeShape` recomputes the box
  from the anchored corner via `boundsFrom`, so dragging back past the start flips the rectangle
  instead of inverting it. `isDegenerate` drops the zero-size ghosts a stray click used to leave
  (they could never be grabbed again). `toArrowGroup` bundles the line and its head into one
  `fabric.Group`, so an arrow is a single selectable/movable/deletable marking rather than two
  strays. Pointer coordinates now come from `getScenePoint` rather than `getViewportPoint`.
- **Move & resize** — a new `select` tool (now the default when the editor opens) turns on
  `canvas.selection` and makes every object selectable with controls and borders. Freehand paths
  are made editable on `path:created`, so pen strokes are movable too.
- **Per-element delete** — selecting a marking emits its bounding box (in container coordinates,
  offset-corrected) and the modal pins a small red trash button just above the selection.
  Delete/Backspace do the same, ignored while focus is in a text field and while the report is
  locked.
- **Clear all** — the toolbar trash is now labelled "Alles löschen"/"Clear all" and opens an
  inline `role="alertdialog"` confirm ("Alle Markierungen auf diesem Foto löschen?") with
  Cancel / "Ja, alle löschen".

### Locked reports (slice of issue 02)

The modal takes `locked` from `report.isLocked`. When locked the canvas is forced read-only
(every object inert, no drawing handlers bound), every toolbar tool plus Clear all and Save are
disabled, the floating trash never renders, keyboard delete is ignored, and a hint reads
"Dieses Gutachten ist gesperrt und schreibgeschützt." The editor still opens for viewing.

### Verified

Browser-verified on the local stack: rectangles now anchor exactly at the drag start; selection
shows resize handles plus the floating trash; deleting one marking left the other two intact; a
moved marking persisted at its new position. Covered in `annotation-shapes.test.ts` (14 tests)
and `testing/e2e/20-annotations.spec.ts`.
