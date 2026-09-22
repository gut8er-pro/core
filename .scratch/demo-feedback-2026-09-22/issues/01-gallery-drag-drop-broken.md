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

## Resolution (2026-09-22)

Status: ready-for-human

**Mechanism, confirmed by reading the code before changing it.** `UploadZone` was the only drop
target in the gallery, and it renders only in the `photos.length === 0` branch of the gallery page.
Once a photo existed the page rendered the grid or the filmstrip instead, and neither carried a
`dragover`/`drop` handler. A dropped file therefore reached the document with its default intact,
so the browser navigated the tab to the dropped file itself. That navigation tore the SPA down
mid-route, which is what the client saw as "a random step, some vehicle grading error screen" —
the router unmounting, not a real navigation to grading.

**Fix, two layers.**

1. `src/hooks/use-file-drop.ts` (new) — `usePageFileDropGuard` swallows file `dragover`/`drop` on
   `window`, so a stray drop anywhere on the page can never navigate the tab again. `useFileDrop`
   is the reusable surface handler: it distinguishes an OS-file drag from a thumbnail reorder drag
   by inspecting `dataTransfer.types` for `Files`, and depth-counts enter/leave so the highlight
   does not flicker across child tiles.
2. The gallery surface accepts drops while photos exist — `photo-grid.tsx` via `onFilesDropped`,
   and the single-photo view via a `data-gallery-drop` wrapper on the gallery page. Both respect
   the 20-photo cap and the locked-report state, and the add-tile label switches to "Drop here to
   upload" while a file drag is over the grid.

Because reorder drags set their own `application/x-gut8erpro-photo` payload type and file drags do
not, the two drag layers coexist without swallowing each other (ticket 09).

**Verified:** new E2E `dropping files on a non-empty gallery uploads them without navigating away`
in `testing/e2e/04-gallery.spec.ts` drops a real PNG onto the mounted gallery surface, asserts the
photo count rises and that `page.url()` still points at the gallery. 7/7 green in that spec.
