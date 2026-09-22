# 10 — Date picker: native calendar clashes with the app design

Status: ready-for-agent
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
