# 34 — Business Information: website, e-mail and phone must be editable

Status: ready-for-agent
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
