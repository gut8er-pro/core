
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'COMPLETED', 'SENT', 'LOCKED');

-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('DAT', 'AUDATEX', 'GT_MOTIVE');

-- CreateEnum
CREATE TYPE "PhotoType" AS ENUM ('VEHICLE_DIAGONAL', 'DAMAGE_OVERVIEW', 'DOCUMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "SignatureType" AS ENUM ('LAWYER', 'DATA_PERMISSION', 'CANCELLATION');

-- CreateEnum
CREATE TYPE "NotificationEventType" AS ENUM ('REPORT_COMPLETED', 'REPORT_SENT', 'REPORT_LOCKED', 'REPORT_CREATED', 'INVOICE_GENERATED', 'PAYMENT_RECEIVED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "title" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "professionalQualification" TEXT,
    "avatarUrl" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "linkedin" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "plan" "Plan" NOT NULL DEFAULT 'PRO',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "trialEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "taxId" TEXT NOT NULL,
    "vatId" TEXT,
    "logoUrl" TEXT,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "encryptedCredentials" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Untitled Report',
    "reportType" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "completionPercentage" INTEGER NOT NULL DEFAULT 0,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "aiGenerationSummary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "previewUrl" TEXT,
    "aiUrl" TEXT,
    "filename" TEXT NOT NULL,
    "type" "PhotoType",
    "aiClassification" TEXT,
    "aiDescription" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "annotatedUrl" TEXT,
    "aiProcessedAt" TIMESTAMP(3),
    "aiProcessedHash" TEXT,
    "contentHash" TEXT,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiResult" (
    "contentHash" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "promptVersion" INTEGER NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiResult_pkey" PRIMARY KEY ("contentHash","operation","locale","promptVersion")
);

-- CreateTable
CREATE TABLE "Annotation" (
    "id" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "coordinates" JSONB NOT NULL,
    "fabricJson" JSONB,

    CONSTRAINT "Annotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccidentInfo" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "accidentDay" TIMESTAMP(3),
    "accidentScene" TEXT,

    CONSTRAINT "AccidentInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimantInfo" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "company" TEXT,
    "salutation" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "street" TEXT,
    "postcode" TEXT,
    "location" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "vehicleMake" TEXT,
    "licensePlate" TEXT,
    "eligibleForInputTaxDeduction" BOOLEAN NOT NULL DEFAULT false,
    "isVehicleOwner" BOOLEAN NOT NULL DEFAULT true,
    "representedByLawyer" BOOLEAN NOT NULL DEFAULT false,
    "involvedLawyer" TEXT,

    CONSTRAINT "ClaimantInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpponentInfo" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "company" TEXT,
    "salutation" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "street" TEXT,
    "postcode" TEXT,
    "location" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "insuranceCompany" TEXT,
    "insuranceNumber" TEXT,

    CONSTRAINT "OpponentInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "street" TEXT,
    "postcode" TEXT,
    "location" TEXT,
    "date" TIMESTAMP(3),
    "expert" TEXT,
    "vehicleCondition" TEXT,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpertOpinion" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "expertName" TEXT,
    "fileNumber" TEXT,
    "caseDate" TIMESTAMP(3),
    "orderWasPlacement" TEXT,
    "issuedDate" TIMESTAMP(3),
    "orderByClaimant" BOOLEAN NOT NULL DEFAULT false,
    "mediator" TEXT,

    CONSTRAINT "ExpertOpinion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Signature" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "type" "SignatureType" NOT NULL,
    "imageUrl" TEXT,
    "signedAt" TIMESTAMP(3),

    CONSTRAINT "Signature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleInfo" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "vin" TEXT,
    "datsCode" TEXT,
    "marketIndex" TEXT,
    "manufacturer" TEXT,
    "mainType" TEXT,
    "subtype" TEXT,
    "kbaNumber" TEXT,
    "powerKw" DOUBLE PRECISION,
    "powerHp" DOUBLE PRECISION,
    "engineDesign" TEXT,
    "cylinders" INTEGER,
    "transmission" TEXT,
    "engineDisplacementCcm" INTEGER,
    "firstRegistration" TIMESTAMP(3),
    "lastRegistration" TIMESTAMP(3),
    "sourceOfTechnicalData" TEXT,
    "vehicleType" TEXT,
    "motorType" TEXT,
    "axles" INTEGER,
    "drivenAxles" INTEGER,
    "doors" INTEGER,
    "seats" INTEGER,
    "previousOwners" INTEGER,

    CONSTRAINT "VehicleInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleCondition" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "paintType" TEXT,
    "hard" TEXT,
    "paintCondition" TEXT,
    "generalCondition" TEXT,
    "bodyCondition" TEXT,
    "interiorCondition" TEXT,
    "vehicleColor" TEXT,
    "drivingAbility" TEXT,
    "specialFeatures" TEXT,
    "parkingSensors" BOOLEAN NOT NULL DEFAULT false,
    "mileageRead" INTEGER,
    "estimateMileage" INTEGER,
    "unit" TEXT NOT NULL DEFAULT 'km',
    "nextMot" TIMESTAMP(3),
    "fullServiceHistory" BOOLEAN NOT NULL DEFAULT false,
    "testDrivePerformed" BOOLEAN NOT NULL DEFAULT false,
    "errorMemoryRead" BOOLEAN NOT NULL DEFAULT false,
    "airbagsDeployed" BOOLEAN NOT NULL DEFAULT false,
    "produceGroups" TEXT[],
    "notes" TEXT,
    "manualSetup" BOOLEAN NOT NULL DEFAULT false,
    "previousDamageReported" TEXT,
    "existingDamageNotReported" TEXT,
    "subsequentDamage" TEXT,

    CONSTRAINT "VehicleCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DamageMarker" (
    "id" TEXT NOT NULL,
    "conditionId" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "comment" TEXT,

    CONSTRAINT "DamageMarker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaintMarker" (
    "id" TEXT NOT NULL,
    "conditionId" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "thickness" DOUBLE PRECISION NOT NULL,
    "color" TEXT,
    "position" TEXT,

    CONSTRAINT "PaintMarker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TireSet" (
    "id" TEXT NOT NULL,
    "conditionId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "matchAndAlloy" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TireSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tire" (
    "id" TEXT NOT NULL,
    "tireSetId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "size" TEXT,
    "profileLevel" TEXT,
    "manufacturer" TEXT,
    "usability" INTEGER NOT NULL DEFAULT 1,
    "dotCode" TEXT,
    "tireType" TEXT,

    CONSTRAINT "Tire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Calculation" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "replacementValue" DOUBLE PRECISION,
    "taxRate" TEXT,
    "residualValue" DOUBLE PRECISION,
    "diminutionInValue" DOUBLE PRECISION,
    "wheelAlignment" TEXT,
    "bodyMeasurements" TEXT,
    "bodyPaint" TEXT,
    "plasticRepair" BOOLEAN NOT NULL DEFAULT false,
    "repairMethod" TEXT,
    "risks" TEXT,
    "damageClass" TEXT,
    "dropoutGroup" TEXT,
    "costPerDay" DOUBLE PRECISION,
    "rentalCarClass" TEXT,
    "repairTimeDays" INTEGER,
    "replacementTimeDays" INTEGER,
    "datCalculationResult" JSONB,
    "generalCondition" TEXT,
    "taxation" TEXT,
    "dataSource" TEXT,
    "valuationMax" DOUBLE PRECISION,
    "valuationAvg" DOUBLE PRECISION,
    "valuationMin" DOUBLE PRECISION,
    "valuationDate" TEXT,
    "marketValue" DOUBLE PRECISION,
    "baseVehicleValue" DOUBLE PRECISION,
    "restorationValue" DOUBLE PRECISION,

    CONSTRAINT "Calculation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdditionalCost" (
    "id" TEXT NOT NULL,
    "calculationId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "AdditionalCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "recipientId" TEXT,
    "date" TIMESTAMP(3),
    "payoutDelay" INTEGER,
    "eInvoice" BOOLEAN NOT NULL DEFAULT true,
    "feeSchedule" TEXT NOT NULL DEFAULT 'bvsk',
    "totalNet" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalGross" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 19,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLineItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "specialFeature" TEXT,
    "rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isLumpSum" BOOLEAN NOT NULL DEFAULT false,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "perUnit" DOUBLE PRECISION,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "InvoiceLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportConfig" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "recipientEmail" TEXT,
    "recipientName" TEXT,
    "subject" TEXT,
    "body" TEXT,
    "includeVehicleValuation" BOOLEAN NOT NULL DEFAULT true,
    "includeCommission" BOOLEAN NOT NULL DEFAULT true,
    "includeInvoice" BOOLEAN NOT NULL DEFAULT true,
    "lockReport" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ExportConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" "NotificationEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reportId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Business_userId_key" ON "Business"("userId");

-- CreateIndex
CREATE INDEX "Integration_userId_idx" ON "Integration"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Integration_userId_provider_key" ON "Integration"("userId", "provider");

-- CreateIndex
CREATE INDEX "Report_userId_idx" ON "Report"("userId");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt");

-- CreateIndex
CREATE INDEX "Report_userId_status_idx" ON "Report"("userId", "status");

-- CreateIndex
CREATE INDEX "Photo_reportId_idx" ON "Photo"("reportId");

-- CreateIndex
CREATE INDEX "Photo_reportId_order_idx" ON "Photo"("reportId", "order");

-- CreateIndex
CREATE INDEX "Photo_contentHash_idx" ON "Photo"("contentHash");

-- CreateIndex
CREATE INDEX "AiResult_contentHash_idx" ON "AiResult"("contentHash");

-- CreateIndex
CREATE INDEX "Annotation_photoId_idx" ON "Annotation"("photoId");

-- CreateIndex
CREATE UNIQUE INDEX "AccidentInfo_reportId_key" ON "AccidentInfo"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimantInfo_reportId_key" ON "ClaimantInfo"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "OpponentInfo_reportId_key" ON "OpponentInfo"("reportId");

-- CreateIndex
CREATE INDEX "Visit_reportId_idx" ON "Visit"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpertOpinion_reportId_key" ON "ExpertOpinion"("reportId");

-- CreateIndex
CREATE INDEX "Signature_reportId_idx" ON "Signature"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleInfo_reportId_key" ON "VehicleInfo"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleCondition_reportId_key" ON "VehicleCondition"("reportId");

-- CreateIndex
CREATE INDEX "DamageMarker_conditionId_idx" ON "DamageMarker"("conditionId");

-- CreateIndex
CREATE INDEX "PaintMarker_conditionId_idx" ON "PaintMarker"("conditionId");

-- CreateIndex
CREATE INDEX "TireSet_conditionId_idx" ON "TireSet"("conditionId");

-- CreateIndex
CREATE UNIQUE INDEX "Calculation_reportId_key" ON "Calculation"("reportId");

-- CreateIndex
CREATE INDEX "AdditionalCost_calculationId_idx" ON "AdditionalCost"("calculationId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_reportId_key" ON "Invoice"("reportId");

-- CreateIndex
CREATE INDEX "InvoiceLineItem_invoiceId_idx" ON "InvoiceLineItem"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoiceLineItem_invoiceId_order_idx" ON "InvoiceLineItem"("invoiceId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ExportConfig_reportId_key" ON "ExportConfig"("reportId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Annotation" ADD CONSTRAINT "Annotation_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccidentInfo" ADD CONSTRAINT "AccidentInfo_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimantInfo" ADD CONSTRAINT "ClaimantInfo_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpponentInfo" ADD CONSTRAINT "OpponentInfo_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertOpinion" ADD CONSTRAINT "ExpertOpinion_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signature" ADD CONSTRAINT "Signature_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleInfo" ADD CONSTRAINT "VehicleInfo_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleCondition" ADD CONSTRAINT "VehicleCondition_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DamageMarker" ADD CONSTRAINT "DamageMarker_conditionId_fkey" FOREIGN KEY ("conditionId") REFERENCES "VehicleCondition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaintMarker" ADD CONSTRAINT "PaintMarker_conditionId_fkey" FOREIGN KEY ("conditionId") REFERENCES "VehicleCondition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TireSet" ADD CONSTRAINT "TireSet_conditionId_fkey" FOREIGN KEY ("conditionId") REFERENCES "VehicleCondition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tire" ADD CONSTRAINT "Tire_tireSetId_fkey" FOREIGN KEY ("tireSetId") REFERENCES "TireSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calculation" ADD CONSTRAINT "Calculation_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdditionalCost" ADD CONSTRAINT "AdditionalCost_calculationId_fkey" FOREIGN KEY ("calculationId") REFERENCES "Calculation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportConfig" ADD CONSTRAINT "ExportConfig_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;
┌─────────────────────────────────────────────────────────┐
│  Update available 7.4.0 -> 7.8.0                        │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘

