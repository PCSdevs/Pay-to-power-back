/*
  Warnings:

  - The required column `secrectkey` was added to the `Device` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "secrectkey" TEXT NOT NULL;
