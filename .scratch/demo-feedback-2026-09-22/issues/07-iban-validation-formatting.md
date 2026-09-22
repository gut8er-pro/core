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
