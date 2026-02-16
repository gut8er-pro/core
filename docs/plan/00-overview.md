# Gut8erPRO — AI Report Generation: Master Plan

> Last updated: 2026-02-16
> Figma: https://www.figma.com/design/sh4eXjPxpDydgmoXIYv0cP
> Node: 4104:62 (Main Report Flow)

---

## Vision

Replace the current manual per-photo AI toolbar with a **single "Generate Report" button** that processes ALL uploaded photos through an automated AI pipeline. The user uploads photos, clicks one button, and AI does everything: classify, detect, annotate, extract data, auto-fill all report sections, map damage to the car diagram, and order photos logically.

## Feature Breakdown

| # | Feature | Plan File | Priority |
|---|---------|-----------|----------|
| 1 | **Generate Report Pipeline** | [01-generate-report-pipeline.md](./01-generate-report-pipeline.md) | CRITICAL |
| 2 | **Photo Classifier** | [02-photo-classifier.md](./02-photo-classifier.md) | CRITICAL |
| 3 | **Damage Analyzer** | [03-damage-analyzer.md](./03-damage-analyzer.md) | CRITICAL |
| 4 | **Vehicle Data Lookup** | [04-vehicle-data-lookup.md](./04-vehicle-data-lookup.md) | HIGH |
| 5 | **Damage-to-Diagram Mapping** | [05-damage-diagram-mapping.md](./05-damage-diagram-mapping.md) | HIGH |
| 6 | **Tire Photo Analysis** | [06-tire-analysis.md](./06-tire-analysis.md) | HIGH |
| 7 | **Gallery UI Overhaul** | [07-gallery-ui-overhaul.md](./07-gallery-ui-overhaul.md) | CRITICAL |
| 8 | **Annotation Description Panel** | [08-annotation-description-panel.md](./08-annotation-description-panel.md) | MEDIUM |
| 9 | **Calculation Auto-Fill** | [09-calculation-auto-fill.md](./09-calculation-auto-fill.md) | MEDIUM |
| 10 | **UI Polish & Design Alignment** | [10-ui-polish.md](./10-ui-polish.md) | LOW |

## Implementation Order

```
Phase A: Backend Pipeline
  01-generate-report-pipeline.md
  02-photo-classifier.md
  03-damage-analyzer.md
  04-vehicle-data-lookup.md
  05-damage-diagram-mapping.md
  06-tire-analysis.md

Phase B: Frontend
  07-gallery-ui-overhaul.md
  08-annotation-description-panel.md

Phase C: Extras
  09-calculation-auto-fill.md
  10-ui-polish.md
```

## Architecture Overview

```
User clicks "Generate Report"
         |
         v
+-----------------------------+
|  POST /api/reports/:id/     |
|  generate                   |  SSE streaming endpoint
+-----------------------------+
         |
   +-----+-----+
   |             |
   v             v
Step 1:       Step 2:
CLASSIFY      ROUTE & PROCESS (parallel per type)
(Haiku 4.5)
   |            +-- damage --> Sonnet 4.5 (description + bounding boxes + diagram position)
   |            +-- vin --> Haiku 4.5 (extract VIN) --> Vehicle Lookup API
   |            +-- plate --> Haiku 4.5 (extract plate) --> Vehicle Lookup API
   |            +-- document --> Sonnet 4.5 (full OCR of Zulassungsbescheinigung)
   |            +-- overview --> Sonnet 4.5 (color, make, model, body type)
   |            +-- tire --> Haiku 4.5 (brand, size, tread depth, condition)
   |            +-- interior --> Haiku 4.5 (interior condition, features)
   |
   v
Step 3: AUTO-FILL
  - Write VIN + specs --> Vehicle tab
  - Write plate --> Claimant section
  - Write OCR data --> Vehicle tab (manufacturer, specs, registration dates)
  - Write damage descriptions --> Photo.aiDescription
  - Write bounding box annotations --> Photo.annotations
  - Place damage markers on car diagram SVG --> Condition tab
  - Write tire info --> Condition tab (tire section)
  - Reorder photos by suggested order
  - Write overview description --> general notes

Step 4: RETURN RESULTS
  - Classified & reordered photo list
  - Per-photo AI results with badges
  - Auto-filled field count
  - Damage diagram markers placed
  - Warnings/conflicts
```

## Photo Classifications (8 types)

| Type | Description | AI Model | Auto-fills |
|------|-------------|----------|------------|
| `damage` | Vehicle damage (dents, scratches, cracks) | Sonnet 4.5 | Photo description, bounding boxes, diagram markers |
| `vin` | VIN plate/number | Haiku 4.5 | Vehicle tab (VIN, then vehicle lookup) |
| `plate` | License plate | Haiku 4.5 | Claimant section (plate, then vehicle lookup) |
| `document` | Registration document (Zulassungsbescheinigung) | Sonnet 4.5 | Vehicle tab (manufacturer, model, specs, dates) |
| `overview` | General vehicle photo (full body) | Sonnet 4.5 | Color, make/model, body type, general condition |
| `tire` | Tire close-up | Haiku 4.5 | Tire section (brand, size, tread, condition) |
| `interior` | Interior shots | Haiku 4.5 | Interior condition notes |
| `other` | Unclassifiable | None | No auto-fill |

## Cost Estimation (per report, ~10 photos average)

| Step | Model | Photos | Est. Cost |
|------|-------|--------|-----------|
| Classify | Haiku 4.5 | 10 | ~$0.010 |
| Damage analysis | Sonnet 4.5 | 3 | ~$0.030 |
| VIN detection | Haiku 4.5 | 1 | ~$0.001 |
| Plate detection | Haiku 4.5 | 1 | ~$0.001 |
| Document OCR | Sonnet 4.5 | 1 | ~$0.010 |
| Overview | Sonnet 4.5 | 1 | ~$0.010 |
| Tire analysis | Haiku 4.5 | 2 | ~$0.002 |
| Interior | Haiku 4.5 | 1 | ~$0.001 |
| Vehicle lookup | API call | 1 | ~$0.00 (free APIs) |
| **Total** | | **~10** | **~$0.065** |

At 100 reports/month = ~$6.50/month in AI costs. Well within margin for EUR 49/month subscription.

## Figma Screen References

| Screen | Figma Node | Key Features |
|--------|-----------|--------------|
| Gallery V1 (single view) | `4104:2421` | "Upload Images" title, HD badge, "Generate Report" button, instruction sidebar with suggested photos |
| Gallery V2 (grid view) | `4104:4174` | Same header, masonry grid with edit/delete overlays |
| Gallery after AI | `4104:2929` | "Create New Report" title, report sidebar visible, reordered photos |
| Annotation/Draw | `4104:2564` | Full-screen modal, drawing tools, **AI description panel on right** |
| Document viewer | `4104:2781` | Registration doc with green highlights showing extracted fields |
| Accident Overview | `4104:3053` | Long form with all sections, license plate display, signatures |
| Vehicle tab | `4104:63` | VIN, specs, vehicle details with icon/number selectors |
| Condition tab | `4104:620` | Vehicle condition, **damage diagram with markers**, tires, prior damage |
| Damage diagram | `4104:460` | SVG car with numbered markers and comment tooltips |
| Paint diagram | `4104:543` | SVG car with color-coded thickness badges |
| Calculation | `4104:2153` | Two-column layout, **"Upload Image to Auto-fill" button** |
| Invoice | `4104:1503` | Green banner, BVSK rates, line items |
| Export & Send | `4104:3940` | Email composer, toggles, "Send Report" button |
