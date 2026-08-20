/*
  Warnings:

  - You are about to drop the column `metadata` on the `OAuthConnection` table. All the data in the column will be lost.
  - Added the required column `authData` to the `OAuthConnection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `channelType` to the `OAuthConnection` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OAuthConnection" DROP COLUMN "metadata",
ADD COLUMN     "authData" JSONB NOT NULL,
ADD COLUMN     "channelType" TEXT NOT NULL;
