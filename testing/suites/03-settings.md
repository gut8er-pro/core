# Suite 03: Settings

## Prerequisites
- Logged in

---

## 3.1 Settings Layout (`/settings`)
- [ ] "Account Settings" heading
- [ ] Left sidebar tabs: Profile, Business, Integrations, Billing, Templates
- [ ] Active tab highlighted with green text
- [ ] Tab content area on right

## 3.2 Profile Tab
- [ ] Avatar display with "Remove" red button
- [ ] Upload avatar (click avatar area or button)
- [ ] Fields: First Name, Last Name
- [ ] Title dropdown
- [ ] Email (read-only or editable)
- [ ] Phone number with country code
- [ ] Social media links section: Instagram URL, Facebook URL, LinkedIn URL
- [ ] "Cancel" and "Update" buttons at bottom
- [ ] Fill fields → click Update → toast "Profile saved successfully"
- [ ] **RELOAD** → data persists
- **Figma:** `design/Settings/Settings - Profile.png`

## 3.3 Business Tab
- [ ] "Business Information" heading
- [ ] Fields: Company Name, Website
- [ ] Street, Phone number
- [ ] Steuernummer (Tax ID), USt-IdNr (VAT ID)
- [ ] Email, Brand Name, Token
- [ ] KBA Main Token
- [ ] "Cancel" and "Update" buttons
- [ ] Fill → Update → toast
- [ ] **RELOAD** → persists
- **Figma:** `design/Settings/Settings - Business.png`

## 3.4 Integrations Tab
- [ ] "Connected Services" heading
- [ ] DAT card: logo, "Connected" or "Connect" status
- [ ] Click DAT → shows credentials form or "Disconnect" button
- [ ] Audatex: "Coming Soon" label
- [ ] GT Motive: "Coming Soon" label
- [ ] Connect DAT with test credentials → shows "Connected" status
- [ ] Disconnect → status reverts
- **Figma:** `design/Settings/Settings - Integrations.png`

## 3.5 Billing Tab
- [ ] Plan display: "Pro Plan" card with green gradient
- [ ] Plan details: price, renewal date, features
- [ ] Usage stats: X reports, invoiced amount, unbilled amount
- [ ] "Change Plan" and "Upgrade" buttons (link to Stripe)
- [ ] Payment Method section: card on file or "Add payment method"
- [ ] "Manage" button → opens Stripe customer portal
- [ ] Billing History table: date, description, amount, status, download
- **Figma:** `design/Settings/Settings - Billing.png`

## 3.6 Templates Tab
- [ ] List of saved email templates
- [ ] Each template: name, date, "Remove" red button
- [ ] "Add Template" green button at bottom
- [ ] Click Add → modal with Subject + Body fields
- [ ] Rich text editor for body
- [ ] Save template → appears in list
- [ ] Click existing template → edit modal with Subject + Body pre-filled
- [ ] Remove template → removed from list
- **Figma:** `design/Settings/Settings - Templates.png`, `Settings - Templates alt.png`, `Settings - Edit Template.png`
