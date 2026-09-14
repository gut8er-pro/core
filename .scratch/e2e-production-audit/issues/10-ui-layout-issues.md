# 10 — UI / layout issues (consolidated)

Status: ready-for-agent
Type: bug
Severity: low–medium

All layout, sizing, spacing and affordance defects found in the production sweep, in one ticket as
requested. Every measurement below was taken from the live DOM (`getBoundingClientRect`,
`scrollWidth` vs `clientWidth`, canvas-measured text width vs available input width), not estimated
from a screenshot.

Checked at **1440×900** and re-checked at **1280×800**, in German.

## Screenshots

Annotated crops — red boxes mark the measured region — are in
[`../ui-screenshots/`](../ui-screenshots/), one file per defect, named by the section codes used
below (`A1-…`, `B1-…`, `C1-…`). Full-page originals are in `.playwright-mcp/` (gitignored).

| Section | Files |
|---|---|
| A. Clipped text | `A1-risiken-input-clipped`, `A2-social-placeholders-clipped`, `A4-wiederbeschaffungswert-clipped`, `A5-leistungsbeschreibung-clipped` |
| B. Overflow | `B1-bvsk-table-overflow`, `B2-tabbar-overflow-1440`, `B2-tabbar-overflow-1280` |
| C. Alignment | `C1-vin-row-misaligned`, `C2a-zahlung-einrichten-wraps`, `C2b-vorlage-hinzufuegen-wraps`, `C3-notifications-container`, `C4-signature-canvas-offset`, `C5-menu-below-fold` |
| D. Affordance | `D1-logo-upload-contrast`, `D3-bvsk-warning-icon`, `D4-duplicate-save-cancel`, `D7-empty-dropdown` |
| E. Copy | `E1-dropzone-format-mismatch`, `E3-leer-empty-state`, `E4-nonsense-placeholders`, `E5-labels-run-together` |
| Cross-filed | `issue07-betrag-always-zero`, `issue09-restaurierungswert-button`, `B2-legal-english-signature`, `i18n-standard-view` |

---

## A. Text clipped inside its own control

| Where | Content | Overflow | Control width |
|---|---|---|---|
| Calculation → **Risiken** | AI prose "Multiple hail dents visible across hood and po…" | **1185 px** | 379 px |
| Settings → Profil → Facebook | `facebook.com/benutzername` | 19 px | 265 px |
| Settings → Profil → LinkedIn | `linkedin.com/benutzername` | 6 px | 265 px |
| Invoice → line item | `Leistungsbeschreibung` | 18 px | — |
| Calculation → Wiederbeschaffungswert | `Wert hinzufügen` → renders "Wert hinzufüg" | 8 px | 182 px |

**Risiken is the serious one.** It is a single-line `<input>` holding multi-sentence AI output —
roughly three quarters of the text is unreachable without keyboard-scrolling inside the field.
It should be a `<textarea>`.

The two social fields are 265 px while every other field in the same form is 409 px; they are
fixed-width, so this is identical at 1280.

The Wiederbeschaffungswert input is squeezed by its `€` prefix plus the adjacent 19 % dropdown.

---

## B. Containers overflowing

**B1 — BVSK fee table (Invoice tab).** The worst offender.

```
div.overflow-x-auto : scrollWidth 1156  vs  clientWidth 816   → 340 px hidden
inner div.flex.flex-1 escapes its parent's content box by 340 px
8 descendant elements lay out past the viewport (right edges 1467 … 1631 at vw=1440)
```

The 2.500 / 3.000 / 4.000 € damage brackets and their fees (797,00 €, 917,00 €) are scrolled out
of sight. It *is* `overflow-x: auto` so it can be scrolled — but there is no scrollbar, gradient or
any other affordance, so it reads as a table that has simply been cut off. Identical at 1280.

**B2 — Report Details tab bar.**

```
1440: scrollWidth 968 vs clientWidth 906 → 62 px hidden, "Rechnungsdetails 0/2" clipped
1280: scrollWidth 920 vs clientWidth 906 → 14 px hidden
```

Driven by the long HS/KG label "Wert- und Reparaturkalkulation" — BE and OT don't overflow. It is
**worse on incomplete reports**, i.e. the normal working state: while sections are incomplete the
tabs carry "0/6"-style counters; once complete those collapse to a ✓ and the bar fits. On a fresh
KG report at 1280 the last tab visibly reads "Rechnungsdetai…". The active tab can clip itself.

---

## C. Alignment and sizing

**C1 — Grid rows don't normalise label heights.** Vehicle tab, first row:

```
"Fahrzeug-Identifizierungsnummer (VIN)"  label height 48 px (2 lines) → input top y=521
"DATSCode"                               label height 24 px (1 line)  → input top y=497
"Marktindex"                             label height 24 px (1 line)  → input top y=497
```

The VIN input sits **24 px below** its row siblings. German labels are long, so this will recur
across the app — fix at the field-component level rather than per row.

**C2 — Buttons too narrow for their German labels (text wraps to 2 lines).**

- Settings → Abrechnung → **"Zahlung einrichten"** — 130 × 50 px, `white-space: normal`, ~2 lines
- Settings → Vorlagen → **"Vorlage hinzufügen"** — same pattern

**C3 — Notifications page uses a different container.** Its content sits at x 384–1009 (~672 px)
inside a `main` of 1280 px, while Dashboard and Settings use ~104–1336 (1232 px). Noticeably
narrower and differently gutter-ed than every other page.

**C4 — Signature canvas coordinate mismatch.** `canvas.width=500 / height=200` rendered at roughly
463 × 187 CSS px with no scaling compensation, so ink lands about **8 % up and to the left of the
cursor** — up to ~37 px off at the right edge. On a legally binding signature pad this matters.
Set the backing store from the rendered size (× `devicePixelRatio`) and scale the context.

**C5 — "Neues Gutachten" menu has no collision handling.** It opens downward only; at 1440×900 the
4th item "Oldtimer-Bewertung" lays out at y 892–949 against a 900 px viewport. The page *does*
still scroll with the menu open, so it is reachable — but the item is cut off on open with no
indication there is more below. Flip the menu upward when it would overflow.

---

## D. Contrast and affordance

**D1 — "Logo hochladen" looks disabled but isn't.** Settings → Geschäftsdaten:

```
opacity: 0.45, disabled: false, pointerEvents: auto
color #121312 on white → effective contrast ≈ 3.4:1
```

Fails WCAG AA for normal text (4.5:1) and reads as a disabled control while being fully live.

**D2 — "+" add-photos button stays enabled at the 20-photo cap.** The limit is correctly enforced
server-side (21st upload → 400), but the button still invites the click. Disable it at 20 and say
why.

**D3 — Unexplained warning icon.** A red warning triangle sits beside the "BVSK" fee-schedule
selector on the Invoice tab with no tooltip or message.

**D4 — Two competing Save/Cancel pairs.** Settings → Integrationen shows the DAT form's own
"Abbrechen / Speichern" *and* the page-level "Abbrechen / Aktualisieren" directly beneath it. The
page-level pair has nothing to act on — that tab has no tab-level fields.

**D5 — "Verbinden" stays labelled "Verbinden"** while its own credentials form is expanded below it.

**D6 — Modal doesn't isolate the background.** With the photo annotation modal open, the page
behind it keeps all its buttons in the tab order (`main` has no `inert`, no `aria-hidden`;
"Gutachten generieren" etc. remain `tabIndex >= 0`). Keyboard users can tab out of the modal into
the page beneath it.

**D7 — Empty dropdown.** Condition → **Innenraumzustand** renders with no value *and* no
placeholder text, unlike every sibling dropdown. It looks broken rather than empty. (Its options
load fine once clicked.)

---

## E. Copy and content inconsistencies

**E1 — The upload zone advertises a format it rejects.** The dropzone says **"PDF PNG oder JPG"**
while the guidance panel beside it says "JPG oder PNG Format" and the input is
`accept="image/jpeg,image/png"`. PDF is offered and refused. (Also missing a comma: "PDF, PNG oder
JPG".)

**E2 — "Add more photos" is only reachable from the filmstrip.** After the first upload the grid
view replaces the dropzone and offers no add affordance; the "+" lives in the single-photo view
(`filmstrip.tsx:66`). Users will not find it.

**E3 — Logo empty state reads "Leer".** Literally the word "Empty" inside the dropzone.

**E4 — Nonsense placeholders.** Claimant Postleitzahl shows `R0S312` and Visits shows `eg 006312`
— neither is a German PLZ (5 digits, e.g. `10115`). Nächste HU/AU shows `MM/YY/YY`.

**E5 — Labels read as one run-on phrase.** Calculation: "Wiederbeschaffungswert" and
"Steuersatz wählen" sit on one line with a 16 px gap and no visual separation, so they scan as
*"Wiederbeschaffungswert Steuersatz wählen"*. (Measured — they do **not** overlap; this is a
grouping/spacing problem, not a collision.)

**E6 — Paint-thickness inputs have no `name`.** All 12 `μm` inputs on the Lack diagram render with
an empty `name` attribute.

**E7 — Two different completion metrics side by side.** The tab shows "Fahrzeug 0/3" (sections)
while the header shows "17 % Abgeschlossen" (fields). Both are correct but they disagree visually
with no explanation.

---

## Checked and *not* defects

Worth recording so nobody re-investigates:

- Dashboard plate badge sits **inside** its table cell (79 px clear left, 92 px right).
- The Kennzeichen live-preview badge is a flex **sibling** of its input with a 16 px gap — no overlap.
- Photo prev/next arrows are correct — "Vorheriges Foto" appears from photo 2 onward.
- The unread-count badge colour `#3B82F6` **is** a real design token (`--color-info-blue`).
- Fabric.js annotation works: rectangle drew, saved and persisted to `annotatedUrl`.
- "Leistung (PS) = 190" is correctly derived from 140 kW.
