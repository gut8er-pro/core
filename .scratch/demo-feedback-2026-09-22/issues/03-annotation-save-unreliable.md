# 03 — Annotation editor: save is unreliable, markings vanish

Status: ready-for-agent
Type: bug
Severity: high

Client notes: "markings not working well" and "when I add markings to pictures they are gone".
Ivan: draw a rectangle → Save → reopen → Save again (or similar sequence) and sometimes the
markings are simply not there afterwards; sometimes clicking Save itself appears to do nothing.

## Direction

- Trace the full round-trip: Fabric canvas → `fabricJson`/annotations PATCH → `annotatedUrl`
  regeneration → reopen loads what, exactly (`src/components/report/gallery/annotation-modal.tsx`,
  the annotations API under `/api/reports/[id]/photos`, `src/lib/storage/photos-server.ts`).
- Suspects to rule out in order: Save firing before the canvas serialises (async race), the
  second save overwriting with a canvas that was initialised from the RENDERED image instead of
  the stored `fabricJson` (classic lose-on-reopen), and the AI pipeline's damage-marker/annotated
  writes clobbering user annotations (same family as audit issue 18 — AI overwriting user input).
- The fix must make Save awaitable with visible success/failure feedback — silent failure is what
  burned the client on the call.

Related: 04 (editor rework) touches the same file — coordinate, land this bug first.

## Resolution (2026-09-22)

Status: fixed

### Root cause — three independent defects on the same round-trip

1. **The canvas was handed to the modal before the stored markings were back on it.**
   `annotation-canvas.tsx` called `onCanvasReady(canvas, exportFn)` synchronously, while the
   restore ran as `canvas.loadFromJSON(...).then(...)`. Any Save clicked inside that window
   serialised an *empty* canvas. The gallery page then sent `annotations: []`, and the API's
   `deleteMany` destroyed the stored `fabricJson` and nulled `annotatedUrl`. Irreversible, silent
   loss — this is the "reopen → Save → markings gone" the client hit. (Not the suspected
   "reinitialised from the rendered image": the modal always loaded `photo.url`, the original.
   The AI pipeline was also ruled out — it never writes the annotation rows.)

2. **Save was fire-and-forget.** `handleSave` called `onSave(...)` and then `onClose()` on the
   next line, so the modal closed before the PATCH had even started. The gallery page's handler
   ended in `catch { /* Annotation save failed silently */ }`. Every failure — offline, 500,
   403 on a locked report — looked exactly like success. This is why "clicking Save appears to
   do nothing".

3. **Shapes were persisted with `originX/originY: "center"`** (Fabric v7's default), while the
   drawing code wrote `left`/`top` as the top-left corner. Every marking rendered displaced by
   half its size from where it was drawn — visible data corruption, and the cause of ticket 04's
   "anchors at the centre". Proven from the stored payload: a rect dragged from (80,80) to
   (300,250) persisted as `left:80, top:80, originX:"center"` and drew half off-canvas.

### What changed

- `annotation-canvas.tsx` — `onCanvasReady`/`setReady` now fire **inside** the `loadFromJSON`
  `.then()` (and `.catch()`), so the canvas is never exposed while empty. The init effect no
  longer depends on `initialAnnotations`/`onCanvasReady` identity (refs instead), so a query
  refetch can't dispose and re-create the canvas mid-edit. Export now scales by
  `canvas.getWidth()` (CSS px) rather than `canvas.width` (device px), which was wrong on retina.
- `use-annotation-save.ts` (new) — owns the upload + PATCH round-trip, returns a promise and a
  `'idle' | 'saving' | 'saved' | 'error' | 'locked'` status. A 403 is reported as `locked`, not
  swallowed. Never uploads a rendered image for an empty canvas.
- `annotation-modal.tsx` — `handleSave` awaits the hook and **only closes on success**; the
  modal now owns persistence, so the gallery page no longer passes an `onSave` handler.
- `annotation-toolbar.tsx` — Save shows "Saving…" and is disabled in flight; success/failure/
  locked each render a visible message.

### Verified

Local stack, report `9c7c7d62`: draw → Save → reload → reopen → Save immediately (the exact
failing sequence) kept all 3 markings and `annotatedUrl` intact. E2E covers it in
`testing/e2e/20-annotations.spec.ts`.
