# E2E production audit — app.gut8erpro.de

Full end-to-end pass over the **production** app before client handover, run 2026-09-14 against
`https://app.gut8erpro.de` in Chrome via Playwright, logged in as `quadrition@gmail.com`.

## Scope actually covered

| Area | Covered |
|------|---------|
| Dashboard, Statistics, Notifications, Help | yes |
| Settings — Profil, Geschäftsdaten, Integrationen, Abrechnung, Vorlagen | yes |
| Report creation | all four types created (HS, BE, KG, OT) |
| Gallery | 20 photos uploaded, 20-photo cap tested, Fabric.js annotation drawn + saved |
| AI generation | ran on HS — 20/20 classified, 19/20 described |
| Report Details | all 5 tabs on HS filled to 100% completeness |
| PDF export | generated for real — 6.86 MB, both `de` and `en` |
| Email send | attempted for real — **failed, see issue 01** |
| Locale | German primary, English spot-checks |
| Viewports | 1440×900 primary, 1280×800 re-check |

## Not covered, and why

- **DAT integration** — connecting DAT needs credentials typed into a password field, which I don't
  do. Everything behind that connection (DAT valuation, DAT-backed repair calculation) is untested.
- **Signup wizard** — creating an account requires setting a password; not exercised.
- **Stripe checkout/portal** — deliberately excluded from the agreed blast radius.
- **BE / KG / OT full fills** — these three were created and their conditional structure verified
  against `CLAUDE.md`, but only HS was driven all the way to PDF + send.

## Test data created

Four reports, all titled "Unbenanntes Gutachten" (the app never prompted for a title, so the
`E2E-TEST` prefix went into the file number / invoice subject instead):

```
HS 1a65cb53-b5a2-44c4-9133-17278bf8936f   (filled 100%, PDF generated, send attempted)
BE 135dfda2-4f93-4377-9a8a-ebaa3ad246d7
KG cfaad8cb-ee31-47b0-bab8-6be25e15f346
OT 8c32689e-db2c-4f25-adbf-11888103f852
```

## Headline result

The app's **two revenue-critical integrations were both pointed at sandbox environments in
production**: Resend had no verified domain (issue 01) and Stripe is in test mode (issue 02).

**Updated 2026-09-15.** `gut8erpro.de` is now verified in Resend, so issue 01's configuration half
is closed and what remains there is code — a grilling session specified it in full. Issue 02 is
unchanged and still blocks on the client's paperwork, so the product still cannot take a payment.

That session also turned up two defects the audit could not have reached, both now filed: the send
route will mark a report sent and lock it while carrying no PDF at all (issue 11), and Sentry —
installed, configured, DSN set — has never captured anything (issue 12).

Separately, issue 03 is a data-integrity defect that silently writes bank details into a vehicle
field on every report type.

## Issues

| # | Title | Severity |
|---|-------|----------|
| 01 | Report email: sender identity unconfigured, provider errors leak to the user | blocker |
| 02 | Stripe runs in test mode in production; subscription state contradicts itself | blocker |
| 03 | Claimant "IBAN" and "Erstes Kennzeichen" write to the wrong database columns | critical |
| 04 | Mock/placeholder data ships in production | high |
| 05 | Settings → Vorlagen is entirely non-functional | high |
| 06 | Dead controls across Dashboard and Statistics | medium |
| 07 | Invoice line-item "Betrag" column always renders 0,00 € | medium |
| 08 | German localisation is incomplete across the app | medium |
| 09 | Report-type variants: headings and one control don't switch correctly | low |
| 10 | UI / layout issues (consolidated) | low–medium |
| 11 | A send with no Gutachten attached still succeeds, and still locks the report | blocker |
| 12 | Sentry is installed, configured, and captures nothing | high |
| 13 | Stripe webhook has never delivered | high |
| 14 | Billing page contradicts itself | medium |
| 15 | Entitlement lifecycle | high |
| 16 | Production API intermittently 500s / hangs on database access | high |
| 17 | AI auto-fill writes values that match no select option | medium |

**Updated 2026-09-15 (second pass).** Issues 04–12 fixed in the working tree and verified
(tsc, biome, 940 unit tests, production build); 16 filed with the code half landed and the
`DATABASE_URL` pooler switch owed by a human; 17 filed as ready-for-agent. Signup wizard and
Stripe test checkout — the two paths the first audit skipped — were exercised live on
`app.gut8erpro.de` and work end-to-end, including the entitlement gate and the completeness
send-gate. Deploy order: run `pnpm db:migrate` against production before or with the next
deploy (two new migrations: email templates, accident-info present flags).

## Method note

Layout defects were found with a DOM audit script injected into each page (measuring
`scrollWidth` vs `clientWidth`, children escaping their parent's content box, canvas-measured
text vs available input width) rather than by eyeballing screenshots, so every measurement in
issue 10 is a real number taken from the live page.

Three of my own intermediate conclusions were wrong and were retracted before filing — invoice
line items *do* persist, tyre sizes *do* persist, and the dashboard plate badge does *not*
overflow its cell. Details are in `findings-raw.md`.
