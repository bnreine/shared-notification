/*
  Warnings:

  - You are about to drop the `notificationConfig` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notificationPreference` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "notificationConfig";

-- DropTable
DROP TABLE "notificationPreference";

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "Id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "NotificationConfig" (
    "Id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "NotificationConfig_pkey" PRIMARY KEY ("Id")
);
