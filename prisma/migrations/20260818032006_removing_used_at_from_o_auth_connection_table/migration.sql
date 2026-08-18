/*
  Warnings:

  - You are about to drop the column `usedAt` on the `OAuthConnection` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OAuthConnection" DROP COLUMN "usedAt";
