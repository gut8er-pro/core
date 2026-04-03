# Suite 11: Edge Cases & Cross-Cutting Concerns

---

## 11.1 Auto-Save Behavior
- [ ] Fill a text field, click away (blur) → "Saving..." indicator appears briefly
- [ ] No toast on auto-save (silent, only inline indicator)
- [ ] Click "Update Report" → toast "Report updated" shown
- [ ] Fill field, immediately switch to different tab → data saved (flush on unmount)
- [ ] Close browser tab with unsaved changes → beforeunload warning dialog
- [ ] Auto-save debounce: fill 3 fields rapidly → only 1 API call (batched)
- [ ] Failed save → error indicator, data put back in queue for retry

## 11.2 Input Validation
- [ ] **VIN**: type 18+ characters → only 17 accepted (maxLength)
- [ ] **Email fields**: enter "notanemail" → no server-side rejection (loose validation)
- [ ] **Postcode**: accepts up to 10 characters (not restricted to 5-digit German)
- [ ] **Numeric fields** (mileage, values): enter letters → field rejects or ignores
- [ ] **Currency fields**: enter "abc" → saves as null, not NaN
- [ ] **Date fields**: accept YYYY-MM-DD format from date picker
- [ ] **Textarea fields**: accept multiline text, long content (up to 2000 chars)

## 11.3 Tab Completion Tracking
- [ ] Fresh report: all tabs show "0/N" (N varies by type)
- [ ] Fill one section in Vehicle → badge updates to "1/4"
- [ ] Fill all 4 Vehicle sections → green checkmark replaces badge
- [ ] HS report: Accident Info shows "0/6" (6 sections)
- [ ] OT report: Customer shows "0/4" (4 sections — no accident/opponent)
- [ ] BE calculation: "0/3" (3 sections)
- [ ] OT calculation: "0/3" (3 sections)
- [ ] "Show missing" banner: "X sections need attention" count matches total missing

## 11.4 Report Locking
- [ ] Lock via Export page toggle
- [ ] Navigate to Accident Info → all fields disabled
- [ ] Navigate to Vehicle → all fields disabled
- [ ] Navigate to Condition → all fields disabled
- [ ] Navigate to Calculation → all fields disabled
- [ ] Navigate to Invoice → all fields disabled
- [ ] Auto-save indicator doesn't appear (disabled)
- [ ] "Update Report" button disabled or hidden

## 11.5 Photo Edge Cases
- [ ] Upload 0 photos → upload zone shown, no "Generate Report" button
- [ ] Upload 1 photo → grid view with 1 photo, generate available
- [ ] Upload 20 photos → all shown, upload still works for 20th
- [ ] Upload 21st → error "Maximum 20 images" or upload blocked
- [ ] Delete all photos → returns to upload zone (Phase 1)
- [ ] Upload non-image file (PDF, TXT) → rejected with error

## 11.6 Annotation Canvas
- [ ] Open annotation → full image visible (not cropped)
- [ ] Draw with pen → line appears
- [ ] Switch color → next drawing uses new color
- [ ] Draw circle → visible on image
- [ ] Draw arrow → arrow with head visible
- [ ] Save → close → reopen → all annotations preserved
- [ ] Navigate to next photo via arrows → different image loads
- [ ] Save annotated image → annotatedUrl updated in photo record

## 11.7 Rapid Input / Browser Autofill
- [ ] Tab through 5+ fields quickly in Claimant section → all values captured
- [ ] Browser autofill (Chrome address autofill) fills multiple fields → all values saved
- [ ] Paste into field → value captured on blur

## 11.8 Navigation Edge Cases
- [ ] Direct URL access to `/reports/[invalid-id]/gallery` → 404 or redirect
- [ ] Direct URL access to `/reports/[id]/details/vehicle` → loads (if authenticated)
- [ ] Browser back/forward between tabs → correct tab loads
- [ ] Refresh on any tab → same tab loads with data

## 11.9 Console Errors
- [ ] After each page load: check `browser_console_messages` for JS errors
- [ ] No uncaught exceptions
- [ ] No failed network requests (4xx/5xx) during normal operations
- [ ] No broken images (404 for image URLs)

## 11.10 Responsive (Desktop)
- [ ] 1024px width → all content visible, no horizontal scroll
- [ ] 1280px width → comfortable layout
- [ ] 1536px+ → no stretched elements, max-widths respected
