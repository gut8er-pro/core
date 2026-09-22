# 07 — IBAN: German validation + live formatting

Status: ready-for-agent
Type: feature
Severity: medium

The claimant IBAN field accepts anything. German IBANs are exactly 22 characters
(`DE` + 2 check digits + 18 digits) and the client wants the input to format itself so it always
"looks visually perfect".

## Direction

- Live formatting as-you-type: groups of four (`DE89 3704 0044 0532 0130 00`), placeholder in the
  same shape, uppercase, strip stray spaces on save (store normalised, display grouped).
- Validation in zod (`src/lib/validations/accident-info.ts`): length/shape for DE plus the
  MOD-97 checksum (cheap to implement, catches real typos — that is the whole point of IBAN
  check digits). Non-DE IBANs: accept valid-by-checksum ones of other lengths rather than
  hard-blocking, but the placeholder and grouping stay German.
- Same treatment wherever IBAN appears: claimant section and business settings
  (`src/app/(app)/settings/[[...tab]]/page.tsx` business tab) — one shared input component or
  format helper in `src/lib/utils/`.
- Error copy in both locales.

## Resolution (2026-09-22)

Status: done for the report IBANs. Business settings: not applicable — see the finding below.

- `src/lib/utils/iban.ts` (new) — `normalizeIban` (uppercase, strip non-alphanumerics),
  `formatIban` (groups of four, capped at the ISO 13616 maximum of 34) and `isValidIban`
  (structure + the country's own length where known + the MOD-97 check digits). 13 unit tests
  in `iban.test.ts` cover German, Austrian, British and French IBANs, a transposed check digit
  and wrong lengths.
- `src/components/report/accident-info/iban-field.tsx` (new) — regroups as you type and, on
  blur, shows "Please enter a valid IBAN" / "Bitte eine gültige IBAN eingeben" when the
  checksum fails. Used by both the claimant and the opponent IBAN.
- `src/lib/validations/accident-info.ts` — the `iban` schema now normalises (stores without
  spaces) and rejects a failing checksum; an empty value clears to null rather than erroring.
  Applies to the claimant and the opponent alike.
- `form-data.ts` reads the stored value back through `formatIban`, so the field displays
  grouped while the column stays normalised.

**Out of scope, flagged:** the business settings tab has no IBAN field and `Business` has no
`iban` column, so there was nothing to wire there. Adding one needs a schema change, which was
outside this ticket's remit. Ivan should confirm whether the business IBAN is wanted at all.
