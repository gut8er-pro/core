-- AlterTable
ALTER TABLE "ExportConfig" ADD COLUMN     "recipients" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "recipientMode" TEXT;
