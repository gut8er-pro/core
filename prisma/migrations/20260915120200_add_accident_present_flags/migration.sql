-- AlterTable
ALTER TABLE "AccidentInfo" ADD COLUMN     "presentExpert" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "presentClient" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "presentWorkshopEmployee" BOOLEAN NOT NULL DEFAULT false;
