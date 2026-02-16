# Feature 10: UI Polish & Design Alignment

## Summary

Minor visual fixes to align the implementation 1:1 with Figma designs.

## Fixes

### 1. Gallery Title
- **Current**: "Gallery"
- **Figma**: "Upload Images" (before AI), "Create New Report" (after AI)
- **File**: `src/app/(app)/reports/[id]/gallery/page.tsx`

### 2. KG Badge
- **Current**: None
- **Figma**: Red "KG" badge next to gallery/report title
- This appears to be a report identifier badge
- **File**: Gallery page, report layout

### 3. Login Button Text
- **Current**: "Sign In"
- **Figma**: "Log in"
- **File**: `src/app/(auth)/login/page.tsx`

### 4. Landing Page Stats
- **Current**: "1000+ Reports, 50+ Experts, 4.9 Rating"
- **Figma**: "-35% report time, -60% less manual work, 2000+ reports created"
- **File**: `src/app/page.tsx`

### 5. Instruction Sidebar Redesign
- **Current**: Photo tips (6 bullet points) + 8 suggested photo labels in a 2x4 grid
- **Figma**: "Instruction" section (3 tips with green checks) + "Suggested Photos" (3 categories with thumbnails and descriptions)
  - Vehicle Diagonals — "Front and rear diagonal photos of the vehicle"
  - Damage Overview — "Detailed close-ups of all damaged areas"
  - Document Shot — "Photos of all relevant vehicle documents"
- **File**: `src/components/report/gallery/instruction-sidebar.tsx`

### 6. Annotation Modal Layout
- **Current**: Toolbar at top, canvas full width
- **Figma**: Photo on left (~70%), description panel on right (~30%), toolbar at bottom, filename + date header, navigation arrows
- **File**: `src/components/report/gallery/annotation-modal.tsx`

### 7. Photo Viewer Overlays
- **Current**: Edit + delete buttons visible
- **Figma**: Same but with small icon buttons (edit/annotate icon + trash icon) in bottom-right corner
- Matching design exactly with circular icon buttons

### 8. Damage Diagram "Manual Setup" Toggle
- **Current**: Text differs slightly
- **Figma**: "Damage Manual Setup" with toggle (ON by default when AI has placed markers)
- **File**: `src/components/report/condition/damage-diagram-section.tsx`

### 9. Paint Diagram Labels
- **Current**: "um" (lowercase)
- **Figma**: "um" with proper micro symbol
- **File**: `src/components/report/condition/damage-diagram-section.tsx`

### 10. Calculation "Upload Image to Auto-fill"
- **Current**: Not present
- **Figma**: Green button top-right of calculation page
- See Feature 09

### 11. Condition Tab Checkbox Chips
- **Figma** shows checkbox-style chips for: "Full serviced history", "Test drive performed", "Error memory read", "Airbags deployed"
- Current implementation has these as checkboxes — verify they match design styling

### 12. Smiley Face Indicators
- **Figma** condition tab shows colored smiley/emoji indicators (green happy, yellow neutral, orange concerned, red sad) for condition rating
- Verify these match the current `Fold.Art Groups` section in the design

## Priority

These are LOW priority and should be done last, after all functional features are complete.
