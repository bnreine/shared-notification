/*
  Warnings:

  - The primary key for the `NotificationDelivery` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `Id` on the `NotificationDelivery` table. All the data in the column will be lost.
  - You are about to drop the column `Status` on the `NotificationDelivery` table. All the data in the column will be lost.
  - You are about to drop the column `Channel` on the `notificationPreference` table. All the data in the column will be lost.
  - You are about to drop the column `Enabled` on the `notificationPreference` table. All the data in the column will be lost.
  - The required column `id` was added to the `NotificationDelivery` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `status` to the `NotificationDelivery` table without a default value. This is not possible if the table is not empty.
  - Added the required column `channel` to the `notificationPreference` table without a default value. This is not possible if the table is not empty.
  - Added the required column `enabled` to the `notificationPreference` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "NotificationDelivery" DROP CONSTRAINT "NotificationDelivery_pkey",
DROP COLUMN "Id",
DROP COLUMN "Status",
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL,
ADD CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "notificationPreference" DROP COLUMN "Channel",
DROP COLUMN "Enabled",
ADD COLUMN     "channel" TEXT NOT NULL,
ADD COLUMN     "enabled" BOOLEAN NOT NULL;

-- CreateTable
CREATE TABLE "notificationConfig" (
    "Id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "notificationConfig_pkey" PRIMARY KEY ("Id")
);
