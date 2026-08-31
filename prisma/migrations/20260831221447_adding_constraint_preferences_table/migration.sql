/*
  Warnings:

  - A unique constraint covering the columns `[destinationId,configId]` on the table `NotificationPreference` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "preference_destination_configId_unique" ON "NotificationPreference"("destinationId", "configId");
