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
