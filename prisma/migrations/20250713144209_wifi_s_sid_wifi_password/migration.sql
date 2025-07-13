/*
  Warnings:

  - You are about to drop the column `hotspotName` on the `Device` table. All the data in the column will be lost.
  - You are about to drop the column `hotspotNamePass` on the `Device` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Device" DROP COLUMN "hotspotName",
DROP COLUMN "hotspotNamePass",
ADD COLUMN     "wifiPassword" TEXT,
ADD COLUMN     "wifiSsid" TEXT;
