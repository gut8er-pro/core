# 34 — Business Information: website, e-mail and phone must be editable

Status: done
Type: bug
Severity: medium

Settings → Business shows Website, Email and Phone number inputs, but they cannot actually be
changed — the values in the screenshot are PLACEHOLDERS (www.kfz.de, sales.contact@kfz.com,
+3513331253), and the `Business` model has no columns behind them (`companyName, street,
postcode, city, taxId, vatId, logoUrl` only). Inputs with no storage = another
looks-real-but-isn't case.

## Direction

- Additive columns on `Business`: `website String?`, `email String?`, `phone String?` +
  migration (auto-applies on deploy).
- Zod (`src/lib/validations/settings.ts` business schema), settings GET/PATCH mapping
  (`/api/settings`), and register the three inputs in the Business form in
  `src/app/(app)/settings/[[...tab]]/page.tsx` — they are likely rendered but unregistered.
- These fields belong on the report PDF's sender/letterhead block and on the invoice sender
  block — wire them wherever business data already prints (coordinate with tickets 25/30).
- The phone placeholder should become a German-looking example (+49 …), while at it.

## Resolution

Confirmed exactly as filed — the three inputs were rendered `disabled` with hardcoded
placeholders and no `register()` call, so they could not be typed into and had nothing
behind them.

- `Business.website / email / phone` already existed on the schema (added ahead of this
  work), so no migration was needed and none was written.
- `businessSettingsSchema` gained the three fields: `website` and `phone` as bounded
  optional strings, `email` optional but validated as an address when non-empty.
- `/api/settings` GET and PATCH select and upsert all three (all three select blocks).
- `UserSettings['business']` in `use-settings.ts` carries them; the Business form's `reset()`
  seeds them from the loaded settings.
- The three `TextField`s are now enabled and registered, with German placeholders:
  `www.kfz-gutachten.de`, `kontakt@kfz-gutachten.de`, `+49 30 12345678`.
- Letterhead/invoice sender rendering deliberately untouched — the export agent owns those.

E2E (`03-settings`) fills all three, saves, reloads and asserts the values persist, and
asserts the phone placeholder starts with `+49`.

## PDF part (2026-09-23) — done

The three columns are now on the report PDF's sender block. `LetterheadSection` in
`src/lib/pdf/report-template.tsx` prints the business name, the expert's name and the street /
postcode + city on the left, and **phone, email and website** right-aligned opposite — the
conventional German letterhead shape. It sits above the report header on page 1, and above the
invoice when the invoice is sent standalone, so an invoice-only document still says who sent it.

Each line is omitted when its column is null, and the whole block disappears when the user has
no business record, so nothing renders as an empty row.

`generate-buffer.ts` now selects `street`, `postcode`, `city`, `website`, `email` and `phone`
from `Business` alongside `companyName`.

Verified live:

```
                                             +49 30 73483
Ivan Vukasinovic                             kontakt73483@kfz-gutachten.de
Hauptstraße 1, 10115 Berlin                  www.kfz-73483.de
```
