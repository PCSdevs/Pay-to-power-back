/*
  Warnings:

  - The values [pending,delivered,acknowledged] on the enum `DeliveryStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [created,updated,cancelled,renewed] on the enum `SubscriptionAction` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `connectionid` on the `Device` table. All the data in the column will be lost.
  - You are about to drop the column `secrectkey` on the `Device` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Device` table. All the data in the column will be lost.
  - You are about to drop the column `wifiPassword` on the `Device` table. All the data in the column will be lost.
  - You are about to drop the column `wifiSsid` on the `Device` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the `DeviceConnectionStatus` table. If the table is not empty, all the data it contains will be lost.
  - The required column `apiKey` was added to the `Company` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `boardNumber` to the `Device` table without a default value. This is not possible if the table is not empty.
  - Added the required column `generatedDeviceId` to the `Device` table without a default value. This is not possible if the table is not empty.
  - Added the required column `secreteKey` to the `Device` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DeliveryStatus_new" AS ENUM ('PENDING', 'DELIVERED', 'ACKNOWLEDGED');
ALTER TABLE "Message" ALTER COLUMN "deliveryStatus" DROP DEFAULT;
ALTER TABLE "Message" ALTER COLUMN "deliveryStatus" TYPE "DeliveryStatus_new" USING ("deliveryStatus"::text::"DeliveryStatus_new");
ALTER TYPE "DeliveryStatus" RENAME TO "DeliveryStatus_old";
ALTER TYPE "DeliveryStatus_new" RENAME TO "DeliveryStatus";
DROP TYPE "DeliveryStatus_old";
ALTER TABLE "Message" ALTER COLUMN "deliveryStatus" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "SubscriptionAction_new" AS ENUM ('CREATED', 'UPDATED', 'CANCELLED', 'RENEWED');
ALTER TABLE "SubscriptionHistory" ALTER COLUMN "action" TYPE "SubscriptionAction_new" USING ("action"::text::"SubscriptionAction_new");
ALTER TYPE "SubscriptionAction" RENAME TO "SubscriptionAction_old";
ALTER TYPE "SubscriptionAction_new" RENAME TO "SubscriptionAction";
DROP TYPE "SubscriptionAction_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Device" DROP CONSTRAINT "Device_connectionid_fkey";

-- DropIndex
DROP INDEX "Message_deviceId_category_key";

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "apiKey" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Device" DROP COLUMN "connectionid",
DROP COLUMN "secrectkey",
DROP COLUMN "status",
DROP COLUMN "wifiPassword",
DROP COLUMN "wifiSsid",
ADD COLUMN     "boardNumber" TEXT NOT NULL,
ADD COLUMN     "generatedDeviceId" TEXT NOT NULL,
ADD COLUMN     "secreteKey" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "category",
ALTER COLUMN "deliveryStatus" SET DEFAULT 'PENDING';

-- DropTable
DROP TABLE "DeviceConnectionStatus";

-- DropEnum
DROP TYPE "DeviceStatus";

-- DropEnum
DROP TYPE "MessageCategory";
