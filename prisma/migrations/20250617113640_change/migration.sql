/*
  Warnings:

  - The primary key for the `BillingCycle` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `DeviceConnectionStatus` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Message` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `SubscriptionHistory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `companyId` to the `Device` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `Device` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `companyId` to the `DeviceCategory` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Device" DROP CONSTRAINT "Device_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Device" DROP CONSTRAINT "Device_connectionid_fkey";

-- DropForeignKey
ALTER TABLE "Device" DROP CONSTRAINT "Device_userId_fkey";

-- AlterTable
ALTER TABLE "BillingCycle" DROP CONSTRAINT "BillingCycle_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "BillingCycle_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "BillingCycle_id_seq";

-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "companyId" TEXT NOT NULL,
ALTER COLUMN "categoryId" DROP NOT NULL,
ALTER COLUMN "connectionid" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "DeviceCategory" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "DeviceConnectionStatus" DROP CONSTRAINT "DeviceConnectionStatus_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "DeviceConnectionStatus_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "DeviceConnectionStatus_id_seq";

-- AlterTable
ALTER TABLE "Message" DROP CONSTRAINT "Message_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Message_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Message_id_seq";

-- AlterTable
ALTER TABLE "SubscriptionHistory" DROP CONSTRAINT "SubscriptionHistory_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "SubscriptionHistory_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "SubscriptionHistory_id_seq";

-- AddForeignKey
ALTER TABLE "DeviceCategory" ADD CONSTRAINT "DeviceCategory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "DeviceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_connectionid_fkey" FOREIGN KEY ("connectionid") REFERENCES "DeviceConnectionStatus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
