# 15 — Source of technical data: two presets + free entry

Status: done
Type: feature
Severity: low

"Source of technical data" (vehicle tab) is a plain text input today. Wanted: a combobox with
two predefined choices — **Documents original** and **Document copy** — AND free manual entry
(the user can still type anything, e.g. "DAT SilverDAT3").

## Direction

- An editable-combobox pattern: input with a suggestions dropdown (the two presets, translated
  in both locales), typing stays free-form; the stored value remains a plain string so the API,
  zod and PDF need no change.
- Field lives in `src/components/report/vehicle/specification-section.tsx`
  (`sourceOfTechnicalData`); keep the existing autosave-on-blur wiring.
- No select-enum here on purpose — the client explicitly asked for presets PLUS free text, and a
  Radix Select cannot type. A small `ComboField` primitive in `src/components/ui/` is fine if
  other fields later want the same (candidate: the visit expert name).

## Resolution

Done. `sourceOfTechnicalData` in `src/components/report/vehicle/specification-section.tsx` is now
the shared `ComboField` primitive instead of a `TextField`.

- Two presets, translated in both locales, under
  `report.vehicle.identification.technicalDataSourceOptions` — "Documents original" /
  "Dokumente im Original" and "Document copy" / "Dokumentenkopie".
- Free text still works: typing is unrestricted and the dropdown is only a suggestion list.
- The stored value stays a plain string, so the API, zod schema and PDF template needed no change.
- Autosave-on-blur preserved via `onBlur={() => onFieldBlur?.('sourceOfTechnicalData')}`; picking a
  preset also fires it, so a click saves without needing a second blur.
- `name="sourceOfTechnicalData"` is kept on the input so the e2e `fillInput` helper and the
  `12-hs` / exhaustive specs keep resolving it unchanged.

### Autosave bug found and fixed during verification

The first cut passed every unit test but silently dropped typed values. `onValueChange` called
`setValue(...)` without `{ shouldDirty: true }`, and the vehicle page's debounced watcher bails on
`if (!dirtyFields[name]) return`. The old `TextField` went through `register()`, which marks dirty
automatically; a controlled `setValue` does not. Result: typing saved nothing unless a real blur
landed, so `fill()` → reload came back empty — the same silent data-loss shape as ticket 02.

It hid from the unit tests because the blur path still worked; only the debounced change path was
broken. `specification-section.test.tsx` now asserts the field is marked dirty on change, and that
test fails if `shouldDirty` is removed (verified by reverting the fix). `06-save-reload.spec.ts:34`
("vehicle fields persist after reload") was failing on this and is the e2e guard.

Note on stored values: both `value` and `label` are the translated string, so a report filled in
German stores the German wording. That follows from the free-text requirement (the field has always
held an arbitrary string) and was confirmed as intended. If locale-stable storage is ever wanted,
the presets need stable values with translated labels only — a one-line change.
