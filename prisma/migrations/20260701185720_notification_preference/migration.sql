-- CreateTable
CREATE TABLE "notificationPreference" (
    "Id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "Channel" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "Enabled" BOOLEAN NOT NULL,

    CONSTRAINT "notificationPreference_pkey" PRIMARY KEY ("Id")
);
