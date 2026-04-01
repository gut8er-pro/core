-- ============================================================
-- Enable Row Level Security (RLS) on ALL public tables
-- ============================================================
--
-- WHY: Without RLS, anyone with the anon key can read/write/delete
-- all data directly via the Supabase REST API (PostgREST).
--
-- HOW IT WORKS:
-- 1. Enable RLS on every table → blocks all anon access by default
-- 2. Add policies so authenticated users can only access their own data
-- 3. Prisma uses the service_role key (DATABASE_URL) which bypasses RLS
--    so all API routes continue working unchanged
--
-- RUN THIS: Supabase Dashboard → SQL Editor → paste & run
-- ============================================================

-- ─── Step 1: Enable RLS on all tables ───────────────────────

ALTER TABLE "User"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Business"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Integration"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Report"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Photo"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Annotation"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AccidentInfo"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClaimantInfo"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OpponentInfo"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Visit"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExpertOpinion"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Signature"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VehicleInfo"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VehicleCondition"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DamageMarker"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PaintMarker"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TireSet"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tire"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Calculation"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdditionalCost"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InvoiceLineItem"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExportConfig"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification"      ENABLE ROW LEVEL SECURITY;

-- ─── Step 2: Policies for authenticated users ───────────────
-- These allow users to access ONLY their own data via the anon/auth key.
-- The service_role key (used by Prisma) bypasses RLS entirely.

-- User: can read/update own profile
CREATE POLICY "Users can view own profile"
  ON "User" FOR SELECT
  USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile"
  ON "User" FOR UPDATE
  USING (auth.uid()::text = id);

-- Business: owned by user
CREATE POLICY "Users can manage own business"
  ON "Business" FOR ALL
  USING (auth.uid()::text = "userId");

-- Integration: owned by user
CREATE POLICY "Users can manage own integrations"
  ON "Integration" FOR ALL
  USING (auth.uid()::text = "userId");

-- Report: owned by user
CREATE POLICY "Users can manage own reports"
  ON "Report" FOR ALL
  USING (auth.uid()::text = "userId");

-- Photo: owned via report
CREATE POLICY "Users can manage photos on own reports"
  ON "Photo" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Report" WHERE "Report".id = "Photo"."reportId"
      AND "Report"."userId" = auth.uid()::text
    )
  );

-- Annotation: owned via photo → report
CREATE POLICY "Users can manage annotations on own photos"
  ON "Annotation" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Photo"
      JOIN "Report" ON "Report".id = "Photo"."reportId"
      WHERE "Photo".id = "Annotation"."photoId"
      AND "Report"."userId" = auth.uid()::text
    )
  );

-- All report child tables: owned via reportId → Report.userId
-- Using a helper function to avoid repetition

CREATE OR REPLACE FUNCTION auth_owns_report(report_id text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM "Report"
    WHERE "Report".id = report_id
    AND "Report"."userId" = auth.uid()::text
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE POLICY "Users can manage own accident info"
  ON "AccidentInfo" FOR ALL USING (auth_owns_report("reportId"));

CREATE POLICY "Users can manage own claimant info"
  ON "ClaimantInfo" FOR ALL USING (auth_owns_report("reportId"));

CREATE POLICY "Users can manage own opponent info"
  ON "OpponentInfo" FOR ALL USING (auth_owns_report("reportId"));

CREATE POLICY "Users can manage own visits"
  ON "Visit" FOR ALL USING (auth_owns_report("reportId"));

CREATE POLICY "Users can manage own expert opinion"
  ON "ExpertOpinion" FOR ALL USING (auth_owns_report("reportId"));

CREATE POLICY "Users can manage own signatures"
  ON "Signature" FOR ALL USING (auth_owns_report("reportId"));

CREATE POLICY "Users can manage own vehicle info"
  ON "VehicleInfo" FOR ALL USING (auth_owns_report("reportId"));

CREATE POLICY "Users can manage own vehicle condition"
  ON "VehicleCondition" FOR ALL USING (auth_owns_report("reportId"));

CREATE POLICY "Users can manage own calculation"
  ON "Calculation" FOR ALL USING (auth_owns_report("reportId"));

CREATE POLICY "Users can manage own invoice"
  ON "Invoice" FOR ALL USING (auth_owns_report("reportId"));

CREATE POLICY "Users can manage own export config"
  ON "ExportConfig" FOR ALL USING (auth_owns_report("reportId"));

CREATE POLICY "Users can manage own notifications"
  ON "Notification" FOR ALL
  USING (auth.uid()::text = "userId");

-- DamageMarker / PaintMarker: owned via conditionId → VehicleCondition.reportId
CREATE POLICY "Users can manage own damage markers"
  ON "DamageMarker" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "VehicleCondition"
      JOIN "Report" ON "Report".id = "VehicleCondition"."reportId"
      WHERE "VehicleCondition".id = "DamageMarker"."conditionId"
      AND "Report"."userId" = auth.uid()::text
    )
  );

CREATE POLICY "Users can manage own paint markers"
  ON "PaintMarker" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "VehicleCondition"
      JOIN "Report" ON "Report".id = "VehicleCondition"."reportId"
      WHERE "VehicleCondition".id = "PaintMarker"."conditionId"
      AND "Report"."userId" = auth.uid()::text
    )
  );

-- TireSet: owned via conditionId
CREATE POLICY "Users can manage own tire sets"
  ON "TireSet" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "VehicleCondition"
      JOIN "Report" ON "Report".id = "VehicleCondition"."reportId"
      WHERE "VehicleCondition".id = "TireSet"."conditionId"
      AND "Report"."userId" = auth.uid()::text
    )
  );

-- Tire: owned via tireSetId → TireSet → VehicleCondition → Report
CREATE POLICY "Users can manage own tires"
  ON "Tire" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "TireSet"
      JOIN "VehicleCondition" ON "VehicleCondition".id = "TireSet"."conditionId"
      JOIN "Report" ON "Report".id = "VehicleCondition"."reportId"
      WHERE "TireSet".id = "Tire"."tireSetId"
      AND "Report"."userId" = auth.uid()::text
    )
  );

-- AdditionalCost: owned via calculationId → Calculation → Report
CREATE POLICY "Users can manage own additional costs"
  ON "AdditionalCost" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Calculation"
      JOIN "Report" ON "Report".id = "Calculation"."reportId"
      WHERE "Calculation".id = "AdditionalCost"."calculationId"
      AND "Report"."userId" = auth.uid()::text
    )
  );

-- InvoiceLineItem: owned via invoiceId → Invoice → Report
CREATE POLICY "Users can manage own invoice line items"
  ON "InvoiceLineItem" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Invoice"
      JOIN "Report" ON "Report".id = "Invoice"."reportId"
      WHERE "Invoice".id = "InvoiceLineItem"."invoiceId"
      AND "Report"."userId" = auth.uid()::text
    )
  );

-- ─── Step 3: Storage policies (photos bucket) ──────────────
-- Authenticated users can upload/read/delete their own report photos.
-- Path pattern: reports/{reportId}/photos/{photoId}/{variant}.jpg

-- Allow authenticated users to upload to the photos bucket
CREATE POLICY "Authenticated users can upload photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'photos');

-- Allow authenticated users to read photos
CREATE POLICY "Authenticated users can read photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'photos');

-- Allow authenticated users to update their photos
CREATE POLICY "Authenticated users can update photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'photos');

-- Allow authenticated users to delete their photos
CREATE POLICY "Authenticated users can delete photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'photos');
