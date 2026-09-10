/*
  Warnings:

  - Added the required column `updatedAt` to the `Destination` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Destination" ADD COLUMN     "deleted" BOOLEAN,
ADD COLUMN     "updatedAt" TIMESTAMPTZ(3) NOT NULL;
