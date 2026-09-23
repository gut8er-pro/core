# 10 — Date picker: native calendar clashes with the app design

Status: done
Type: design
Severity: medium

All date fields use `<input type="date">`, so the browser's native calendar pops up (client
screenshot: the stock Chrome German picker over the Accident Day field) — visually foreign to
the rest of the app.

## Direction

- Build one styled `DateField` on the existing design tokens (popover calendar, dd.mm.yyyyic
  display, German week start, both locales) and swap it in everywhere a date is edited:
  accident day, case/issued dates, visit date, invoice date, valuation date, HU/AU in condition,
  first registration.
- Keep the underlying value ISO (`yyyy-mm-dd`) so autosave payloads and zod `dateString` stay
  untouched — presentation-only change.
- Typing must stay possible (mask dd.mm.yyyy), not calendar-only — assessors enter dates fast.
- E2E specs fill dates via `input[type=date]` `.fill('2026-09-01')`; keep a hidden native input
  or update the specs' fill helper in the same change.

## Resolution (2026-09-23)

Status: fixed — every date field except the invoice one, which follows in its own change
while that page is being rewritten.

### The component

`src/components/ui/date-field.tsx` is the one primitive, built on the existing tokens — no new
dependency. The calendar grid is plain `Date` arithmetic; the month and weekday names come from
`Intl.DateTimeFormat` against the next-intl locale, so German gets *März 2026* and *Mo Di Mi Do
Fr Sa So* without a translated month table. The week starts Monday in both locales.

Two inputs share the field. The one carrying `name` holds ISO and belongs to whatever registered
it, so `register()` hydration, the auto-save payloads and the zod `dateString` schema never see
anything but `yyyy-mm-dd`. The one on top shows and accepts `dd.mm.yyyy`, masking digits as they
are typed. This is what keeps the E2E suite working unchanged: `.fill('2026-09-01')` on the named
input flows through to the display, and a typed `22.09.1987` flows back as `1987-09-22`. No spec
line needed adjusting.

The popover renders through `createPortal` into the body, anchored to the field's rect. It has
to: `CollapsibleSection` keeps `overflow-hidden` for its accordion animation, which clipped an
absolutely-positioned calendar down to a sliver. It repositions on scroll and resize, and closes
on an outside mousedown.

### Swapped in

`accidentDay`, `caseDate`, `issuedDate`, `visits.N.date`, `nextMot`, `firstRegistration`,
`lastRegistration`, and the BE `valuationDate` — the last through `inputClassName`, which keeps
that card's taller rounded styling. The two vehicle fields gained the `disabled` prop they were
missing, so a locked report now freezes them like every other field.

`common.dateField.*` added to both locales. `condition.nextMotPlaceholder` is now unused; the
field carries the shared `TT.MM.JJJJ` / `dd.mm.yyyy` placeholder instead.

### Verified

`tsc --noEmit` clean; biome clean apart from the same `noStaticElementInteractions` warning
`ComboField` already carries for the identical focus-out pattern. 15 unit tests cover the mask,
the ISO round-trip in both directions, hydration, invalid input, calendar picking, Monday start,
the German and English month names, and disabled. Full vitest: 1244 passed. Playwright
`05-report-types 06-save-reload 07-condition` 32 passed and `12-hs 13-be` 26 passed. A temporary
spec additionally proved every swapped field round-trips through save + reload, that a typed
`22091987` persists as `1987-09-22`, and that a locked report disables both inputs.

Screenshots of the open calendar: `testing/screenshots/datefield-de.png` and `-en.png`.
