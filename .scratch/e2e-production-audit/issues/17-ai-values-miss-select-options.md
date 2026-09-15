# 17 — AI auto-fill writes values that match no select option

Status: ready-for-agent
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
