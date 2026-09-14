# Spec: Make "Show missing information" actually highlight missing information

Status: ready-for-agent
Type: bug

> Feature slug: `show-missing-information`.
> Produced by `/triage` → `/grilling` → `/to-spec`. All decisions below were settled with the maintainer across four grilling rounds.

## Problem Statement

On the Report Details step of a report, a banner sits above the five tabs reading "Show missing information" with a toggle. Flipping it changes the sentence underneath it and nothing else. No field is highlighted, no section is flagged, nothing on the page reacts. This is identical across all four report types — HS, BE, KG and OT — because the toggle lives in the shared details layout that wraps all of them.

An assessor uses this control to answer one question: "what do I still have to fill in before this Gutachten is defensible?" Today the control answers nothing, and the numbers it does show are not trustworthy either — the count treats a section as complete as soon as any single field in it has a value, so a Vehicle tab reading "3/4" may have three fields filled out of sixteen.

## Solution

Wire the toggle to a real, per-report-type notion of completeness.

When the toggle is on, every required-but-empty field in the current tab is highlighted in amber, and every collapsible section header gains a badge counting the required fields still empty inside it — so an assessor can find the gaps without expanding all sections. The banner reports the total across the whole report, not just the visible tab. When the toggle is off the page looks exactly as it does today.

Underneath, completeness stops being a hand-rolled heuristic and becomes one declarative manifest: for each report type, which fields each tab requires. The tab badges, the section badges and the banner counter all derive from that single manifest, so the three numbers on screen can never disagree.

## User Stories

1. As an assessor, I want to toggle "Show missing information" and see empty required fields highlighted, so that I can find what is left to fill without reading every field.
2. As an assessor, I want the highlight to appear on the tab I am currently looking at, so that the feedback is immediate and local.
3. As an assessor, I want each collapsed section header to show how many required fields are still empty inside it, so that I do not have to expand every section to find the gaps.
4. As an assessor, I want the banner to tell me how many required fields are missing across the entire report, so that I know whether I am done overall and not merely done with this tab.
5. As an assessor, I want the highlight to use a colour distinct from validation errors, so that "not filled yet" does not read as "you entered something wrong".
6. As an assessor working on a Liability (HS) report, I want the required set to include accident day, scene and the opponent's insurer, so that the fields a liability claim depends on are enforced.
7. As an assessor working on an Evaluation (BE) report, I want accident and opponent fields excluded from the required set, so that I am not asked for data a valuation has no concept of.
8. As an assessor working on a Short Report (KG), I want the required set to skip the correction calculation, so that the toggle reflects what a KG actually needs.
9. As an assessor working on an Oldtimer (OT) valuation, I want market, replacement and restoration values required instead of repair and loss-of-use fields, so that the toggle matches the OT valuation flow.
10. As an assessor, I want the toggle to stay on as I move between the five tabs, so that I can sweep the whole report in one pass.
11. As an assessor, I want the toggle to reset to off when I reopen a report, so that a fresh report does not greet me with a wall of amber.
12. As an assessor, I want a section with no rows at all (no visits recorded, no tyre sets, no line items) to be flagged as missing, so that an entirely absent section is not silently treated as complete.
13. As an assessor, I want an existing row with empty required fields (a visit with no date, a tyre with no profile depth) to be flagged, so that a blank row I created by accident does not mark the section complete.
14. As an assessor, I want the tab badges to count sections the same way the banner counts fields, so that the two numbers tell a consistent story.
15. As an assessor, I want a section to count as complete only when all of its required fields are filled, so that the tab badge stops overstating my progress.
16. As an assessor whose claimant is represented by a lawyer, I want the lawyer field and lawyer signature to become required, so that the report captures the representation it claims.
17. As an assessor whose claimant is not represented, I want those same fields to stay optional, so that I am not asked for data that does not apply.
18. As an assessor, I want checkboxes never to be flagged as missing, so that I am not chased for a box whose unchecked state is a legitimate answer.
19. As an assessor viewing a locked report that has already been sent, I want the banner hidden entirely, so that I am not shown gaps in a read-only document I cannot edit.
20. As an assessor using a screen reader, I want missing fields announced as incomplete rather than invalid, so that flipping a review toggle does not report a hundred valid fields as errors.
21. As an assessor, I want the highlight to clear from a field as soon as I fill it, so that I can watch the remaining work shrink as I type.
22. As an assessor, I want the banner to tell me plainly when nothing is missing, so that I have a clear finish line.
23. As a developer, I want the required set expressed as one declarative manifest rather than scattered across section components, so that changing what a report type requires is a single edit.
24. As a developer, I want completeness computed by a pure function with no React or network dependency, so that all four report types can be covered by fast unit tests.
25. As a developer, I want the persistence schemas left permissive, so that autosave continues to accept partial drafts.

## Implementation Decisions

### Completeness manifest and engine (the one new seam)

- A new pure module owns both the required-field manifest and the function that evaluates it. It exports a manifest keyed by report type, then by tab, naming the required fields for each section; and a pure function taking the report type plus the five tabs' data and returning a missing-information report broken down by tab, by section and by individual field path.
- The function is pure: no React, no data fetching, no side effects. It is the single place any completeness question is answered.
- Required-ness is **not** expressed in the Zod persistence schemas. Those schemas are what the autosave PATCH endpoints parse, and every field in them is deliberately optional so partial drafts persist. Making fields required there would reject every autosave. Completeness is a separate concern from persistence validity and lives in its own module.
- The manifest supports three rule kinds beyond a plain required field:
  - **either/or** — satisfied when any one of a named group has a value (last name *or* company; email *or* phone).
  - **conditional** — required only when another field holds a given value (the lawyer field and the lawyer signature become required only when the claimant is marked as represented).
  - **array** — a section backed by rows is missing when it has zero rows, and each existing row contributes its own required fields.
- Boolean fields are never eligible to be required. Every boolean column in the database is non-nullable with a default, so "unchecked" and "never answered" are the same stored value and cannot be distinguished. Booleans may still *gate* a conditional rule; they can never themselves be reported missing.

### Reworking the existing completion hook

- The existing tab-completion hook is rewritten as a thin adapter over the new engine. It keeps its current return shape so the tab bar needs no change, but its hand-rolled per-tab heuristics are deleted.
- The definition of a complete section changes from "at least one field in this section has a value" to "every required field in this section has a value". This is intentional and will make existing reports display lower completion than they do today. That is the counter becoming honest, but it is a visible change to expect.
- Granularity stays split by surface: tab badges count **sections** (matching the design), the banner counts **fields**. Both derive from the same manifest, so they cannot contradict each other.

### Toggle state and distribution

- The toggle's state moves from bare local state into a React context provided by the details layout, wrapping its children. Route-scoped state that dies with the route, with the layout as the natural provider, and no manual reset needed. The repository currently has no `createContext` usage, so this introduces the pattern — deliberately, as the alternative (a global store) would be global state for something inherently local and would need explicit teardown to satisfy the reset-on-exit behaviour.
- State already survives tab switching today, because App Router preserves layout state across navigation between its child routes. That behaviour is retained.
- The toggle does **not** persist across reloads. It is a transient review mode, not a user preference, and defaults to off on every entry.
- When the report is locked, the entire banner is hidden rather than disabled. Highlighting fields nobody can edit is noise on a report already sent.

### Field-level rendering

- The shared field primitives gain an `isMissing` variant. This is a genuine reusable variant, not a per-screen override, so it is within what the project rules permit — those rules forbid editing base components to match one screen's design, and explicitly allow variants.
- The missing state renders in amber using the existing warning token family. No new design tokens are required.
- The missing state must be visually and semantically distinct from the existing error state. It must **not** set `aria-invalid` — that attribute means "the value is wrong", and applying it to a hundred perfectly valid empty fields on toggle would make a screen reader announce the whole form as invalid. Use a separate accessible affordance conveying "incomplete".
- When both states apply to one field, the error state wins. A wrong value is more urgent than an absent one.

### Call-site ergonomics

- Rather than hand-adding a prop at each of roughly 125 controls, introduce a field-props helper that each section component obtains from the context and spreads onto a control — returning the form registration, the error message, the missing flag and the blur handler in one object. The same three or four lines are already repeated verbatim at all 85 text-field call sites, so the helper pays for itself independently of this feature and turns the change into a mechanical substitution.
- Two helpers are needed, not one: text fields are registered through the form library's `register`, whereas select fields are controlled via `control`. They cannot share a single helper signature.

### Section header rendering

- The collapsible section primitive gains an optional missing-count badge, rendered only while the toggle is on. Section headers carry no badge today, and making them permanent would add standing visual noise across five tabs to serve a mode entered occasionally.

### Copy

- The banner strings are rewritten in both German and English at full key parity. The current "sections need attention" wording is replaced with field-based, explicitly report-wide wording, so the count cannot be misread as describing only what is on screen. The completed-state string stays, since it is already report-wide.
- Dead duplicate toggle state currently sitting unused in two of the five tab pages is deleted.

### Required-field manifest — agreed content

**Accident Info / Customer.** Accident day and scene for HS and KG only. For all types: last name or company, street, postcode, location, email or phone, vehicle make, licence plate. Involved lawyer required only when the claimant is marked as represented (not applicable to OT, which has no lawyer checkbox). Opponent last name or company, insurance company and insurance number for HS and KG only. Visits require at least one row, each row needing date, location and expert. Expert opinion requires expert name, file number, case date and issued date. Signatures require at least one data-permission signature carrying an image; a lawyer signature is required only under the same condition as the lawyer field.

**Vehicle.** Identical across all four types: VIN, manufacturer, main type, KBA number; first registration, power in kW, displacement, transmission, source of technical data; vehicle type, motor type, doors, seats. Previous owners is additionally required for BE and OT, where it bears on valuation.

**Condition.** For all types: mileage read, next MOT, vehicle colour, paint type, paint condition, previous damage reported, and at least one tyre set whose tyres each carry position, size and profile level. General condition, body condition, interior condition and driving ability are required for HS, BE and KG — see Open Questions for OT. At least one damage marker for HS and KG. At least one paint marker for HS, KG and OT.

**Calculation / Valuation.** HS: replacement value, residual value, tax rate, repair method, damage class, dropout group, cost per day, repair time in days, diminution in value. KG: the same minus diminution in value — see Open Questions. BE: general condition, taxation, data source, valuation date, and the maximum, average and minimum valuations. OT: market value, replacement value, restoration value, base vehicle value.

**Invoice.** All types: invoice number, date, recipient, fee schedule, and at least one line item.

This lands at roughly 60 required fields for HS, 45 for BE, 57 for KG and 50 for OT, against about 125 controls — so even an untouched report highlights at most around half a screen.

## Testing Decisions

A good test here asserts externally observable behaviour: given a report type and a set of saved data, which fields does the product consider missing, and does the UI reflect that. It does not assert on the shape of the manifest, on internal helper names, or on how the flag travels through React. The manifest is data, not behaviour — a test that restates it is a change-detector and should not be written.

**Primary seam — the completeness engine.** This is the one new seam, and it is deliberately the highest available: pure, synchronous, React-free, and the single place every semantic decision from this spec lives. Cover it directly with unit tests:

- All four report types, asserting that type-specific sections are required or excluded as specified (accident and opponent fields absent for BE and OT; repair and loss-of-use absent for OT; correction absent for KG).
- Either/or rules: satisfied by company alone, by last name alone, unsatisfied by neither.
- Conditional rules: the lawyer field and lawyer signature required only when the claimant is marked represented.
- Array rules: zero rows reported missing; one row with empty required fields reported missing; one complete row reported satisfied. The blank-visit case matters specifically — it is the loophole in today's behaviour.
- Boolean exclusion: no boolean field is ever reported missing regardless of its value.
- Section roll-up: a section counts complete only when all its required fields are filled, and the tab counts derived from it agree with the field counts.

Prior art: the co-located unit tests beside the Zod schemas in the validations directory, which follow the same pure-input/pure-output shape. Note that the existing tab-completion hook has **no** test today, so this work adds the first coverage of completeness logic in the codebase.

**Secondary seam — existing end-to-end report-type spec.** The Playwright spec that already drives all four report types through the details tabs is extended rather than replaced, so no new browser seam is introduced. It should cover: toggling on highlights empty required fields; toggling off clears them; the toggle survives switching tabs; filling a highlighted field clears its highlight; the banner is absent on a locked report.

**Deliberately not given their own seam.** The `isMissing` variant and the context carry no logic worth isolating — the variant is a class swap and the context is a boolean pass-through. Component-level tests for them would test React, not the product. If a rendering test is wanted, the existing co-located section component tests are the prior art to follow, but they are optional and should stay thin.

## Out of Scope

- **Making the Oldtimer grading and value-increasing-features sections persist.** Both are currently local component state with no database columns, so an OT report loses them on reload. This is a real data-loss bug discovered during triage, but it is a separate issue. Neither section can appear in the manifest until it persists, and both are excluded here.
- **Migrating boolean columns to nullable** so that "unanswered" becomes expressible for checkboxes. It would touch fourteen columns, every existing report row and the PDF's rendering of each, and none of those checkboxes are ones a Gutachten is invalid without. Raise separately if wanted.
- **A "jump to next missing field" affordance.** Not requested; the section badges already solve the find-the-gap problem.
- **Any change to the export, send or PDF surfaces.** Completeness does not gate sending, and a report with missing fields remains sendable.
- **Blocking or warning on save.** The toggle is advisory only.
- **Changing the permissive Zod schemas or the autosave contract.**

## Further Notes

The root cause of the original bug, for the record: the toggle's state was declared in the details layout and read by exactly two things — the sentence beneath it and the toggle's own checked prop. It was never passed down, never placed in a context, never placed in a store. Two of the five tab pages carried dead duplicate copies of the same state, underscore-prefixed to silence the unused-variable lint rule, which suggests the feature was started and abandoned. No highlight styling was ever built on the receiving end either.

Expect a visible regression in displayed completion when this ships. Reports that today show a healthy tab badge will show a lower one, because the section rule tightens from "any field filled" to "all required fields filled". This is the intended correction, but it is worth mentioning in any release note so it does not read as a new bug.

## Open Questions

Two items were still outstanding when this spec was written. Both have a stated default; confirm or correct before implementation.

1. **Which Condition fields does OT drop?** The architecture matrix describes OT's Vehicle Condition as "Reduced" without saying which fields are hidden. Default assumption: OT requires general condition, body condition, interior condition and driving ability exactly as the other types do. Correct the manifest if OT hides any of them — requiring a field the type never renders would make the report permanently un-completable.
2. **Does KG require diminution in value?** KG drops the Correction Calculation section, but diminution in value sits in Vehicle Value, not Correction, so it may still apply. Default assumption: KG does **not** require it.
