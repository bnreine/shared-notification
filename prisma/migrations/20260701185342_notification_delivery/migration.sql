-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "Id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "notificationPreferenceId" TEXT NOT NULL,
    "channelSnapshot" TEXT NOT NULL,
    "destinationSnapshot" TEXT NOT NULL,
    "Status" TEXT NOT NULL,
    "sentAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMPTZ(3) NOT NULL,
    "errorCode" TEXT NOT NULL,
    "errorMessage" TEXT NOT NULL,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("Id")
);
