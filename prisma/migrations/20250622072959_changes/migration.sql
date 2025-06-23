/*
  Warnings:

  - A unique constraint covering the columns `[generatedDeviceId]` on the table `Device` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Device_generatedDeviceId_key" ON "Device"("generatedDeviceId");
