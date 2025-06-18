-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_deviceId_fkey";

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
