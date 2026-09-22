-- AlterTable
ALTER TABLE "ClaimantInfo" ADD COLUMN     "lawyerFirm" TEXT,
ADD COLUMN     "lawyerStreet" TEXT,
ADD COLUMN     "lawyerPostcode" TEXT,
ADD COLUMN     "lawyerLocation" TEXT,
ADD COLUMN     "lawyerEmail" TEXT,
ADD COLUMN     "lawyerPhone" TEXT;

-- AlterTable
ALTER TABLE "VehicleCondition" ADD COLUMN     "emissionGroup" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "paidAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "website" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "OwnerInfo" (
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

    CONSTRAINT "OwnerInfo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OwnerInfo_reportId_key" ON "OwnerInfo"("reportId");

-- AddForeignKey
ALTER TABLE "OwnerInfo" ADD CONSTRAINT "OwnerInfo_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
