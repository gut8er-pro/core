# 27 — BVSK fee: automatic instead of manual (research only, per Ivan)

Status: ready-for-agent
Type: research
Severity: medium

Client: BVSK is manual today — the assessor opens the rate table and applies a bracket by hand.
It should populate automatically "po trenutnoj BVSK" (from the current BVSK survey). Ivan's
instruction: ONLY check what is possible for now, no implementation.

## Questions to answer

1. The in-app BVSK table already maps damage-amount brackets → base fee + additional fee
   (`bvsk-rate-table.tsx` + its data source). The report's damage amount exists once calculation
   is filled (repair cost / replacement value) — auto-selecting the bracket from it is pure
   in-app logic. Confirm which figure legally drives the bracket (Schadenhöhe = repair cost net,
   or WBW on total loss) — that rule is the crux, likely repair-cost-net vs replacement-value
   minus residual on total loss.
2. Data currency: is the embedded table the CURRENT BVSK-Honorarbefragung (2024/2026?), and is
   there any licensed feed/API for updates, or is periodic manual refresh of the table the only
   option? (BVSK publishes the Honorarbefragung to members; there is no public API — verify.)
3. Proposal shape if feasible: when calculation is complete, pre-fill the Grundhonorar default
   row (ticket 26) from the auto-selected bracket, visibly labelled with the bracket, still
   editable; the red no-repair-cost warning the table already shows becomes the empty state.

Deliverable: findings + recommendation appended here, then Ivan decides go/no-go with the
client.

## Findings (2026-09-22)

### 1. Which figure drives the bracket (the legal answer)

The BVSK survey itself defines it, verbatim in the legend of both the
[Honorarbefragung 2022](https://www.onecrash.de/download/BVSK-Honorartabelle.pdf) and the
[Honorarbefragung 2024](https://www.burkard.legal/law-burkard-legal/downloads/hon-2024_gesamt_final_20250212.pdf)
(Kurzerläuterungen, p. 5):

> „Die Schadenhöhe, an der sich das Grundhonorar üblicherweise orientiert, wird
> übereinstimmend definiert als Reparaturkosten netto (ohne Abzug einer ermittelten
> Wertverbesserung) zzgl. einer ermittelten merkantilen Wertminderung und im
> Totalschadenfall (technisch oder wenn die Reparaturkosten zuzüglich einer etwaigen
> merkantilen Wertminderung den Wiederbeschaffungswert übersteigen) als
> Wiederbeschaffungswert brutto."

So, corrected against the ticket's hypothesis:

- **Repair case:** Schadenhöhe = **Reparaturkosten netto + merkantile Wertminderung**
  (our `diminutionInValue`). No deduction of Wertverbesserung.
- **Total loss (technical, or repair cost + Wertminderung > WBW):** Schadenhöhe =
  **Wiederbeschaffungswert brutto** — NOT WBW minus Restwert. The Restwert plays no role
  in the fee bracket; the "WBW − Restwert" (Wiederbeschaffungsaufwand) idea is wrong for
  BVSK purposes. The 2024 survey adds that even in 130%-rule cases the WBW brutto is
  predominantly used.
- **Lesart:** the next-higher "bis zu" step applies — a Schadenhöhe of 1.000,01 € falls in
  the "bis 1.250" bracket, not "bis 1.000".

Case law backs fee-by-damage-amount as such: BGH X ZR 122/05 (04.04.2006, fee scaled to
Schadenhöhe permissible for routine Gutachten),
[BGH VI ZR 225/13 (11.02.2014)](https://dejure.org/dienste/vernetzung/rechtsprechung?Gericht=BGH&Datum=11.02.2014&Aktenzeichen=VI+ZR+225/13)
(BVSK-Honorarbefragung is a suitable § 287 ZPO estimation basis for the Grundhonorar), and
[BGH VI ZR 50/15 (26.04.2016)](https://www.captain-huk.de/wp-content/uploads/rechtsprechung/urteile/sv-honorar/BGH_VI_ZR_50-15.pdf)
(Nebenkosten oriented at JVEG rates — which is why BVSK stopped surveying Nebenkosten; the
2024 edition cites BGH VI ZR 280/22 of 12.03.2024 to the same effect and lists customary
Nebenkosten: Fotos 2,00 €/Stück, Schreibkosten 1,80 €/Seite, Porto/Telefon pauschal 15 €,
Fahrtkosten ≥ 0,70 €/km — exactly ticket 26's default rows).

**In-app reality check:** the driving figure mostly does not exist yet. Post-calculation we
have `replacementValue` (WBW), `residualValue`, `diminutionInValue`, `taxRate` on the
`Calculation` model — but **no net repair cost anywhere**. `datCalculationResult` stores only
the DAT modal's settings (location, dekraUsed, three hourly rates), the correction result
cards are hardcoded `"—"` (`calculation/page.tsx` lines 320–321), and `correctionResultWithout/With`
exist in form types but are never populated or persisted. On top of that the invoice page
renders `<BvskRateTable onApplyRate={...} />` **without ever passing `repairCost`**
(`src/app/(app)/reports/[id]/details/invoice/page.tsx` line 195), so the bracket highlight
and the Apply button are dead paths today — the red warning always shows. Auto-selection
therefore needs a repair-cost-net source first: either a manual `repairCostsNet` field in the
Repair section or the total from a real DAT calculation once that lands.

### 2. Data currency: the embedded table matches NO published BVSK survey

Compared against the official tables:

| Bracket | App (`BVSK_RATES`) | BVSK 2022 HB V Korridor | BVSK 2024 HB V Korridor |
|---|---|---|---|
| bis 500 | 312 + 50 | 230–282 | 265–306 |
| bis 750 | 362 + 65 | 267–315 | 300–340 |
| bis 1.000 | 427 + 75 | 312–370 | 354–399 |
| top bracket | 40.000–50.000: 3.317 | 47.500–50.000: 3.123–3.595 | 47.500–50.000: 3.464–3.738 |

- The app's values match neither survey year. The `baseFee`/`additionalFee` pair is not a
  BVSK structure at all (each `baseFee` is exactly the previous `baseFee + additionalFee` —
  an arithmetic construction; BVSK publishes HB I–IV columns plus an HB V corridor von/bis).
- The bracket boundaries are wrong too: BVSK uses 250-€ steps up to 6.000 €, then 500-€ and
  1.000-€ steps; the app jumps 1.000→1.500→2.000 and 8.000→10.000→12.500.
- `lookupBvskRate` silently clamps anything above 50.000 € to the last bracket; per BVSK the
  table ends at 50.000 € and beyond that (Spezialgutachten) hourly rates of 150–200 € net
  apply.
- Currency status: **Honorarbefragung 2024 is the current edition** (published Feb 2025,
  [BVSK announcement](https://neu.bvsk.de/presse-und-positionen/honorarbefragung-2024-veroffentlicht));
  the 2026 survey is expected but not yet published as of today. Cadence is every ~2 years.

**Feed/API: none.** Distribution is a terms-gated PDF download plus the member-facing
[honorarrechner.bvsk.de](https://honorarrechner.bvsk.de/) web calculator (no documented API).
Worse, the 2024 Nutzungsbedingungen (p. 6–7 of the survey PDF) expressly prohibit, without
BVSK's consent: modification of the work, publication of the tables (even in part), and —
verbatim — „die Nutzung der Honorarbefragung 2024 ohne Zustimmung des BVSK **innerhalb einer
Software zur Berechnung des Sachverständigenhonorars oder zum Aufbau einer Datenbank**".
Competitors (e.g. [autoiXpert](https://wissen.autoixpert.de/hc/de/articles/360027647432-Eigene-Honorartabelle))
ship BVSK/VKS/HUK tables embedded — i.e. this is licensable in practice — and additionally
offer a user-maintained "eigene Honorartabelle". So the options are: (a) obtain BVSK's
Zustimmung and refresh manually every ~2 years, or (b) let each assessor maintain their own
fee table (they may lawfully use the survey „zum eigenen Gebrauch", including for their own
Preisvereinbarung — practitioners publish exactly such tables, e.g.
[this one](https://zarfl-net.de/wp-content/uploads/2025/02/Preistabelle-fuer-Auftragsbestaetigung-BVSK-2024.pdf)).
Periodic manual refresh is the only update mechanism either way.

### 3. Recommendation

**Go — build the auto-fee, but fix the data and its source first.** Concrete shape:

1. **Schadenhöhe derivation** (pure function, `src/lib/utils/invoice-calculations.ts`):
   `repairCostsNet + diminutionInValue`, switched to `replacementValue` (gross) when
   total-loss (repairCostsNet + diminutionInValue > replacementValue, or a manual total-loss
   flag). Bracket lookup per "nächsthöhere Schadenstufe"; above 50.000 € no auto-fee —
   show the Spezialgutachten hint instead of clamping. HS/KG only (BE/OT invoices are not
   damage-bracket-driven).
2. **Data source:** add `repairCostsNet` to `Calculation` (filled manually in the Repair
   section now, by DAT later). Without it the feature has nothing to drive it — this is the
   real prerequisite, not the UI.
3. **Table data:** replace `BVSK_RATES` with the real HB V corridor structure
   (`von`/`bis` per bracket, survey-year tagged, 250/500/1000-€ steps). Ship it only after
   the licensing question is settled with BVSK; until then seed it as the user's own
   editable fee table (Settings → Templates), defaulting empty or user-imported. Do not
   ship the current synthetic numbers labelled "BVSK" — they are wrong at every bracket and
   contractually risky.
4. **Pre-fill (ticket 26 interplay):** when calculation is complete, auto-select the bracket
   and write the **Grundhonorar default row** (never insert a duplicate — today's
   `handleApplyBvskRate` blindly overwrites `lineItems.0`), visibly labelled e.g.
   „BVSK HB V (2024), Schadenhöhe bis 1.250 €" in the row's `specialFeature`, amount fully
   editable; manual edit sticks (don't re-overwrite on recalculation without asking).
5. **Empty state:** the existing `bvskRateWarning` („…erst zuordnen, wenn die
   Reparaturkosten feststehen") stays as-is and becomes truthful once `repairCost` is
   actually passed — today it shows unconditionally because the invoice page never wires it.

**Effort:** core feature (derivation util + `repairCostsNet` field + auto-select + default-row
pre-fill + empty state + tests, on top of ticket 26's default rows) — **M**. If BVSK licensing
is declined and we add a per-user editable fee-table editor in Settings instead — **+M
(total L)**. The licensing contact itself is a non-engineering task for Ivan/the client.

Sources: [BVSK-Honorarbefragung 2024 (full survey PDF)](https://www.burkard.legal/law-burkard-legal/downloads/hon-2024_gesamt_final_20250212.pdf) ·
[BVSK-Honorarbefragung 2022 (full survey PDF)](https://www.onecrash.de/download/BVSK-Honorartabelle.pdf) ·
[BVSK announcement of the 2024 survey](https://neu.bvsk.de/presse-und-positionen/honorarbefragung-2024-veroffentlicht) ·
[BVSK Honorarrechner](https://honorarrechner.bvsk.de/) ·
[BGH VI ZR 225/13](https://dejure.org/dienste/vernetzung/rechtsprechung?Gericht=BGH&Datum=11.02.2014&Aktenzeichen=VI+ZR+225/13) ·
[BGH VI ZR 50/15](https://www.captain-huk.de/wp-content/uploads/rechtsprechung/urteile/sv-honorar/BGH_VI_ZR_50-15.pdf) ·
[Practitioner Preisvereinbarung nach BVSK 2024](https://zarfl-net.de/wp-content/uploads/2025/02/Preistabelle-fuer-Auftragsbestaetigung-BVSK-2024.pdf) ·
[autoiXpert: eigene Honorartabelle](https://wissen.autoixpert.de/hc/de/articles/360027647432-Eigene-Honorartabelle) ·
[die-kfzgutachter.de Ratgeber BVSK-Honorartabelle](https://die-kfzgutachter.de/ratgeber/bvsk-honorartabelle-gutachter.htm) ·
[VKS Honorartableau (alternative survey)](https://vks-24.de/honorartableau-honorarumfrage/)
