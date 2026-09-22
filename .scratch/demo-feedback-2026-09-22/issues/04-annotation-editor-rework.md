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
