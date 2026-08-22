/*
  Warnings:

  - You are about to drop the column `channel` on the `NotificationPreference` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `NotificationPreference` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "NotificationPreference" DROP COLUMN "channel",
DROP COLUMN "userId";
