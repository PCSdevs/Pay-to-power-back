/*
  Warnings:

  - You are about to drop the column `categoryId` on the `Device` table. All the data in the column will be lost.
  - You are about to drop the column `officeId` on the `Device` table. All the data in the column will be lost.
  - You are about to drop the `BillingCycle` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DeviceCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OfficeLocation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BillingCycle" DROP CONSTRAINT "BillingCycle_subscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "Device" DROP CONSTRAINT "Device_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Device" DROP CONSTRAINT "Device_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Device" DROP CONSTRAINT "Device_officeId_fkey";

-- DropForeignKey
ALTER TABLE "DeviceCategory" DROP CONSTRAINT "DeviceCategory_companyId_fkey";

-- DropForeignKey
ALTER TABLE "OfficeLocation" DROP CONSTRAINT "OfficeLocation_userId_fkey";

-- AlterTable
ALTER TABLE "Device" DROP COLUMN "categoryId",
DROP COLUMN "officeId",
ALTER COLUMN "companyId" DROP NOT NULL;

-- DropTable
DROP TABLE "BillingCycle";

-- DropTable
DROP TABLE "DeviceCategory";

-- DropTable
DROP TABLE "OfficeLocation";

-- DropEnum
DROP TYPE "BillingStatus";

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
