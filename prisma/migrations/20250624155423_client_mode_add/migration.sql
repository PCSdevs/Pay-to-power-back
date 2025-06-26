-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "adminId" TEXT,
ADD COLUMN     "adminPassword" TEXT,
ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "clientPassword" TEXT,
ADD COLUMN     "hotspotId" TEXT,
ADD COLUMN     "hotspotPassword" TEXT,
ADD COLUMN     "isClientModeOn" BOOLEAN NOT NULL DEFAULT false;
