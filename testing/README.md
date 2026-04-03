# Gut8erPRO — E2E Testing

Automated end-to-end testing using [Playwright](https://playwright.dev/).

## Quick Start

```bash
# 1. Make sure dev server is running
npm run dev

# 2. Install Playwright browsers (first time only)
npx playwright install

# 3. Run all tests
npm run test:e2e

# 4. Run with UI mode (interactive)
npm run test:e2e:ui
```

## Directory Structure

```
testing/
├── README.md                    # This file
├── e2e/                         # Playwright test specs
│   ├── playwright.config.ts     # Playwright configuration
│   ├── auth.setup.ts            # Login + save session (runs before all tests)
│   ├── helpers/
│   │   └── test-data.ts         # Shared test data (account, form values)
│   ├── 01-auth.spec.ts          # Login, forgot password, signup
│   ├── 02-dashboard.spec.ts     # Dashboard, nav, create report
│   ├── 03-settings.spec.ts      # All 5 settings tabs
│   ├── 04-gallery.spec.ts       # Photo upload, grid, annotation
│   ├── 05-report-types.spec.ts  # HS/BE/KG/OT conditional UI
│   ├── 06-save-reload.spec.ts   # Fill data → reload → verify persistence
│   ├── 07-condition.spec.ts     # Dropdowns, pills, mileage, notes, tires
│   ├── 08-calculation.spec.ts   # HS/BE/KG/OT calculation/valuation
│   ├── 09-invoice.spec.ts       # Invoice settings, line items, BVSK
│   ├── 10-export.spec.ts        # Export toggles, email, send
│   ├── 11-edge-cases.spec.ts    # Validation, rapid input, console errors
│   ├── 12-hs-complete-flow.spec.ts   # Full HS report: create → fill → verify
│   ├── 13-be-complete-flow.spec.ts   # Full BE report: create → fill → verify
│   ├── 14-kg-complete-flow.spec.ts   # Full KG report: create → fill → verify
│   ├── 15-ot-complete-flow.spec.ts   # Full OT report: create → fill → verify
│   └── 16-all-reports-send.spec.ts   # Create all 4 types + send PDF emails
├── testing-images/              # Car photos for upload tests
│   ├── car1.png ... car5.png
├── reference-pdfs/              # Baseline PDFs for comparison
│   ├── HS-Liability-Complete.pdf
│   ├── BE-Valuation-Complete.pdf
│   ├── KG-ShortReport-Complete.pdf
│   ├── OT-Oldtimer-Complete.pdf
│   └── PW_Final_-_*.pdf         # Latest Playwright-generated PDFs
├── reports/                     # QA bug reports (timestamped)
│   ├── 2026-04-03-074500.md
│   ├── 2026-04-03-082500.md
│   ├── 2026-04-03-094500-be.md
│   ├── 2026-04-03-112000-kg.md
│   └── 2026-04-03-113000-ot.md
├── screenshots/                 # Screenshots from test runs
└── suites/                      # Manual test checklists (used by Claude MCP)
    ├── 01-auth.md ... 11-edge-cases.md
```

## Test Account

```
Email: ivanvukasino+2@gmail.com
Password: Ivanivan1!
```

## Test Images

5 car photos in `testing/testing-images/` used for gallery upload tests.

## NPM Scripts

### Run All Tests
```bash
npm run test:e2e           # Run all 16 test files
npm run test:e2e:ui        # Interactive UI mode
```

### Run by Module
```bash
npm run test:e2e:auth          # Login, forgot/reset password
npm run test:e2e:dashboard     # Dashboard, nav, notifications
npm run test:e2e:settings      # Profile, Business, Integrations, Billing, Templates
npm run test:e2e:gallery       # Photo upload, annotation
npm run test:e2e:report-types  # HS/BE/KG/OT conditional sections
npm run test:e2e:save          # Save → reload → verify persistence
npm run test:e2e:condition     # Dropdowns, pills, notes, prior damage
npm run test:e2e:calculation   # All 4 report type calculations
npm run test:e2e:invoice       # Invoice settings, line items
npm run test:e2e:export        # Export toggles, email compose
npm run test:e2e:edge          # VIN validation, rapid input, console errors
```

### Run Complete Flows (per report type)
```bash
npm run test:e2e:hs            # Full HS Liability flow
npm run test:e2e:be            # Full BE Valuation flow
npm run test:e2e:kg            # Full KG Short Report flow
npm run test:e2e:ot            # Full OT Oldtimer flow
npm run test:e2e:flows         # All 4 flows in sequence
```

### Send All Reports via Email
```bash
npm run test:e2e:all-reports   # Create all 4 types, fill data, send to email
```

## Report Types & What's Tested

| Type | Tab 1 | Tab 4 | Key Differences |
|------|-------|-------|-----------------|
| **HS** | Accident Info | Calculation | Full flow: accident, opponent, correction, result cards |
| **BE** | Accident Info | **Valuation** | No accident/opponent, DAT + Manual valuation |
| **KG** | Accident Info | Calculation | Same as HS but NO correction, NO result cards |
| **OT** | **Customer** | **Valuation** | "Client" heading, 2 checkboxes, Market/Replacement/Restoration |

## What Each Test Verifies

### Complete Flow Tests (12-15)
1. Create report via API
2. Upload test photos
3. Fill Accident Info / Customer (claimant, opponent, visits, expert, signature)
4. Fill Vehicle (VIN, specs, icon/chip selectors)
5. Fill Condition (dropdowns, mileage, pills, notes, prior damage)
6. Fill Calculation / Valuation (type-specific fields)
7. Fill Invoice (number, date, line items)
8. Verify save → reload persistence
9. Check tab completion badges
10. Export page renders correctly

### All Reports Send Test (16)
- Creates all 4 report types
- Fills complete data for each
- Navigates to Export & Send
- Enters recipient email + subject
- Clicks "Send Report" button
- Verifies "sent successfully" message
- PDFs sent to `ivanvukasino@gmail.com`

## Reference PDFs

The `testing/reference-pdfs/` folder contains verified baseline PDFs:
- Compare new Playwright-generated PDFs against these
- Use `pdftotext <file>.pdf -` to extract text for comparison
- Key checks: correct subtitle, all sections present, invoice totals calculated, no HS field leaks in BE/OT

## Adding New Tests

1. Create `testing/e2e/XX-name.spec.ts`
2. Add npm script to `package.json`:
   ```json
   "test:e2e:name": "playwright test --config testing/e2e/playwright.config.ts XX-name"
   ```
3. Use `helpers/test-data.ts` for shared constants
4. Follow the pattern: create report → fill data → verify → screenshot

## Troubleshooting

- **"No tests found"**: Make sure dev server is running (`npm run dev`)
- **Auth fails**: Check test account credentials in `helpers/test-data.ts`
- **Timeouts**: Increase `waitForTimeout` values or check network
- **Stale data**: Tests create fresh reports each run, no cleanup needed
- **Screenshots**: Failed test screenshots saved to `testing/screenshots/test-results/`
- **HTML Report**: After run, open `testing/reports/playwright-html/index.html`
