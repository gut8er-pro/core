# 01 — Drag & drop into a non-empty gallery is broken and can land on a random screen

Status: ready-for-agent
Type: bug
Severity: high

Client notes: "When already pictures are uploaded drag and drop is not working anymore."

Two symptoms, same flow (report created, some photos already uploaded, user drags more files in
before pressing Generate):

1. The drop is not accepted — clicking the dropzone still works, dragging does not.
2. Worse: sometimes the drop navigates somewhere else entirely — Ivan saw "a random step, some
   vehicle grading error screen". That smells like the drop landing outside any dropzone handler,
   so the browser/router handles it (default drop navigates to the file, or the drag events leak
   into the tab/section navigation).

## Direction

- The empty state renders the full-page dropzone (`src/components/report/gallery/upload-zone.tsx`),
  but once photos exist the gallery shows the grid/filmstrip — check whether any drop target is
  mounted at all in that state. The add-photos tile in `photo-grid.tsx` and the "+" in
  `filmstrip.tsx` open the file chooser but likely accept no drops.
- Make the whole gallery surface a drop target while photos exist (respecting the 20-photo cap
  and the same accepted types), and add a `dragover`/`drop` preventDefault guard at the gallery
  page level so a stray drop can never trigger browser navigation.
- Reproduce the "vehicle grading screen" navigation first and note the actual mechanism in this
  ticket before fixing.
