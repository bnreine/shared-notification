-- CreateTable
CREATE TABLE "Destination" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channelType" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,
    "metadata" JSONB NOT NULL,
    "oAuthConnectionId" TEXT,

    CONSTRAINT "Destination_pkey" PRIMARY KEY ("id")
);
