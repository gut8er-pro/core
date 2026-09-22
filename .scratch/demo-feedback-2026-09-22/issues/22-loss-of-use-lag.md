# 22 — Loss of Use values don't reflect immediately

Status: needs-info
Type: bug
Severity: medium

Client impression on the call: entering Loss of Use values "lags" — what you type doesn't show
up in the dependent output right away ("kao da se ne reflektuje odmah").

## Direction

- First establish WHAT lags: the computed loss-of-use total / result cards, the tab completion
  badge, or the fields themselves after navigation. The likely mechanism: the dependent display
  reads from the SERVER round-trip (autosave debounce 800ms → PATCH → React Query invalidate →
  refetch) instead of computing live from form state with `useWatch` — the same class of thing
  the Betrag column fix solved on the invoice (`invoice-banner.tsx` computes from `useWatch`
  now; `loss-section.tsx` should treat its derived values the same way).
- Reproduce with the network tab open; if the lag is the save cycle, move the derived values to
  client-side computation and leave persistence async as it is.
- Needs-info only for the exact spot the client watched — ask Ivan which number felt stale if
  the reproduction isn't obvious.
