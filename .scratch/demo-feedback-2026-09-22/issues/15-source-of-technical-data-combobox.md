# 15 — Source of technical data: two presets + free entry

Status: ready-for-agent
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
