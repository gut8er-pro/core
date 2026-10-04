# 42 — CollapsibleSection unmounts collapsed children, so their effects never run

Status: done
Type: bug (latent, systemic)
Severity: medium

Found while fixing ticket 20: `CollapsibleSection` renders children inside a Radix
`AccordionContent` without `forceMount`, so a collapsed-by-default section's children are
UNMOUNTED — any effect that creates data, registers fields or seeds defaults simply never runs
until a human expands the card. The Tires auto-create was the first victim (fixed with a
client-side placeholder); the hazard is general.

Direction: audit the other collapsed-by-default sections (prior damage, opponent, visits,
expert opinion, signatures) for effects/registrations that assume they mount, and either give
`CollapsibleSection` an opt-in `forceMount` (render hidden, keep mounted) for those, or move
the data-seeding effects up to the page level where they always run.

## Resolution (2026-10-04)

Audited every `CollapsibleSection` that is collapsed by default — vehicle details and
specification, expert opinion, visits, opponent, value-increasing features, damage diagram,
prior damage, tires. (Signatures is `defaultOpen`.) **No current victim.** Only what is passed
as `children` is unmounted; the section component itself always mounts, and every effect that
creates or keeps data in step lives in that body:

- Tires auto-create (`tire-section.tsx`) is in `TireSection`'s body, outside `children` — it runs
  while the card is collapsed. Ticket 20's cause 1 does not hold for the current code; the empty
  card it saw was cause 2 (the round-trip), already fixed by the placeholder set.
- Vehicle grading's `gradingOverall` sync is likewise in the section body (and the card opens by
  default).
- Effects inside `children` are UI-only: focus on edit (`custom-value-pill`, damage marker
  popover), outside-click dismiss (grading picker), and `TirePositionFields` adopting the
  server's tyre into local state — which starts from that tyre anyway, so mounting late loses
  nothing.
- Visits' `useFieldArray` is in the section body; address seeding fires on a type pick, not on
  mount. The kW/PS `querySelector`s run in those inputs' own blur handlers.
- No form uses `shouldUnregister`, so unmounted inputs keep their values for autosave and the
  completeness engine.

So no `forceMount` was added — nothing would use it. Instead the contract is pinned:

- `CollapsibleSection` JSDoc states that collapsed children do not mount and that must-run
  effects belong in the rendering component.
- `collapsible-section.test.tsx`: a child effect waits for the first expand; the rendering
  component's effect runs while collapsed.
- `tire-section.test.tsx` (new): the first tire set is auto-created while the card is still
  collapsed.
