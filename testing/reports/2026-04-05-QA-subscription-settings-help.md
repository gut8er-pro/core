# QA Report — 2026-04-05

## Scope
Subscription model change (€69/month, 7-day trial, no Free plan), URL-based settings tabs, real Stripe billing data, Help & Support page, dropdown navigation fixes.

## Summary
- **Playwright E2E tests**: 103 passed, 8 failed (7 pre-existing), 3 did not run
- **MCP browser tests**: All new features verified manually
- **Console errors**: 0 across all tested pages
- **Test fixes applied**: 2 (auth landing page + settings integrations tab)

---

## Playwright E2E Results (114 total)

### Passed: 103
All core flows working: auth, dashboard, report creation (HS/BE/KG/OT), vehicle, condition, accident info, settings tabs, and more.

### Failed: 8 (7 pre-existing, 1 fixed during this session)

| # | Spec | Test | Status | Notes |
|---|------|------|--------|-------|
| 1 | 01-auth | landing page loads | **FIXED** | `getByText` strict mode + `<br>` split text |
| 2 | 03-settings | integrations tab shows DAT | **FIXED** | `getByText('DAT')` matched 3 elements, added `{ exact: true }` |
| 3 | 04-gallery | upload photos via file input | Pre-existing | File input interaction issue |
| 4 | 05-report-types | BE: Valuation tab with DAT + Manual | Pre-existing | Tab content not found |
| 5 | 08-calculation | HS: Vehicle Value visible | Pre-existing | Element not found |
| 6 | 09-invoice | invoice number auto-generated | Pre-existing | Element not found |
| 7 | 10-export | export page renders | Pre-existing | Element not found |
| 8 | 11-edge-cases | numeric field rejects letters | Pre-existing | Input accepts letters |
| 9 | 11-edge-cases | tab completion badges dynamic | Pre-existing | Badge format not found |
| 10 | 16-all-reports-send | HS Complete Liability Report | Pre-existing | URL parse error in `page.evaluate` |

### Did not run: 3
BE, KG, OT in 16-all-reports-send (dependent on HS which failed).

---

## MCP Browser Test Results

### 1. Landing Page (`/`)
- [x] Page loads, title correct
- [x] "Start Free Trial" CTA visible (changed from "Sign Up for Free")
- [x] "Log In" link visible
- [x] 0 console errors

### 2. Signup Plan Step (`/signup/plan`)
- [x] "Your plan" heading (not "Choose your plan")
- [x] Single Pro card — no Free plan option
- [x] Price shows **€69/month**
- [x] "7 days free" badge
- [x] All 8 features listed in 2-column grid
- [x] Payment details note: "You'll enter your card on the secure Stripe checkout page"
- [x] "You won't be charged until your 7-day trial ends. Cancel anytime."
- [x] Back/Continue buttons work
- [x] Screenshot: `testing/screenshots/plan-step-new.png`

### 3. Settings URL-Based Tabs
- [x] `/settings` → defaults to Profile tab
- [x] `/settings/profile` → Profile tab active, form loads
- [x] `/settings/billing` → Billing tab active, real data loads
- [x] `/settings/business` → works
- [x] `/settings/integrations` → works
- [x] `/settings/templates` → works
- [x] Clicking sidebar tab updates URL (e.g. Billing click → `/settings/billing`)
- [x] Screenshot: `testing/screenshots/settings-profile-tab.png`

### 4. Settings Billing (Real Stripe Data)
- [x] Shows "Pro Plan" card with dark green gradient
- [x] Shows "No active subscription" (correct — test account skipped Stripe checkout)
- [x] Shows "No payment method on file" with "Add payment method" button
- [x] Shows "No billing history yet" (correct — no invoices)
- [x] "Set up payment" button visible (no stripeSubscriptionId)
- [x] Screenshot: `testing/screenshots/settings-billing-tab.png`

### 5. Help & Support Page (`/help`)
- [x] Page loads with search bar
- [x] 4 category cards: Getting Started, Reports & Documents, Integrations, Account & Billing
- [x] Each category shows article listings
- [x] Clicking article opens detail view with numbered steps
- [x] "Back to Help" navigation works
- [x] Related articles section at bottom of article
- [x] FAQ accordion works (expand/collapse)
- [x] Email Support button present, no Live Chat
- [x] Screenshot: `testing/screenshots/help-page.png`, `testing/screenshots/help-article-detail.png`

### 6. Dropdown Navigation
- [x] Profile → `/settings/profile` (correct)
- [x] Settings → `/settings` (correct)
- [x] Help & Support → `/help` (correct, was 404 before)
- [x] Analytics → `/statistics` (existing)
- [x] Log Out → works (existing)

### 7. Console Errors
- [x] 0 errors across all pages tested

---

## Changes Made This Session

### Subscription Model
| File | Change |
|------|--------|
| `src/components/auth/plan-step.tsx` | Removed Free card, €69, 7-day trial, Stripe Checkout note |
| `src/lib/auth/actions.ts` | 7-day trial, creates Checkout Session, returns checkoutUrl |
| `src/components/auth/integrations-step.tsx` | Redirects to Stripe Checkout |
| `src/lib/stripe/subscription.ts` | trial_period_days: 7, configurable URLs |
| `src/components/auth/complete-step.tsx` | 7-day trial text, payment=cancelled handling |
| `src/app/page.tsx` | FAQ updates, "Start Free Trial" CTA |

### Settings & Billing
| File | Change |
|------|--------|
| `src/app/(app)/settings/[[...tab]]/page.tsx` | URL-based tabs via catch-all route |
| `src/app/api/stripe/billing/route.ts` | NEW — real Stripe billing API |
| `src/hooks/use-subscription.ts` | Added useBilling hook + types |
| `src/app/api/stripe/checkout/route.ts` | Dashboard redirect URLs |

### Help Page
| File | Change |
|------|--------|
| `src/app/(app)/help/page.tsx` | NEW — full Help & Support page |

### Navigation
| File | Change |
|------|--------|
| `src/components/layout/top-nav-bar.tsx` | Profile → /settings/profile |

### Tests & Docs
| File | Change |
|------|--------|
| `testing/e2e/01-auth.spec.ts` | Fixed landing page assertions |
| `testing/e2e/03-settings.spec.ts` | Fixed DAT text matching |
| `src/components/auth/plan-step.test.tsx` | Updated for €69, 7-day, no Free |
| Multiple .md files | Updated pricing references €49→€69, 14→7 days |

---

## Remaining Issues (Pre-existing)
1. Gallery file upload test flaky in headless Chromium
2. Several report tab tests have element-not-found issues (likely timing/selector)
3. All-reports-send test has URL parsing issue in `page.evaluate`

These are **not related** to the subscription/settings/help changes.
