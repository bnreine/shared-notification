-- CreateTable
CREATE TABLE "Verify" (
    "id" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,

    CONSTRAINT "Verify_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerifyEvent" (
    "id" TEXT NOT NULL,
    "verifyId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "VerifyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "verify_destination_unique" ON "Verify"("destinationId");
