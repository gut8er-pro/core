# Suite 10: Export & Send

## Prerequisites
- Logged in, report with data filled in previous tabs

---

## 10.1 Export Page Layout
- [ ] Sidebar: "Export & Send" active in report nav
- [ ] Left panel (~1/4 width): document toggle switches
- [ ] Right panel (~3/4 width): email composition
- [ ] "Send Report" green button (top right)
- **Figma:** `design/Main report flow/17-Gut8erPRO - Edit  _ Send.png`

## 10.2 Document Toggles (left panel)
- [ ] **Email** section label
- [ ] Recipient selector icons: Individual, Group, Document
- [ ] **4 toggle switches**:
  - Vehicle Valuation (include/exclude valuation in report)
  - Commission (include/exclude commission)
  - Invoice (include/exclude invoice)
  - Lock Report (lock after sending)
- [ ] Each toggle: label on left, switch on right
- [ ] Toggles save state

## 10.3 Email Composition (right panel)
- [ ] **Subject**: text input with date placeholder
- [ ] **Rich text editor** for email body:
  - Toolbar: Bold, Italic, Ordered List, Unordered List, Align Left/Center/Right/Justify, Bookmark
  - Text area with formatting
  - Pre-filled template text (if template selected)
- [ ] Bold/Italic buttons work (text formats)
- [ ] List buttons create bullet/numbered lists
- [ ] Alignment buttons change text alignment

## 10.4 Send Report
- [ ] Enter recipient email
- [ ] Click "Send Report" → loading state on button
- [ ] Success → toast or success message
- [ ] Failure → error message (invalid email, server error)
- [ ] Check: PDF generated includes toggled sections

## 10.5 Report Locking
- [ ] Toggle "Lock Report" ON
- [ ] Click "Send Report" → report sent + locked
- [ ] Navigate to any detail tab (Accident Info, Vehicle, etc.)
- [ ] All form fields disabled/read-only
- [ ] Lock indicator visible (padlock badge near title)
- [ ] Auto-save disabled (no saving indicator)
- [ ] "Update Report" button disabled or hidden
- [ ] Navigate back to Export → Lock toggle still ON
