# Suite 04: Gallery — Photo Upload & Annotation

## Prerequisites
- Logged in, new report created (any type)

---

## 4.1 Upload Phase (empty gallery)
- [ ] Page title: "Upload Images" with report type badge
- [ ] Left sidebar: "Instruction" section with bullet points:
  - "Good light, no flash"
  - "JPG or PNG format"
  - "Maximum 20 images"
- [ ] "Suggested Photos" below instructions:
  - Vehicle Diagonals image
  - Damage Overview image
  - Document Shot image
- [ ] Main area: upload zone with cloud icon
- [ ] "Drag and drop here or click to upload" text
- [ ] No report sidebar yet (Gallery/Report Details/Export hidden)
- [ ] No "Generate Report" button yet
- **Figma:** `design/Main report flow/01-Gut8erPRO - Edit  _ Upload Photos V1.png`

## 4.2 Upload Photos
- [ ] Click upload zone → file picker opens (accepts JPG/PNG)
- [ ] Select 3+ photos → upload progress bar appears
- [ ] Photos appear in grid after upload
- [ ] Each photo shows: thumbnail, edit icon (pencil), delete icon (trash)
- [ ] Photo count shown (e.g. "5 Photos")
- [ ] Filmstrip (horizontal thumbnails) at bottom
- [ ] **Edge: Upload non-image** → rejected with error
- [ ] **Edge: Upload 21st photo** → error "Maximum 20 images"

## 4.3 Grid View
- [ ] Photos in multi-column grid
- [ ] Click photo → switches to single photo view
- [ ] Instruction sidebar still visible
- [ ] "Generate Report" button appears in header (green)
- **Figma:** `design/Main report flow/02-Gut8erPRO - Edit  _ Edit Gallery V2.png`

## 4.4 Single Photo View
- [ ] Large photo display
- [ ] Filmstrip at bottom with all thumbnails (active one highlighted)
- [ ] Click filmstrip thumbnail → switches to that photo
- [ ] Left/right arrows for navigation
- [ ] Classification badge on photo (if AI classified): "Damage", "Overview", "Interior", etc.
- [ ] "Back to gallery" link above photo
- [ ] AI description text below or beside photo (if generated)

## 4.5 Annotation Modal
- [ ] Click edit/pencil icon on photo → opens full-screen annotation modal
- [ ] Modal header: photo filename + date (e.g. "car4.png 01.04.2026 - 12:54")
- [ ] Close button (X) top-right
- [ ] **Image display**: full image visible (not cropped), contained within canvas area
- [ ] **Left/Right arrows**: navigate between photos without closing modal
- [ ] **Description panel** (right side, desktop): AI description text
- [ ] Green edit button on description panel
- [ ] Edit description → textarea with Cancel/Save
- [ ] **Toolbar** (bottom center): pen, crop, circle, rectangle, arrow, delete tools
- [ ] **Color palette**: 12+ colors in bottom toolbar
- [ ] Draw with pen → freehand annotation visible
- [ ] Draw circle → circle appears on image
- [ ] Draw rectangle → rectangle appears on image
- [ ] Draw arrow → arrow with head appears
- [ ] Delete tool → removes last annotation
- [ ] "Save" button → annotations saved
- [ ] Close modal → annotations persist on photo
- [ ] Reopen modal → annotations still visible
- [ ] "Gut8erPRO" watermark visible at bottom-left
- **Figma:** `design/Main report flow/04-Gut8erPRO - Edit  _ Draw.png`

## 4.6 Generate Report
- [ ] Click "Generate Report" button
- [ ] Progress indicator appears (spinner or progress bar)
- [ ] After completion:
  - Summary banner: "Report generated successfully" (or similar)
  - Dismiss X on summary banner → banner disappears
  - Instruction sidebar replaced by report sidebar (Gallery, Report Details, Export & Send)
  - Title changes to "Create New Report"
  - Auto-selects first photo in single view
- [ ] AI classifications appear on photos (badges)
- [ ] AI descriptions appear for photos
- [ ] **Edge: Generate again with same photos** → prevented (no duplicate generation)
- **Figma:** `design/Main report flow/03-Gut8erPRO - Edit  _ Gallery _ Generate calculation.png`

## 4.7 Document Viewer
- [ ] Upload a vehicle document photo (Zulassungsbescheinigung)
- [ ] Open in annotation modal → shows document with highlighted text fields
- [ ] Green highlights on detected data (VIN, registration, etc.)
- **Figma:** `design/Main report flow/05-Gut8erPRO - Edit  _ Documents.png`

## 4.8 Photo Delete
- [ ] Click delete icon on photo → photo removed from gallery
- [ ] Photo count decreases
- [ ] If last photo deleted → returns to upload zone
- [ ] Filmstrip updates
