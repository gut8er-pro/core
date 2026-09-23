# 06 — Vehicle owner section when claimant is not the owner

Status: ready-for-agent
Type: feature
Severity: medium

"Is the vehicle owner" stays checked by default (claimant owns the car — unchanged). When the
assessor UNCHECKS it, a new "Fahrzeughalter" section must appear below with the same shape of
information as the claimant block (Ivan said "dropdown sa istim informacijama kao claimant
information" — an expanding section with the claimant field set, not a select).

## Direction

- Fields mirroring the claimant block: company, salutation, first/last name, street, postcode,
  location, email, phone (skip IBAN/tax fields unless Ivan says otherwise — they are payment
  properties of the CLAIMANT).
- Additive storage: either columns on `ClaimantInfo` prefixed `owner*` or a small `OwnerInfo`
  table keyed by reportId like `OpponentInfo` — prefer the table, it is the same pattern the
  codebase already has for opponent.
- Zod + PATCH mapping in `/api/reports/[id]/accident-info`, form section in
  `src/components/report/accident-info/claimant-section.tsx` (conditional on
  `!claimantIsVehicleOwner`), `*FromApi` mapping, PDF block, and completeness: owner fields
  required only while the checkbox is unchecked (`when`-rule in the manifest, same mechanism as
  the lawyer signature).
- Applies to all four report types (the checkbox exists on HS/BE/KG; OT has it too).

## Resolution (2026-09-22)

Status: done.

Stored in its own `OwnerInfo` table keyed by `reportId`, the same pattern as `OpponentInfo`
(the schema was applied by the orchestrator).

- `src/components/report/accident-info/owner-fields.tsx` (new) — the "Fahrzeughalter" block,
  rendered inside the claimant section while `claimantIsVehicleOwner` is unchecked, on all four
  report types. Mirrors the claimant shape: company, salutation, first/last name, street,
  postcode, location, email, phone. No IBAN and no tax fields — those stay payment properties
  of the claimant, as the ticket directed.
- `src/lib/validations/accident-info.ts` — `ownerInfoSchema` + `ownerInfo` on the patch schema.
- `src/app/api/reports/[id]/accident-info/route.ts` — GET returns `ownerInfo`; PATCH upserts it
  exactly like `opponentInfo`.
- The details page routes `owner*` form fields to `ownerInfo.*`. Note the prefix check runs
  before `opponent`, and the two do not collide (`opponent` does not start with `owner`).
- `src/lib/completeness/manifest.ts` — a `when claimantIsVehicleOwner === false` rule requiring
  last-name-or-company plus street/postcode/location. Unchecking the box asserts a Halter
  exists, so the report has to say who; while it stays checked nothing is asked.
- `src/lib/completeness/server.ts` — `ownerInfo` added to `COMPLETENESS_INCLUDE` and passed to
  the mapper, or the server gate would have reported the owner missing forever.

For wave 2 (PDF): the owner arrives as a top-level `ownerInfo` object on the accident-info GET.

### Gotcha for anyone picking this up

Adding `prisma.ownerInfo` / `include: { ownerInfo: true }` makes every accident-info GET return
500 until the **dev server is restarted** — a long-running `next dev` keeps the Prisma client it
loaded at boot, so a client regenerated afterwards is not picked up. The symptom is confusing:
PATCH returns 200 and the row really is written, but the reload reads back empty, which looks
exactly like "the claimant block no longer persists". `Unknown field \`ownerInfo\` for include
statement on model \`Report\`` in the dev log is the tell. Restarting `next dev` fixes it.

## PDF part (2026-09-23) — done

The wave-1 note said "for wave 2 (PDF): the owner arrives as a top-level `ownerInfo` object".
It is now rendered.

`AccidentInfoSection` prints a **Fahrzeughalter / Vehicle Owner** block after the claimant (and
after the lawyer block when there is one), gated on `claimantInfo.isVehicleOwner === false` —
the same condition that reveals the form section, so the PDF says what the screen says. Name,
company, address, email and phone; no IBAN and no tax fields, matching the form. `ownerInfo` is
included in the generator's query and mapped onto `ReportData`.

Verified live with the box unchecked:

```
Fahrzeughalter
Name       Frau Petra Halter
Firma      Fuhrpark GmbH
Adresse    Werksstraße 8, 28199, Bremen
E-Mail     halter@fuhrpark.test
```
