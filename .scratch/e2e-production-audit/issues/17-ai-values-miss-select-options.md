# 17 — AI auto-fill writes values that match no select option

Status: ready-for-human
Type: bug
Severity: medium

Surfaced twice during the 2026-09-15 pass, by two independent streams. The AI answers with
free-form English grades while the target `<select>`s expect fixed option values, so the stored
value matches nothing. Since today's fix to `src/components/ui/select.tsx` the control at least
falls back to its placeholder instead of rendering blank — but the AI's answer is still silently
unusable and the assessor re-enters it by hand.

## Cases

1. `src/lib/ai/interior-analyzer.ts` writes `Excellent | Good | Fair | Poor` into
   `interiorCondition`; the Condition tab's options are
   `Clean, no structural damage. | Minor wear | Significant wear`.
2. The calculation extractor returns `"Required"` / `"Spot repair"` for `wheelAlignment`,
   `bodyMeasurements`, `bodyPaint`; the selects expect `required | not_required | partial | full`.

## Fix direction

Constrain the prompts to the exact option enums (the calculation extractor already went
locale-aware today — extend its response schema instructions), and add a defensive mapping at the
write site so near-miss synonyms land on a real option value instead of passing through raw.
Bump the affected `promptVersion`s so cached rows re-run (the AiResult cache keys on it).

Note the option lists themselves are defined in the respective section components; treat those as
the source of truth rather than duplicating literals in the AI layer.

## Resolution

Status: ready-for-human

Per-field decision. The ticket said to use judgment: a field that stays a hard `<select>` gets a
constrained enum, a field becoming an editable combobox in `demo-feedback-2026-09-22/issues/17`
keeps natural language. Option lists were read from the section components, not invented.

| Field | Control (source of truth) | Decision | AI now emits |
|-------|---------------------------|----------|--------------|
| `wheelAlignment` | `SelectField`, `repair-section.tsx` | **enum** | `required` / `not_required` / `completed` |
| `bodyMeasurements` | `SelectField`, `repair-section.tsx` | **enum** | same three |
| `bodyPaint` | `SelectField`, `repair-section.tsx` | **enum** | `not_required` / `partial` / `full` |
| `vehicleType` | `SelectField`, `details-section.tsx` | **enum** | the seven body-type keys (see issue 14) |
| `interiorCondition` | becoming `ComboField`, `condition-section.tsx` | **preset phrases** | `Clean, no structural damage.` / `Minor wear` / `Significant wear` |
| `generalCondition`, `bodyCondition`, `paintType`, `paintCondition`, `drivingAbility` | becoming `ComboField` | **preset phrases, unchanged** | already matched, `overview-analyzer.ts` validated them since the Audi pass |
| `repairMethod` | `TextField` | **free text, per locale** | German prose under `de`, English under `en` |
| `risks` | `textarea` | **free text, per locale** | same |
| `damageClass` | `TextField` | **free text** | Roman numeral I–IV |

Why `interiorCondition` is a preset phrase rather than free text even though the control becomes
editable: the combobox displays whatever it is given, but only the three preset values have keys
in `valueTranslations` (`src/lib/pdf/translations.ts`), so anything else reaches a German
Gutachten in English. Presets keep the PDF localizable; the assessor can still type over them.

### Changes

- **`src/lib/ai/option-values.ts`** (new) — the option values mirrored from the section
  components, each list commented with the file it came from, plus `normalizeRepairOperation` /
  `normalizeBodyPaint`. The mappers are the defensive write-site layer the ticket asked for: they
  take near-miss synonyms in both languages ("Spot repair", "Panel repaint", "Beilackierung",
  "erforderlich", "durchgeführt") onto a real option value, and return **null** for anything they
  cannot place rather than passing raw prose through.
- **`calculation-extractor.ts`** — the prompt names the exact identifiers and adds "these are
  stored identifiers, not prose — emit them exactly as spelled, in every language"; the DE locale
  suffix now says the same. The parser routes the three fields through the mappers.
- **`interior-analyzer.ts`** — the prompt asks for the three Condition-tab phrases;
  `normalizeInteriorCondition` maps the legacy Excellent/Good/Fair/Poor grades that cached rows
  and the occasional slip still carry (Excellent+Good → Clean, Fair → Minor wear, Poor →
  Significant wear).

`interior-analysis` promptVersion 3→4 so cached rows re-run. `calculation-extractor` has no
promptVersion — it is not photo-keyed, so it is not in the `AiResult` cache and needs no bump.

### Evidence

`src/lib/ai/option-values.test.ts` (14 tests) covers both mappers, the exact audit payload, the
German branch, and the null-rather-than-raw-text rule. The live Generate run stored
`wheelAlignment: "required"`, `bodyMeasurements: "not_required"`, `bodyPaint: "partial"` — real
option values where the audit saw `"Required"` and `"Spot repair"`.

Note for whoever lands `demo-feedback-2026-09-22/issues/17`: `option-values.ts` mirrors literals
from the section components. If an option list changes there, that file has to change with it.
