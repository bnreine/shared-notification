/*
  Warnings:

  - Made the column `updatedAt` on table `Destination` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Destination" ALTER COLUMN "updatedAt" SET NOT NULL;
