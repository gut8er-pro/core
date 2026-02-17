# Plan: AI Pipeline Optimization + Figma Alignment (2026-02-17)

## Context

The AI "Generate Report" pipeline works end-to-end but has significant gaps: it extracts data it never saves (tire dotCode/tireType, interior condition/features, vehicle color, calculation fields), uses a US-only VIN decoder (NHTSA) for a German market app, has no incremental processing (re-runs everything on every click), and doesn't handle new photo uploads gracefully. Several report screens are also missing fields and UI elements shown in the Figma designs (tire section missing tireType selector, paint measurements, damage comment tooltips, DAT modal, parkingSensors checkbox, etc.).

**Key behavior rules:**
- **Photo deletion**: Do NOT remove any AI-generated data (damage markers, annotations, etc.) when a photo is deleted. Generated data stays.
- **New photos + re-generate**: When user uploads new photos and clicks Generate, only process new (unprocessed) photos. If new data is extracted, **override** existing fields with the new data. Already-processed photos are skipped.

This plan addresses all of it in 5 phases. Phase 0 creates the Figma registry (used as reference for all alignment work).

---

## Phase 0: Figma Registry + Plan File (FIRST)

### 0.1 Create `docs/figma-registry.md` ✅

Complete registry of all Figma screens with node IDs and full URLs. This file is the single source of truth — reference it whenever aligning any screen.

**File key:** `sh4eXjPxpDydgmoXIYv0cP`
**Base URL:** `https://www.figma.com/design/sh4eXjPxpDydgmoXIYv0cP/Gut8erPRO-%7C-Web-App--Copy-?node-id=`

| Screen | Node ID | Section |
|--------|---------|---------|
| **Welcome Page** | 4104:4773 | Welcome |
| **Login** | 4104:5049 | Auth |
| **Signup > Account** | 4104:5145 | Auth |
| **Signup > Personal** | 4104:5857 | Auth |
| **Signup > Business** | 4104:5531 | Auth |
| **Signup > Plans** | 4104:5655 | Auth |
| **Signup > Integration 1** | 4104:5253 | Auth |
| **Signup > Integration 2** | 4104:5367 | Auth |
| **Signup > Complete** | 4104:5494 | Auth |
| **Home / Dashboard** | 4104:5975 | Home |
| **Home v2** | 4104:6478 | Home |
| **Upload Photos V1** | 4104:2421 | Report - Gallery |
| **Edit Gallery V2** | 4104:4174 | Report - Gallery |
| **Gallery > Generate** | 4104:2929 | Report - Gallery |
| **Draw / Annotate** | 4104:2564 | Report - Gallery |
| **Documents** | 4104:2781 | Report - Gallery |
| **Accident Overview (blank)** | 4104:3053 | Report - Details |
| **Accident Overview (filled)** | 4104:3475 | Report - Details |
| **Digital Signature** | 4104:4342 | Report - Details |
| **Signature Added** | 4104:3886 | Report - Details |
| **Signature Default Selected** | 4104:3907 | Report - Details |
| **Vehicle** | 4104:63 | Report - Details |
| **Condition (Damages tab)** | 4104:620 | Report - Details |
| **Condition (Paint tab)** | 4104:1035 | Report - Details |
| **Vehicle Damages (diagram)** | 4104:460 | Report - Details |
| **Vehicle Damages (comments)** | 4104:502 | Report - Details |
| **Vehicle Paint (diagram)** | 4104:543 | Report - Details |
| **Calculation** | 4104:2153 | Report - Details |
| **DAT Modal** | 4104:1805 | Report - Details |
| **Invoice** | 4104:1503 | Report - Details |
| **Export / Send** | 4104:3940 | Report - Details |
| **Notifications** | 4104:6955 | Secondary |
| **Profile Dropdown** | 4104:6992 | Secondary |
| **Analytics** | 4104:7056 | Secondary |
| **Settings > Profile** | 4104:7398 | Settings |
| **Settings > Business** | 4104:7565 | Settings |
| **Settings > Integrations** | 4104:7729 | Settings |
| **Settings > Billing** | 4104:7852 | Settings |
| **Settings > Templates** | 4104:8081 | Settings |
| **Settings > Templates (alt)** | 4104:8243 | Settings |
| **Settings > Edit Template** | 4104:8435 | Settings |

### 0.2 Save this plan to `docs/plan/2026-02-17-ai-optimization-figma-alignment.md` ✅

---

## Phase 1: AI Pipeline Robustness

### 1.1 Schema migration — add tracking + missing fields ✅

**File:** `prisma/schema.prisma`

| Model | New Field | Purpose |
|-------|-----------|---------|
| Photo | `aiProcessedAt DateTime?` | When last AI-processed |
| Photo | `aiProcessedHash String?` | URL hash for change detection |
| Tire | `dotCode String?` | DOT code (extracted by AI, currently discarded) |
| Tire | `tireType String?` | summer/winter/all-season (extracted, discarded) |
| VehicleCondition | `vehicleColor String?` | From overview analyzer |

### 1.2 Incremental pipeline — skip already-processed photos ✅

**File:** `src/lib/ai/pipeline.ts`

- `PhotoInput` extended with `aiProcessedAt`, `aiProcessedHash`
- `PipelineOptions`: `{ incrementalOnly?: boolean, forcePhotoIds?: string[] }`
- Photos filtered where `aiProcessedAt` is set and URL hash unchanged
- `hashUrl()` utility added

### 1.3 Generate route — incremental + override logic ✅

**File:** `src/app/api/reports/[id]/generate/route.ts`

- Reads `{ incremental?: boolean }` from request body
- Fetches `aiProcessedAt`/`aiProcessedHash` from DB
- Stamps each photo with `aiProcessedAt` and `aiProcessedHash` after processing
- Override strategy: upsert to override existing fields with new data

### 1.4 Persist ALL currently-discarded extracted data ✅

**File:** `src/app/api/reports/[id]/generate/route.ts` — `persistResults()`

| Data | Source Analyzer | Destination Field |
|------|----------------|-------------------|
| dotCode, tireType | tire-analyzer | `Tire.dotCode`, `Tire.tireType` |
| condition, features | interior-analyzer | `VehicleCondition.interiorCondition`, `.specialFeatures`, `.parkingSensors` |
| mileage | interior-analyzer (enhanced) | `VehicleCondition.mileageRead` |
| color | overview-analyzer | `VehicleCondition.vehicleColor` |
| generalCondition | overview-analyzer | `VehicleCondition.generalCondition` |
| severity, repairApproach | damage-analyzer | Enriched `DamageMarker.comment` |

### 1.5 Integrate calculation extractor into pipeline ✅

**File:** `src/lib/ai/pipeline.ts`

- `extractCalculationData()` integrated into pipeline
- Persists to `Calculation` model: damageClass, repairMethod, risks, wheelAlignment, bodyMeasurements, bodyPaint, plasticRepair, repairTimeDays

### 1.6 Photo deletion — keep generated data ✅

No changes needed. Generated data stays when photos are deleted.

### 1.7 Enhance interior analyzer ✅

**File:** `src/lib/ai/interior-analyzer.ts` + `src/lib/ai/types.ts`

Added: `mileage`, `parkingSensors`, `airbagsDeployed`

### 1.8 Client hook — incremental awareness ✅

**File:** `src/hooks/use-generate-report.ts`

- Detects `aiProcessedAt`, sends `{ incremental: true }`
- Shows "Processing X new photos..." vs "Processing all X photos..."

---

## Phase 2: Model & Extraction Optimization

### 2.1 Downgrade overview analyzer to Haiku ✅

Already uses `claude-haiku-4-5-20251001`. Extracts bodyCondition.

### 2.2 European VIN decoder fallback ✅

`lookupVehicleByVinWithFallback()`: NHTSA first, AI Haiku fallback for European VINs.

### 2.3 Enhanced OCR for registration document ✅

`OcrExtractionResult` includes all 17 fields including kbaNumber, previousOwners, lastRegistration, vehicleType, color, seats, transmission.

---

## Phase 3: Figma UI Alignment (Screen by Screen)

### 3.1 Tire section — fields + UI fixes ✅
### 3.2 Damage diagram comment tooltips ✅
### 3.3 Paint measurement input fields ✅
### 3.4 parkingSensors checkbox ✅
### 3.5 Calculation — auto-fill button ✅
### 3.6 DAT modal wiring ✅
### 3.7 Export — recipient chip format ✅

---

## Status: ALL PHASES COMPLETE ✅
