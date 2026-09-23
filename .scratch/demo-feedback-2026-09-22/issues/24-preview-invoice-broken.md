# 24 — Preview Invoice does nothing

Status: ready-for-agent
Type: bug
Severity: high

The green "Preview Invoice" button on the Invoice banner: clicking it opens nothing. Client
clicked it live on the call.

## Direction

- `src/components/report/invoice/invoice-banner.tsx` renders the button — check whether a
  handler exists at all and what it is supposed to open (an invoice PDF via the export route, a
  preview modal?). If it was never wired, it is the same dead-control class as audit 06.
- Expected v1: open the generated invoice PDF (the export pipeline already renders the invoice
  section; a dedicated `?section=invoice` or the existing invoice toggle path) in a new tab, or
  an in-app preview modal — whichever the export route already supports with the least new
  surface.
- Coordinate with 25 (claimant block on the invoice) so the preview shows the corrected layout.

## Resolution

Status: fixed (invoice side)

The button was a bare `<Button>` with no handler at all — the same dead-control class as
audit 06. It is now an anchor (`Button asChild` + `<a target="_blank">`) pointing at

    /api/reports/{id}/export?format=pdf&sections=invoice&lang={locale}

`lang` comes from `useLocale()`, so the preview opens in whatever language the assessor is
reading the app in. `reportId` is passed into `InvoiceBanner` from the page rather than read
from `useParams` inside the banner, keeping the component a pure presentational child.

### Contract with the export agent

`sections=invoice` is theirs to implement. Until it lands, the click still 200s and returns
the **full** report PDF — the button is live either way, and narrows to the invoice on its own
once the export route honours the parameter. No change needed here when it does.

The completeness gate applies: a report that does not satisfy its manifest gets the route's
`incomplete` refusal rather than a PDF. That is the existing server-side behaviour and was
deliberately not bypassed for the preview.
